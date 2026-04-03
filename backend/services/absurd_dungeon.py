"""AI胡说大赛关卡服务"""
import uuid
from typing import AsyncGenerator, Dict, Optional
from backend.models.absurd import AbsurdDungeonState
from backend.services.llm_client import chat_completion, chat_completion_stream
from backend.config import LLM_MODEL_PLUS

# 内存存储 session
_sessions: Dict[str, AbsurdDungeonState] = {}


async def start_dungeon() -> AbsurdDungeonState:
    """创建 session，调用 LLM 生成正经题目"""
    session_id = str(uuid.uuid4())
    
    # 调用 LLM 生成正经题目
    prompt = """你是一个知识问答节目的出题官。请生成一个正经的科学、哲学或生活中的常见问题，这些问题应该有明确的科学答案。

要求：
1. 问题必须是真实存在的、有科学或逻辑答案的问题
2. 问题应该简洁明了，一句话描述
3. 可以是物理、生物、化学、天文、日常生活等领域

请直接输出问题，不要其他说明。

示例问题：
- 为什么天空是蓝色的？
- 为什么猫每天都要睡那么久？
- 为什么冰块会浮在水面上？
- 为什么我们会打哈欠？"""
    
    messages = [{"role": "user", "content": prompt}]
    response = await chat_completion(messages, model=LLM_MODEL_PLUS, temperature=0.9, max_tokens=100)
    
    topic = response.strip()
    # 清理问题格式
    if topic.startswith('问题：') or topic.startswith('问题:'):
        topic = topic.split('：', 1)[1].strip() if '：' in topic else topic.split(':', 1)[1].strip()
    
    # 如果解析失败，使用默认题目
    if not topic:
        topic = "为什么天空是蓝色的？"
    
    state = AbsurdDungeonState(
        session_id=session_id,
        topic=topic,
        status="topic"
    )
    
    _sessions[session_id] = state
    return state


async def generate_opponent_answer(session_id: str) -> AsyncGenerator[str, None]:
    """AI对手给出一个听起来很有道理但完全是胡说八道的回答，流式输出"""
    state = _sessions.get(session_id)
    if not state or not state.topic:
        yield "[错误：找不到题目]"
        return
    
    state.status = "answering"
    
    prompt = f"""你是一个"胡说八道大师"，你的任务是对一个正经问题给出一个听起来很有道理、逻辑自洽，但实际上完全荒诞搞笑的错误答案。

问题：{state.topic}

要求：
1. 答案必须完全错误、荒诞不经，但要假装很科学很专业
2. 使用专业术语、数据、引用（可以编造）来包装你的胡说
3. 语气要自信、严肃，就像真正的专家一样
4. 答案要有"创意"，让人听了先觉得"好像有点道理"然后恍然大悟"这是胡说"
5. 长度控制在150字以内

请直接输出你的胡说答案，不要其他说明。"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_answer = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.9, max_tokens=300):
        full_answer += token
        yield token
    
    state.opponent_answer = full_answer.strip()


async def submit_player_answer(session_id: str, answer: str) -> None:
    """保存玩家答案"""
    state = _sessions.get(session_id)
    if not state:
        raise ValueError("Session not found")
    
    state.player_answer = answer.strip()


async def generate_judge_verdict(session_id: str) -> AsyncGenerator[str, None]:
    """裁判评判谁的胡说更有说服力，流式输出并解析裁决结果"""
    state = _sessions.get(session_id)
    if not state or not state.topic or not state.opponent_answer or not state.player_answer:
        yield "[错误：缺少必要信息]"
        return
    
    state.status = "judging"
    
    prompt = f"""你是"胡说大赛"的裁判。你的任务是评判两位选手的胡说答案，看谁的说服力更强。

问题：{state.topic}

【选手A的回答】
{state.opponent_answer}

【选手B的回答】
{state.player_answer}

评判标准：
1. 荒诞程度（越离谱越好）
2. 逻辑自洽性（胡说也要能自圆其说）
3. 专业伪装度（用术语、数据包装的程度）
4. 搞笑程度

请：
1. 分别点评两个回答（各50字内）
2. 宣布谁赢得了"胡说大师"称号

最后一行必须是：【裁决】选手B胜 或 【裁决】选手A胜"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_verdict = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.8, max_tokens=400):
        full_verdict += token
        yield token
    
    # 解析裁决结果
    state.judge_comment = full_verdict.strip()
    
    # 选手B是玩家，选手A是对手
    if "【裁决】选手B胜" in full_verdict or "选手B胜" in full_verdict[-20:]:
        state.result = "win"
    else:
        state.result = "lose"
    
    state.status = "finished"


def get_session(session_id: str) -> Optional[AbsurdDungeonState]:
    """获取 session 状态"""
    return _sessions.get(session_id)


def delete_session(session_id: str) -> bool:
    """删除 session"""
    if session_id in _sessions:
        del _sessions[session_id]
        return True
    return False
