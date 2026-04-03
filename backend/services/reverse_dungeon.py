"""反向说服关卡服务"""
import uuid
from typing import AsyncGenerator, Dict, Optional
from backend.models.reverse import ReverseDungeonState, ReverseMessage
from backend.services.llm_client import chat_completion, chat_completion_stream
from backend.config import LLM_MODEL_PLUS

# 内存存储 session
_sessions: Dict[str, ReverseDungeonState] = {}


async def start_dungeon() -> ReverseDungeonState:
    """创建 session，调用 LLM 生成荒谬论点"""
    session_id = str(uuid.uuid4())
    
    # 调用 LLM 生成荒谬论点
    prompt = """你是一个"反向说服"游戏的出题官。请生成一个明显荒谬、违背常识的论点。

要求：
1. 论点必须是明显错误的、违背科学常识的
2. 论点要简洁有力，一句话描述
3. 要有一定的"可辩论性"，即虽然荒谬但可以从某些角度强行辩解

请直接输出论点，不要其他说明。

示例论点：
- 地球其实是三角形的
- 鱼其实会飞，只是它们选择不飞
- 石头是软的，只是我们摸得太快
- 人类其实不需要睡觉，睡觉是阴谋论"""
    
    messages = [{"role": "user", "content": prompt}]
    response = await chat_completion(messages, model=LLM_MODEL_PLUS, temperature=0.95, max_tokens=100)
    
    absurd_claim = response.strip()
    # 清理格式
    if absurd_claim.startswith('论点：') or absurd_claim.startswith('论点:'):
        absurd_claim = absurd_claim.split('：', 1)[1].strip() if '：' in absurd_claim else absurd_claim.split(':', 1)[1].strip()
    
    # 如果解析失败，使用默认论点
    if not absurd_claim:
        absurd_claim = "地球其实是三角形的"
    
    state = ReverseDungeonState(
        session_id=session_id,
        absurd_claim=absurd_claim,
        status="claim"
    )
    
    _sessions[session_id] = state
    return state


async def generate_opponent_argument(state: ReverseDungeonState) -> AsyncGenerator[str, None]:
    """AI对手试图说服裁判相信荒谬论点，流式输出"""
    
    state.status = "debating"
    
    # 构建历史对话上下文
    history = ""
    for msg in state.messages:
        if msg.speaker == "opponent":
            history += f"你说：{msg.content}\n"
        elif msg.speaker == "player":
            history += f"对方说：{msg.content}\n"
        elif msg.speaker == "judge":
            history += f"裁判回应：{msg.content}\n"
    
    round_info = f"第{state.current_round + 1}轮" if state.current_round < state.max_rounds else "最后一轮"
    
    prompt = f"""你是"反向说服"辩论赛的辩手。你的任务是说服裁判相信以下荒谬论点：

论点：{state.absurd_claim}

当前是{round_info}，共{state.max_rounds}轮。

历史对话：
{history}

要求：
1. 你必须坚定地为这个荒谬论点辩护
2. 使用各种辩论技巧：类比、反问、引用（可编造）、偷换概念等
3. 语气要自信、激昂，像个真正的辩论高手
4. 每轮发言控制在100字以内
5. 针对裁判的态度调整策略，如果裁判动摇了就加大力度

请直接输出你的发言，不要其他说明。"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_argument = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.9, max_tokens=200):
        full_argument += token
        yield token
    
    state.messages.append(ReverseMessage(speaker="opponent", content=full_argument.strip()))


async def submit_player_argument(session_id: str, argument: str) -> None:
    """保存玩家论点"""
    state = _sessions.get(session_id)
    if not state:
        raise ValueError("Session not found")
    
    state.messages.append(ReverseMessage(speaker="player", content=argument.strip()))


async def generate_judge_response(state: ReverseDungeonState) -> AsyncGenerator[str, None]:
    """裁判回复，流式输出"""
    
    # 构建历史对话上下文
    history = ""
    for msg in state.messages:
        if msg.speaker == "opponent":
            history += f"辩手A说：{msg.content}\n"
        elif msg.speaker == "player":
            history += f"辩手B说：{msg.content}\n"
        elif msg.speaker == "judge":
            history += f"你之前回应：{msg.content}\n"
    
    round_info = f"第{state.current_round + 1}轮" if state.current_round < state.max_rounds else "最后一轮（必须做出决定）"
    
    is_final = state.current_round >= state.max_rounds - 1
    
    if is_final:
        prompt = f"""你是"反向说服"辩论赛的裁判。你需要评判这场辩论的胜负。

辩论论点：{state.absurd_claim}

历史对话：
{history}

这是最后一轮，你必须做出决定！

要求：
1. 先简要回顾双方的表现
2. 宣布谁的说服力更强
3. 如果某方让你产生了"好像有点道理"的感觉，那方获胜
4. 最后一行必须是：【判决】辩手A胜 或 【判决】辩手B胜"""
    else:
        prompt = f"""你是"反向说服"辩论赛的裁判。你正在听双方为一个荒谬论点辩论。

辩论论点：{state.absurd_claim}

历史对话：
{history}

当前是{round_info}，共{state.max_rounds}轮。

你的角色设定：
1. 你一开始坚决反对这个荒谬论点，认为它是胡说八道
2. 但随着辩论进行，你可能会被某方的论证所动摇
3. 如果某方让你产生"好像有点道理"、"难道是真的"的感觉，说明他们被说服了
4. 你的回应要体现你的态度变化

要求：
1. 先回应刚才的发言，表达你的态度（坚决反对/有点动摇/好像有道理）
2. 如果某方让你动摇了，在回复中包含"好像有道理"或"有点道理"
3. 控制在80字以内

请直接输出你的回应，不要其他说明。"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_response = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.8, max_tokens=250):
        full_response += token
        yield token
    
    response_text = full_response.strip()
    state.messages.append(ReverseMessage(speaker="judge", content=response_text))
    
    # 检查裁判是否被说服
    convincing_keywords = ["好像有道理", "有点道理", "难道", "也许", "可能", "说得通", "被说服"]
    
    # 在最终轮，根据判决决定胜负
    if is_final:
        if "【判决】辩手B胜" in response_text or "辩手B胜" in response_text[-20:]:
            state.player_convinced = True
            state.result = "win"
        else:
            state.opponent_convinced = True
            state.result = "lose"
        state.status = "finished"
    else:
        # 检查是否被说服
        is_convinced = any(keyword in response_text for keyword in convincing_keywords)
        if is_convinced:
            # 判断是谁说服的（看最后是谁发言）
            last_speaker = state.messages[-2].speaker if len(state.messages) >= 2 else "opponent"
            if last_speaker == "player":
                state.player_convinced = True
                state.result = "win"
                state.status = "finished"
            else:
                state.opponent_convinced = True
                state.result = "lose"
                state.status = "finished"
        else:
            state.current_round += 1


def get_session(session_id: str) -> Optional[ReverseDungeonState]:
    """获取 session 状态"""
    return _sessions.get(session_id)


def delete_session(session_id: str) -> bool:
    """删除 session"""
    if session_id in _sessions:
        del _sessions[session_id]
        return True
    return False
