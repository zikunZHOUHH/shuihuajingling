import json
import time
import hmac
import hashlib
import base64
import urllib.parse
from datetime import datetime, timezone, timedelta
import asyncio
import websockets
import ssl
import uuid

# 全局配置：与服务端确认的固定参数 (参考 Demo)
FIXED_PARAMS = {
    "audio_encode": "pcm_s16le",
    "lang": "autodialect",
    "samplerate": "16000"
}
# 16k采样率，16bit位深，单声道 => 32KB/s => 32 bytes/ms
# Demo 建议 40ms 发送 1280 bytes
AUDIO_FRAME_SIZE = 1280 
FRAME_INTERVAL_S = 0.04 # 40ms

class XunfeiASRService:
    def __init__(self, app_id, api_key, api_secret):
        self.app_id = app_id
        self.access_key_id = api_key      # API_KEY 对应 accessKeyId
        self.access_key_secret = api_secret # API_SECRET 对应 accessKeySecret
        
        # 使用 Demo 提供的 URL
        self.base_url = "wss://office-api-ast-dx.iflyaisol.com/ast/communicate/v1"

    def _get_utc_time(self):
        """生成服务端要求的UTC时间格式：yyyy-MM-dd'T'HH:mm:ss+0800"""
        beijing_tz = timezone(timedelta(hours=8))
        now = datetime.now(beijing_tz)
        return now.strftime("%Y-%m-%dT%H:%M:%S%z")

    def create_url(self):
        """生成鉴权 URL (参考 Demo _generate_auth_params)"""
        auth_params = {
            "accessKeyId": self.access_key_id,
            "appId": self.app_id,
            "uuid": uuid.uuid4().hex,
            "utc": self._get_utc_time(),
            **FIXED_PARAMS
        }

        # 计算签名：过滤空值 → 字典序排序 → URL编码 → 拼接基础字符串
        sorted_params = dict(sorted([
            (k, v) for k, v in auth_params.items()
            if v is not None and str(v).strip() != ""
        ]))
        
        base_str = "&".join([
            f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(v, safe='')}"
            for k, v in sorted_params.items()
        ])

        # HMAC-SHA1 加密 + Base64编码
        signature = hmac.new(
            self.access_key_secret.encode("utf-8"),
            base_str.encode("utf-8"),
            hashlib.sha1
        ).digest()
        
        auth_params["signature"] = base64.b64encode(signature).decode("utf-8")
        
        # 生成完整 URL
        params_str = urllib.parse.urlencode(auth_params)
        return f"{self.base_url}?{params_str}"

    async def stream_audio(self, audio_generator, callback):
        """
        连接讯飞 RTASR WebSocket 并流式发送音频
        """
        url = self.create_url()
        print(f"Connecting to Xunfei RTASR: {url[:60]}...", flush=True)
        
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        try:
            async with websockets.connect(url, ssl=ssl_context, ping_interval=20, ping_timeout=20) as ws:
                print("Connected to Xunfei RTASR", flush=True)
                
                # 接收任务
                async def receive_msg():
                    try:
                        while True:
                            try:
                                msg = await ws.recv()
                            except websockets.exceptions.ConnectionClosed:
                                print("ASR WebSocket connection closed by remote", flush=True)
                                break
                                
                            msg_json = json.loads(msg)
                            # print(f"Received from Xunfei: {str(msg_json)[:200]}...", flush=True)
                            
                            action = msg_json.get("action")
                            code = msg_json.get("code")
                            
                            if code != "0":
                                print(f"ASR Error Code: {code}, Msg: {msg_json}", flush=True)
                                # 不一定立即退出，有些错误可能是非致命的
                                if code != "00000": # 假设 0 是成功
                                     pass 

                            if action == "result":
                                data_str = msg_json.get("data")
                                if data_str:
                                    try:
                                        # data 字段通常是一个 JSON 字符串，需要再次解析
                                        data = json.loads(data_str)
                                        
                                        # 解析 RTASR 结果结构 (需要根据实际返回调整)
                                        # 假设结构: {"cn": {"st":..., "cw": [...]}, "seg_id": ...}
                                        # 或者: {"cw": [{"w": "你好", ...}]}
                                        
                                        # 尝试提取中文文本
                                        text = ""
                                        is_final = False # RTASR 通常是流式的，没有明确的“一句话结束”标志，或者通过 seg_id 变化判断
                                        
                                        cn_data = data.get("cn", {})
                                        st_data = cn_data.get("st", {})
                                        type_val = st_data.get("type") # 0:最终结果, 1:中间结果(动态修正)
                                        
                                        # 提取词语
                                        # 结构可能是 data['cn']['st']['rt'][0]['ws'][0]['cw'][0]['w']
                                        # 但 Demo 没给解析逻辑，我们先尝试一种通用的深度搜索或假设结构
                                        
                                        # 观察日志后修正。先尝试打印完整 data 以便调试
                                        # print(f"RTASR Data: {data}", flush=True)
                                        
                                        # 简化的解析逻辑 (适配常见 RTASR 格式)
                                        st = st_data
                                        if "rt" in st:
                                            for rt in st["rt"]:
                                                for ws_item in rt.get("ws", []):
                                                    for cw in ws_item.get("cw", []):
                                                        if "w" in cw:
                                                            text += cw["w"]
                                        
                                        if text:
                                            # type=0 (最终), type=1 (中间)
                                            # 前端处理逻辑: 
                                            # 我们可以直接发给前端，让前端拼接
                                            # 但为了兼容之前的 ChatView 逻辑 (append / replace)，我们需要告诉前端是否是中间结果
                                            
                                            # RTASR 的中间结果通常会带 pgs (progress?) 
                                            # 或者我们可以简单地只发最终结果？不行，用户要“边说边显”
                                            
                                            # 策略：直接发送文本。
                                            # 注意：RTASR 的中间结果可能会不断刷新同一段话。
                                            # 如果 type==1，说明是中间结果（可能会变）。
                                            # 如果 type==0，说明是这一句的最终结果。
                                            
                                            print(f"ASR Text: {text}, Type: {type_val}", flush=True)
                                            
                                            # 构造发给前端的数据
                                            # 为了兼容 ChatView，我们可以总是发 text
                                            # 但 ChatView 现在逻辑是：收到 text 就 append
                                            # 如果 RTASR 发送的是“重复的修正文本”，append 会导致重复
                                            # 例如： "你" -> "你好" -> "你好吗"
                                            # ChatView append 后变成 "你你好你好吗"
                                            
                                            # 所以我们需要在后端处理去重，或者通知前端清空重写？
                                            # RTASR 的 type=1 时，通常包含该句的完整当前识别结果
                                            # 我们可以发送一个标志给前端，让前端知道这是“覆盖更新”还是“追加”
                                            
                                            # 现在的 ChatView 逻辑：
                                            # if (data.text) setInputValue(baseText + data.text)
                                            # 这其实是“追加”模式（基于 baseText）。
                                            # 但如果 ws.onmessage 多次触发，每次都是“追加”到 baseText 后面？
                                            # 不，setInputValue 是 react state。
                                            # 之前逻辑：setInputValue(prev => prev + data.text) -> 追加
                                            # 最新逻辑：setInputValue(baseTextRef.current + data.text) -> 这里的 data.text 必须是“当前句子的完整文本”
                                            
                                            # 如果 RTASR 返回的是增量（diff），我们需要自己拼接。
                                            # 如果 RTASR 返回的是全量（当前句），那直接发给前端正好。
                                            
                                            # 假设 RTASR 返回的是全量（当前句的完整识别）。
                                            await callback({"text": text, "is_final": type_val == "0"})
                                            
                                    except Exception as e:
                                        print(f"Error parsing RTASR data: {e}, Raw: {data_str}", flush=True)

                    except Exception as e:
                        print(f"Error receiving from Xunfei: {e}", flush=True)

                # 发送任务
                async def send_audio():
                    try:
                        # 缓冲区，用于积攒到 1280 bytes
                        buffer = bytearray()
                        
                        async for chunk in audio_generator:
                            if not chunk: continue
                            
                            buffer.extend(chunk)
                            
                            # 按照 1280 bytes 分片发送
                            while len(buffer) >= AUDIO_FRAME_SIZE:
                                frame = buffer[:AUDIO_FRAME_SIZE]
                                buffer = buffer[AUDIO_FRAME_SIZE:]
                                
                                await ws.send(frame)
                                # 严格控制发送间隔，避免发太快
                                await asyncio.sleep(FRAME_INTERVAL_S) 
                        
                        # 发送剩余数据
                        if len(buffer) > 0:
                            await ws.send(buffer)
                            
                        # 发送结束标记 (RTASR 协议如何结束？Demo 好像没写明确的结束帧，只断开？)
                        # Demo: 发完数据后，等待接收完结果，然后 close
                        # 这里我们发送一个特殊标记？或者直接发空包？
                        # RTASR 通常发送 {"end": true} 的 bytes? 
                        # 查阅资料：RTASR 结束发送空帧或特定 JSON
                        # Demo: while True: ... break. 没写特殊结束包。
                        # 我们发送一个空 bytes 试试
                        await ws.send(b"{\"end\": true}") 
                        print("Sent end signal to Xunfei", flush=True)
                        
                    except Exception as e:
                        print(f"Error sending to Xunfei: {e}", flush=True)

                # 并发运行
                await asyncio.gather(receive_msg(), send_audio())
                
        except Exception as e:
            print(f"ASR Connection failed: {e}", flush=True)
            await callback({"error": str(e)})
