import random
import uuid
from typing import List, Dict, Optional, Tuple
from backend.models.card import Card, CardRound, CardDungeonState
from backend.services.llm_client import chat_completion


# 内存存储 session
_sessions: Dict[str, CardDungeonState] = {}

# 花色和点数定义
SUITS = ["hearts", "diamonds", "clubs", "spades"]
RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

# 点数映射 (A=14, K=13, Q=12, J=11, 2-10=对应数值)
RANK_VALUES = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
    "J": 11, "Q": 12, "K": 13, "A": 14
}

# 花色权重 (用于点数相同时比较)
SUIT_VALUES = {
    "clubs": 1,      # 梅花
    "diamonds": 2,   # 方块
    "hearts": 3,     # 红心
    "spades": 4      # 黑桃
}

# 花色中文名映射
SUIT_NAMES = {
    "spades": "黑桃",
    "hearts": "红心",
    "diamonds": "方块",
    "clubs": "梅花"
}


def create_deck() -> List[Card]:
    """
    生成 52 张标准扑克牌
    
    Returns:
        List[Card]: 52 张牌的列表
    """
    deck = []
    for suit in SUITS:
        for rank in RANKS:
            card = Card(
                suit=suit,
                rank=rank,
                value=RANK_VALUES[rank]
            )
            deck.append(card)
    return deck


def deal_cards_with_magic(magic_command: Optional[str] = None) -> tuple[Card, Card]:
    """
    根据魔法指令发两张牌
    
    Args:
        magic_command: 魔法指令
        
    Returns:
        tuple[Card, Card]: (玩家牌，对手牌)
    """
    deck = create_deck()
    
    if not magic_command:
        # 无魔法指令，正常随机发牌
        random.shuffle(deck)
        return deck[0], deck[1]
    
    command = magic_command.strip().lower()
    
    # 解析魔法指令
    if command in ["大", "大牌"]:
        # 玩家抽到 J/Q/K/A 的概率提升到 60%
        player_card = _draw_weighted_card(deck, high_card_weight=0.6)
        deck.remove(player_card)
        opponent_card = random.choice(deck)
        
    elif command in ["小", "小牌"]:
        # 对手抽到 2-6 的概率提升到 60%
        player_card = random.choice(deck)
        deck.remove(player_card)
        opponent_card = _draw_weighted_card(deck, low_card_weight=0.6)
        
    elif command in ["黑桃", "spades"]:
        player_card = _draw_weighted_card(deck, suit="spades", suit_weight=0.5)
        deck.remove(player_card)
        opponent_card = random.choice(deck)
        
    elif command in ["红心", "红桃", "hearts"]:
        player_card = _draw_weighted_card(deck, suit="hearts", suit_weight=0.5)
        deck.remove(player_card)
        opponent_card = random.choice(deck)
        
    elif command in ["方块", "diamonds"]:
        player_card = _draw_weighted_card(deck, suit="diamonds", suit_weight=0.5)
        deck.remove(player_card)
        opponent_card = random.choice(deck)
        
    elif command in ["梅花", "clubs"]:
        player_card = _draw_weighted_card(deck, suit="clubs", suit_weight=0.5)
        deck.remove(player_card)
        opponent_card = random.choice(deck)
        
    elif command in ["炸", "boom"]:
        # 双方都从大牌区 (10-A) 随机抽
        player_card = _draw_weighted_card(deck, high_card_weight=1.0)
        deck.remove(player_card)
        opponent_card = _draw_weighted_card(deck, high_card_weight=1.0)
        
    elif command in ["换", "swap"]:
        # 先正常发牌，然后交换
        random.shuffle(deck)
        player_card = deck[0]
        opponent_card = deck[1]
        # 交换
        player_card, opponent_card = opponent_card, player_card
        
    else:
        # 其他指令 -> 随机效果
        effects = ["big", "small", "suit_spades", "suit_hearts", "boom"]
        effect = random.choice(effects)
        
        if effect == "big":
            player_card = _draw_weighted_card(deck, high_card_weight=0.5)
        elif effect == "small":
            player_card = random.choice(deck)
        elif effect == "suit_spades":
            player_card = _draw_weighted_card(deck, suit="spades", suit_weight=0.4)
        elif effect == "suit_hearts":
            player_card = _draw_weighted_card(deck, suit="hearts", suit_weight=0.4)
        elif effect == "boom":
            player_card = _draw_weighted_card(deck, high_card_weight=0.7)
        else:
            player_card = random.choice(deck)
            
        deck.remove(player_card)
        opponent_card = random.choice(deck)
    
    return player_card, opponent_card


