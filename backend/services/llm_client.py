"""LLM 客户端 - 封装阿里云 DashScope API，支持多Key容错"""
import asyncio
import httpx
from openai import AsyncOpenAI
from backend.config import API_KEYS, DASHSCOPE_BASE_URL, LLM_MODEL_FAST, LLM_MODEL_PLUS

# 为每个 Key 创建 client
_clients = []
_current_key_index = 0


def _init_clients():
    global _clients
    _clients = []
    for key in API_KEYS:
        http_client = httpx.AsyncClient(
            base_url=DASHSCOPE_BASE_URL,
            follow_redirects=True,
            timeout=60.0,
        )
        client = AsyncOpenAI(
            api_key=key,
            base_url=DASHSCOPE_BASE_URL,
            http_client=http_client,
        )
        _clients.append(client)


_init_clients()


def _get_client():
    """获取当前client"""
    global _current_key_index
    if not _clients:
        raise RuntimeError("No API keys configured")
    return _clients[_current_key_index % len(_clients)]


def _switch_key():
    """切换到下一个key"""
    global _current_key_index
    _current_key_index = (_current_key_index + 1) % len(_clients)


async def chat_completion(messages: list, model: str = None, temperature=0.8, max_tokens=500) -> str:
    """非流式调用，自动容错切换Key"""
    if model is None:
        model = LLM_MODEL_FAST

    last_error = None
    for attempt in range(len(_clients)):
        try:
            client = _get_client()
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            last_error = e
            _switch_key()
    raise last_error


async def chat_completion_stream(messages: list, model: str = None, temperature=0.8, max_tokens=500):
    """流式调用，自动容错切换Key"""
    if model is None:
        model = LLM_MODEL_FAST

    last_error = None
    for attempt in range(len(_clients)):
        try:
            client = _get_client()
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            return  # 成功完成，退出
        except Exception as e:
            last_error = e
            _switch_key()
    raise last_error
