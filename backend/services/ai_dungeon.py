"""AI 辩论副本核心逻辑"""
import random
import uuid
from typing import AsyncGenerator, Dict, Any, Optional
from backend.models.ai_dungeon import AIDungeonState
from backend.services.llm_client import chat_completion_stream


# 内存存储会话状态
sessions: Dict[str, AIDungeonState] = {}


# 扑克牌花色和点数
SUITS = ["♠", "♥", "♣", "♦"]
RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
# 点数对应的大小值
RANK_VALUES = {rank: i for i, rank in enumerate(RANKS)}


def generate_deck() -> list:
    """生成一副扑克牌"""
    deck = []
    for suit in SUITS:
        for rank in RANKS:
            deck.append({
                "suit": suit,
                "rank": rank,
                "value": RANK_VALUES[rank],
                "display": f"{suit}{rank}"
            })
    return deck


def draw_cards() -> tuple:
    """随机抽取两张牌"""
    deck = generate_deck()
    cards = random.sample(deck, 2)
    return cards[0], cards[1]


def create_session(max_rounds: int = 3) -> AIDungeonState:
    """创建新的辩论会话"""
    session_id = str(uuid.uuid4())
    player_card, opponent_card = draw_cards()
    
    session = AIDungeonState(
        session_id=session_id,
        player_card=player_card,
        opponent_card=opponent_card,
        max_rounds=max_rounds,
        current_round=0,
        status="playing"
    )
    sessions[session_id] = session
    return session


def get_session(session_id: str) -> Optional[AIDungeonState]:
    """获取会话状态"""
    return sessions.get(session_id)


def update_session(session: AIDungeonState):
    """更新会话状态"""
    sessions[session.id] = session


async def generate_opponent_response(
    session: AIDungeonState, 
    player_message: str
) -> AsyncGenerator[str, None]:
    """生成 AI 对手的回复（流式）"""
    opponent_card = session.opponent_card
    
    # 构建 system prompt
    system_prompt = f"""你是一个扑克牌辩论游戏中的"对手"角色。你手上有一张牌：{opponent_card['display']}。
规则：你需要说服裁判你的牌比对手的牌更有优势。你可以说真话，也可以撒谎欺骗。
策略：根据你的牌的实际情况，选择最有利的辩论策略。如果你的牌确实好，可以直接展示优势；如果你的牌不好，尝试虚张声势或转移话题。
注意：保持简短有力，每次发言不超过100字。使用中文。"""

    # 构建对话历史
    messages = [{"role": "system", "content": system_prompt}]
    
    # 添加历史对话
    for round_data in session.rounds:
        if "player_message" in round_data:
            messages.append({"role": "user", "content": round_data["player_message"]})
        if "opponent_message" in round_data:
            messages.append({"role": "assistant", "content": round_data["opponent_message"]})
    
    # 添加当前玩家消息
    messages.append({"role": "user", "content": player_message})
    
    # 流式调用 LLM
    full_response = ""
    async for token in chat_completion_stream(messages, temperature=0.9, max_tokens=200):
        full_response += token
        yield token
    
    # 更新会话状态
    session.rounds.append({
        "round": session.current_round,
        "player_message": player_message,
        "opponent_message": full_response
    })
    session.current_round += 1
    
    # 检查是否达到最大回合数
    if session.current_round >= session.max_rounds:
        session.status = "judging"
    
    update_session(session)


async def generate_opponent_opening(session: AIDungeonState) -> AsyncGenerator[str, None]:
    """生成 AI 对手的开场白（流式）"""
    opponent_card = session.opponent_card
    
    system_prompt = f"""你是一个扑克牌辩论游戏中的"对手"角色。你手上有一张牌：{opponent_card['display']}。
规则：你需要说服裁判你的牌比对手的牌更有优势。你可以说真话，也可以撒谎欺骗。
策略：根据你的牌的实际情况，选择最有利的辩论策略。如果你的牌确实好，可以直接展示优势；如果你的牌不好，尝试虚张声势或转移话题。
注意：保持简短有力，每次发言不超过100字。使用中文。

现在游戏开始，请说出你的开场白。"""

    messages = [{"role": "system", "content": system_prompt}]
    
    full_response = ""
    async for token in chat_completion_stream(messages, temperature=0.9, max_tokens=200):
        full_response += token
        yield token
    
    # 保存开场白作为第一轮
    session.rounds.append({
        "round": 0,
        "opponent_message": full_response
    })
    update_session(session)


async def generate_judge_verdict(session: AIDungeonState) -> AsyncGenerator[str, None]:
    """生成 AI 裁判的判决（流式）"""
    
    system_prompt = """你是一个扑克牌辩论游戏的"裁判"。你不知道双方的真实牌面，只能根据双方的辩论表现来判断。
你需要：
1. 分析双方的论述逻辑和说服力
2. 判断谁的论述更有可信度
3. 做出最终裁决：宣布哪一方获胜

注意：你的判断完全基于辩论表现，不是基于牌面大小。
请先简短分析（50字内），然后给出明确裁决。
最后一行必须是：【裁决】玩家胜 或 【裁决】对手胜
使用中文。"""

    # 构建对话历史（不包含真实牌面）
    messages = [{"role": "system", "content": system_prompt}]
    
    # 添加双方辩论内容
    debate_history = []
    for round_data in session.rounds:
        if "player_message" in round_data:
            debate_history.append(f"玩家：{round_data['player_message']}")
        if "opponent_message" in round_data:
            debate_history.append(f"对手：{round_data['opponent_message']}")
    
    messages.append({
        "role": "user", 
        "content": "以下是双方辩论记录：\n" + "\n".join(debate_history)
    })
    
    # 流式调用 LLM
    full_response = ""
    async for token in chat_completion_stream(messages, temperature=0.7, max_tokens=300):
        full_response += token
        yield token
    
    # 解析判决结果
    result = parse_verdict(full_response)
    session.result = result
    session.status = "finished"
    update_session(session)


def parse_verdict(verdict_text: str) -> str:
    """从裁判输出中解析裁决结果"""
    if "【裁决】玩家胜" in verdict_text or "玩家胜" in verdict_text:
        return "win"
    elif "【裁决】对手胜" in verdict_text or "对手胜" in verdict_text:
        return "lose"
    else:
        # 默认根据文本内容判断
        if "玩家" in verdict_text and ("胜" in verdict_text or "赢" in verdict_text):
            return "win"
        return "lose"


def cleanup_session(session_id: str):
    """清理会话"""
    if session_id in sessions:
        del sessions[session_id]