async def llm_modify_cards(
    player_card: Card, 
    opponent_card: Card, 
    player_command: Optional[str] = None,
    opponent_command: Optional[str] = None
) -> Tuple[Card, Card, str]:
    """
    使用 LLM 来"修改"牌面，增加趣味性
    
    Args:
        player_card: 玩家当前的牌
        opponent_card: 对手当前的牌
        player_command: 玩家的魔法指令
        opponent_command: 对手的魔法指令
        
    Returns:
        Tuple[Card, Card, str]: (修改后的玩家牌，修改后的对手牌，修改说明)
    """
    # 构建对手人设和指令
    opponent_personalities = [
        "神秘的老赌神",
        "狡猾的魔术师", 
        "傲慢的赌王",
        "深不可测的 AI 赌侠"
    ]
    opponent_personality = random.choice(opponent_personalities)
    
    # 如果没有指令，让 LLM 自由发挥
    if not player_command and not opponent_command:
        return player_card, opponent_card, "双方都未使用魔法指令，牌面保持不变"
    
    # 构建 prompt
    prompt = f"""你是一个奇幻赌场的裁判，现在有一场扑克牌对决（比大小）。

当前局面：
- 玩家的牌：{player_card.rank}{SUIT_NAMES[player_card.suit]} (点数:{player_card.value})
- {opponent_personality}的牌：{opponent_card.rank}{SUIT_NAMES[opponent_card.suit]} (点数:{opponent_card.value})

玩家的魔法指令："{player_command or '无'}"
{opponent_personality}的魔法指令："{opponent_command or '无'}"

请你根据双方的魔法指令，决定如何"修改"这两张牌。修改要符合以下规则：
1. 可以改变牌的点数或花色
2. 修改要有一定的平衡性，不能让玩家或对手绝对必胜
3. 修改要有创意和戏剧性，像电影里的赌神对决
4. 如果某方没有指令，可以默认不修改或轻微调整
5. 用中文返回修改说明，要生动有趣，模仿周星驰赌神电影的风格

请按以下 JSON 格式返回：
{{
    "player_new_rank": "新的点数",
    "player_new_suit": "新的花色 (spades/hearts/diamonds/clubs)",
    "opponent_new_rank": "新的点数",
    "opponent_new_suit": "新的花色",
    "reason": "修改说明"
}}

注意：点数必须是：2,3,4,5,6,7,8,9,10,J,Q,K,A 中的一个"""

    try:
        response = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,
            max_tokens=500
        )
        
        # 解析 JSON 响应
        import json
        import re
        
        # 尝试提取 JSON 部分
        json_match = re.search(r'\{.*?\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            
            # 创建新牌
            new_player_card = Card(
                suit=result.get("player_new_suit", player_card.suit),
                rank=result.get("player_new_rank", player_card.rank),
                value=RANK_VALUES.get(result.get("player_new_rank", player_card.rank), player_card.value)
            )
            
            new_opponent_card = Card(
                suit=result.get("opponent_new_suit", opponent_card.suit),
                rank=result.get("opponent_new_rank", opponent_card.rank),
                value=RANK_VALUES.get(result.get("opponent_new_rank", opponent_card.rank), opponent_card.value)
            )
            
            return new_player_card, new_opponent_card, result.get("reason", "牌面发生变化")
        else:
            # 解析失败，返回原牌
            return player_card, opponent_card, "魔法失效，牌面保持不变"
            
    except Exception as e:
        print(f"LLM 修改牌面失败：{e}")
        return player_card, opponent_card, "魔法被干扰，牌面保持不变"


def _draw_weighted_card(
    deck: List[Card],
    high_card_weight: float = 0.0,
    low_card_weight: float = 0.0,
    suit: Optional[str] = None,
    suit_weight: float = 0.0
) -> Card:
    """
    加权随机抽牌
    
    Args:
        deck: 牌堆
        high_card_weight: 大牌(JQKA)权重 (0-1)
        low_card_weight: 小牌(2-6)权重 (0-1)
        suit: 指定花色
        suit_weight: 指定花色权重 (0-1)
        
    Returns:
        Card: 抽到的牌
    """
    weights = []
    for card in deck:
        weight = 1.0  # 基础权重
        
        # 大牌权重 (J, Q, K, A)
        if high_card_weight > 0 and card.rank in ["J", "Q", "K", "A"]:
            weight = high_card_weight * 10  # 提升权重
            
        # 小牌权重 (2-6)
        if low_card_weight > 0 and card.value <= 6:
            weight = low_card_weight * 10
            
        # 花色权重
        if suit and suit_weight > 0 and card.suit == suit:
            weight = suit_weight * 10
            
        weights.append(weight)
    
    # 加权随机选择
    total_weight = sum(weights)
    if total_weight == 0:
        return random.choice(deck)
        
    r = random.uniform(0, total_weight)
    cumulative = 0
    for card, weight in zip(deck, weights):
        cumulative += weight
        if r <= cumulative:
            return card
    
    return deck[-1]


def compare_cards(player_card: Card, opponent_card: Card) -> tuple[str, str]:
    """
    比较两张牌的大小
    
    Args:
        player_card: 玩家的牌
        opponent_card: 对手的牌
        
    Returns:
        tuple[str, str]: (结果, 原因说明)
            结果: "win" - 玩家赢, "lose" - 玩家输, "draw" - 平局
    """
    player_suit_name = SUIT_NAMES.get(player_card.suit, player_card.suit)
    opponent_suit_name = SUIT_NAMES.get(opponent_card.suit, opponent_card.suit)
    
    # 先比点数
    if player_card.value > opponent_card.value:
        reason = f"{player_card.rank}{player_suit_name}({player_card.value}) vs {opponent_card.rank}{opponent_suit_name}({opponent_card.value})，点数更大，你赢了！"
        return "win", reason
    elif player_card.value < opponent_card.value:
        reason = f"{player_card.rank}{player_suit_name}({player_card.value}) vs {opponent_card.rank}{opponent_suit_name}({opponent_card.value})，点数更小，你输了！"
        return "lose", reason
    else:
        # 点数相同，比花色
        player_suit_value = SUIT_VALUES[player_card.suit]
        opponent_suit_value = SUIT_VALUES[opponent_card.suit]
        
        if player_suit_value > opponent_suit_value:
            suit_order = "♠ > ♥ > ♦ > ♣"
            reason = f"{player_card.rank}{player_suit_name} vs {opponent_card.rank}{opponent_suit_name}，点数相同，花色更大({suit_order})，你赢了！"
            return "win", reason
        elif player_suit_value < opponent_suit_value:
            suit_order = "♠ > ♥ > ♦ > ♣"
            reason = f"{player_card.rank}{player_suit_name} vs {opponent_card.rank}{opponent_suit_name}，点数相同，花色更小({suit_order})，你输了！"
            return "lose", reason
        else:
            reason = f"{player_card.rank}{player_suit_name} vs {opponent_card.rank}{opponent_suit_name}，完全相同，平局！"
            return "draw", reason


def start_dungeon(game_mode: str = "compare") -> CardDungeonState:
    """
    开始一局扑克牌副本(三局两胜制)
    
    Args:
        game_mode: 游戏模式
        
    Returns:
        CardDungeonState: 副本状态（不包含具体牌面，等待前端请求每一轮）
    """
    # 生成 session_id
    session_id = str(uuid.uuid4())
    
    # 创建状态
    state = CardDungeonState(
        session_id=session_id,
        game_mode=game_mode,
        max_rounds=3,
        win_target=2,
        rounds=[],
        player_wins=0,
        opponent_wins=0,
        current_round=0,
        status="playing",
        final_result=None,
        magic_command=None
    )
    
    # 存储到内存
    _sessions[session_id] = state
    
    return state


def apply_magic(session_id: str, magic_command: str) -> Optional[CardDungeonState]:
    """
    应用魔法指令
    
    Args:
        session_id: 会话ID
        magic_command: 魔法指令
        
    Returns:
        CardDungeonState: 更新后的状态，如果 session 不存在返回 None
    """
    if session_id not in _sessions:
        return None
    
    state = _sessions[session_id]
    
    # 存储魔法指令
    state.magic_command = magic_command
    
    # 更新存储
    _sessions[session_id] = state
    
    return state


async def play_round(session_id: str, player_command: Optional[str] = None) -> Optional[CardDungeonState]:
    """
    进行一轮对决（包含 LLM 干预）
    
    Args:
        session_id: 会话 ID
        player_command: 玩家的魔法指令（可选）
        
    Returns:
        CardDungeonState: 包含本轮结果的副本状态，如果 session 不存在返回 None
    """
    if session_id not in _sessions:
        return None
    
    state = _sessions[session_id]
    
    # 检查是否已结束
    if state.status == "finished":
        return state
    
    # 检查是否已达到最大轮数
    if state.current_round >= state.max_rounds:
        _determine_final_result(state)
        return state
    
    # 生成对手的魔法指令（随机概率使用魔法）
    opponent_command = None
    if random.random() < 0.5:  # 50% 概率使用魔法
        opponent_commands = ["大", "小", "黑桃", "红心", "换", "炸"]
        opponent_command = random.choice(opponent_commands)
    
    # 优先使用传入的玩家指令，如果没有则使用之前存储的指令
    if not player_command:
        player_command = state.magic_command
    
    # 清除之前的魔法指令
    state.magic_command = None
    
    # 第一步：初始发牌
    deck = create_deck()
    random.shuffle(deck)
    initial_player_card = deck[0]
    initial_opponent_card = deck[1]
    
    # 第二步：使用 LLM 根据双方指令修改牌面
    modified_player_card, modified_opponent_card, modify_reason = await llm_modify_cards(
        initial_player_card,
        initial_opponent_card,
        player_command,
        opponent_command
    )
    
    # 比较修改后的牌面
    result, reason = compare_cards(modified_player_card, modified_opponent_card)
    
    # 如果有修改，在原因中加入说明
    if modify_reason and modify_reason != "牌面保持不变":
        reason = f"{modify_reason} | 最终：{reason}"
    
    # 更新当前轮次
    state.current_round += 1
    
    # 记录本轮结果
    card_round = CardRound(
        round_num=state.current_round,
        player_card=modified_player_card,
        opponent_card=modified_opponent_card,
        result=result,
        reason=reason
    )
    state.rounds.append(card_round)
    
    # 更新胜场数
    if result == "win":
        state.player_wins += 1
    elif result == "lose":
        state.opponent_wins += 1
    
    # 检查是否已分出胜负
    if state.player_wins >= state.win_target:
        state.status = "finished"
        state.final_result = "win"
    elif state.opponent_wins >= state.win_target:
        state.status = "finished"
        state.final_result = "lose"
    elif state.current_round >= state.max_rounds:
        # 达到最大轮数，根据胜场数判定
        _determine_final_result(state)
    
    # 更新存储
    _sessions[session_id] = state
    
    return state


def _determine_final_result(state: CardDungeonState):
    """判定最终结果"""
    if state.player_wins > state.opponent_wins:
        state.final_result = "win"
    elif state.player_wins < state.opponent_wins:
        state.final_result = "lose"
    else:
        state.final_result = "draw"
    state.status = "finished"


def get_session(session_id: str) -> Optional[CardDungeonState]:
    """
    获取会话状态
    
    Args:
        session_id: 会话ID
        
    Returns:
        CardDungeonState: 副本状态，如果不存在返回 None
    """
    return _sessions.get(session_id)


def clear_session(session_id: str) -> bool:
    """
    清除会话
    
    Args:
        session_id: 会话ID
        
    Returns:
        bool: 是否成功清除
    """
    if session_id in _sessions:
        del _sessions[session_id]
        return True
    return False
