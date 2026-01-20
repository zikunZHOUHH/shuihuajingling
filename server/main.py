from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
import uvicorn
import json
from pathlib import Path
from asr_service import XunfeiASRService
import asyncio

# Load environment variables from .env.local in root
# Use absolute path resolution to be safe regardless of where script is run from
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env.local")

app = FastAPI()

# 配置 CORS，允许前端(localhost:3000)访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

# 移动 ssl import 到全局，避免每次连接重复创建开销
import ssl
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

@app.websocket("/api/asr")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket client connected for ASR", flush=True)
    
    app_id = os.getenv("XUNFEI_APP_ID")
    api_key = os.getenv("XUNFEI_API_KEY")
    api_secret = os.getenv("XUNFEI_API_SECRET")
    
    if not app_id or not api_key:
        print("XUNFEI credentials missing (AppID/APIKey)", flush=True)
        await websocket.close(code=1008, reason="Server configuration error")
        return
    
    if not api_secret:
        print("Warning: XUNFEI_API_SECRET is missing. Authentication may fail.", flush=True)

    asr_service = XunfeiASRService(app_id, api_key, api_secret)
    
    # 创建一个队列用于从 WebSocket 接收音频数据并传递给 ASR 服务
    audio_queue = asyncio.Queue()
    
    async def audio_generator():
        while True:
            data = await audio_queue.get()
            if data is None: # 结束信号
                break
            yield data

    async def send_result_to_client(result):
        try:
            await websocket.send_json(result)
        except Exception as e:
            print(f"Error sending result to client: {e}", flush=True)

    # 启动 ASR 服务任务
    asr_task = asyncio.create_task(asr_service.stream_audio(audio_generator(), send_result_to_client))

    try:
        while True:
            # 接收前端传来的消息（可能是二进制音频，也可能是文本控制指令）
            message = await websocket.receive()
            
            if "bytes" in message:
                data = message["bytes"]
                if len(data) > 0:
                     await audio_queue.put(data)
            elif "text" in message:
                text = message["text"]
                if text == "STOP":
                    print("Received STOP signal from client", flush=True)
                    await audio_queue.put(None) # 发送结束信号给 ASR 服务
                    # 继续循环，等待接收 ASR 结果并发送给前端，直到连接关闭
                else:
                    print(f"Received unknown text: {text}", flush=True)
            
    except WebSocketDisconnect:
        print("Client disconnected", flush=True)
        await audio_queue.put(None) # 停止 generator
    except Exception as e:
        print(f"WebSocket error: {e}", flush=True)
        await audio_queue.put(None)
    finally:
        # 等待 ASR 任务结束
        await asr_task

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    # 从环境变量获取本地 LLM 配置
    base_url = os.getenv("LOCAL_LLM_BASE_URL")
    api_key = os.getenv("LOCAL_LLM_API_KEY", "not-needed")
    model = os.getenv("LOCAL_LLM_MODEL", "local-model")
    
    # 获取可选参数
    try:
        temperature = float(os.getenv("LOCAL_LLM_TEMPERATURE", "0.7"))
    except ValueError:
        temperature = 0.7
        
    try:
        max_tokens = int(os.getenv("LOCAL_LLM_MAX_TOKENS", "2000"))
    except ValueError:
        max_tokens = 2000

    if not base_url:
        raise HTTPException(status_code=500, detail="LOCAL_LLM_BASE_URL not set in .env.local")

    try:
        print(f"Sending request to LLM: {model} at {base_url}", flush=True)
        # 初始化 OpenAI 客户端（用于连接本地兼容接口）
        client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key
        )
        
        system_instruction = """
        你是一个特别细心的编程助手。
        """

        # 调用本地大模型
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": request.message}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        content = response.choices[0].message.content
        print(f"LLM Raw Response: {content}", flush=True)
        
        return {
            "content": content
        }
        
    except Exception as e:
        print(f"Error calling Local LLM: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def read_root():
    return {
        "status": "ok", 
        "message": "Python Backend is running (Local LLM Mode)!", 
        "framework": "FastAPI"
    }

if __name__ == "__main__":
    # 启动服务，端口 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
