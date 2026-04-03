"""吟诗作对关卡服务"""
import uuid
from typing import AsyncGenerator, Dict, Optional
from backend.models.poetry import PoetryDungeonState, PoetryTopic
from backend.services.llm_client import chat_completion, chat_completion_stream
from backend.config import LLM_MODEL_PLUS

# 内存存储 session
_sessions: Dict[str, PoetryDungeonState] = {}


async def start_dungeon() -> PoetryDungeonState:
    """创建 session，调用 LLM 生成题目"""
    session_id = str(uuid.uuid4())
    
    # 调用 LLM 生成题目
    prompt = """你是一个诗词比赛的出题官。请出一道诗词创作题目，包含一个主题和一个限定条件。格式：
主题：xxx
要求：xxx
示例：主题：月亮
要求：五言绝句，需包含'思'字"""
    
    messages = [{"role": "user", "content": prompt}]
    response = await chat_completion(messages, model=LLM_MODEL_PLUS, temperature=0.9, max_tokens=200)
    
    # 解析 LLM 返回的主题和限定条件
    theme = ""
    constraint = ""
    
    for line in response.split('\n'):
        line = line.strip()
        if line.startswith('主题：') or line.startswith('主题:'):
            theme = line.split('：', 1)[1].strip() if '：' in line else line.split(':', 1)[1].strip()
        elif line.startswith('要求：') or line.startswith('要求:'):
            constraint = line.split('：', 1)[1].strip() if '：' in line else line.split(':', 1)[1].strip()
    
    # 如果解析失败，使用默认值
    if not theme:
        theme = "春天"
    if not constraint:
        constraint = "七言绝句"
    
    full_prompt = f"主题：{theme}\n要求：{constraint}"
    
    topic = PoetryTopic(
        theme=theme,
        constraint=constraint,
        full_prompt=full_prompt
    )
    
    state = PoetryDungeonState(
        session_id=session_id,
        topic=topic,
        status="topic"
    )
    
    _sessions[session_id] = state
    return state


async def generate_opponent_answer(session_id: str) -> AsyncGenerator[str, None]:
    """AI对手根据题目作答，流式输出"""
    state = _sessions.get(session_id)
    if not state or not state.topic:
        yield "[错误：找不到题目]"
        return
    
    state.status = "opponent_writing"
    
    prompt = f"""你是一个诗词比赛的参赛者。请根据以下题目创作一首诗：
{state.topic.full_prompt}
请直接输出诗词内容，不要其他说明。"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_answer = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.8, max_tokens=300):
        full_answer += token
        yield token
    
    state.opponent_answer = full_answer.strip()
    state.status = "player_writing"


async def submit_player_answer(session_id: str, answer: str) -> None:
    """保存玩家答案"""
    state = _sessions.get(session_id)
    if not state:
        raise ValueError("Session not found")
    
    state.player_answer = answer.strip()


async def generate_judge_verdict(session_id: str) -> AsyncGenerator[str, None]:
    """裁判评判，流式输出并解析裁决结果"""
    state = _sessions.get(session_id)
    if not state or not state.topic or not state.opponent_answer or not state.player_answer:
        yield "[错误：缺少必要信息]"
        return
    
    state.status = "judging"
    
    prompt = f"""你是诗词比赛的裁判。请评判以下两首参赛作品：

题目：{state.topic.full_prompt}

对手作品：
{state.opponent_answer}

玩家作品：
{state.player_answer}

请：
1. 分别点评两首作品（各30字内）
2. 给出明确裁决
最后一行必须是：【裁决】玩家胜 或 【裁决】对手胜"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_verdict = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.7, max_tokens=400):
        full_verdict += token
        yield token
    
    # 解析裁决结果
    state.judge_comment = full_verdict.strip()
    
    if "【裁决】玩家胜" in full_verdict or "玩家胜" in full_verdict[-20:]:
        state.result = "win"
    else:
        state.result = "lose"
    
    state.status = "finished"


def get_session(session_id: str) -> Optional[PoetryDungeonState]:
    """获取 session 状态"""
    return _sessions.get(session_id)


def delete_session(session_id: str) -> bool:
    """删除 session"""
    if session_id in _sessions:
        del _sessions[session_id]
        return True
    return False
