"""谁是卧底游戏服务"""
import random
import asyncio
import uuid
from typing import Dict, List, Optional
from backend.models.spy import SpyDungeonState, SpyPlayer, SpyRound, VoteRecord
from backend.services.llm_client import chat_completion


# 预设词库（至少20对相似词）
WORD_PAIRS = [
    ("西瓜", "哈密瓜"), ("饺子", "馄饨"), ("眼镜", "墨镜"),
    ("口红", "唇膏"), ("蝴蝶", "蜻蜓"), ("台风", "龙卷风"),
    ("薯条", "薯片"), ("足球", "篮球"), ("地铁", "轻轨"),
    ("包子", "饺子"), ("冰箱", "空调"), ("医生", "护士"),
    ("警察", "保安"), ("钢琴", "古筝"), ("咖啡", "奶茶"),
    ("手机", "平板"), ("大学", "高中"), ("公交", "出租"),
    ("面包", "蛋糕"), ("雪糕", "冰棍"),
]

# NPC名字
NPC_NAMES = ["小明", "小红", "老王", "阿杰", "美美", "大壮", "小芳"]

# 游戏会话存储
_sessions: Dict[str, SpyDungeonState] = {}


def start_dungeon(player_name: str = "玩家") -> SpyDungeonState:
    """
    开始谁是卧底游戏
    
    - 随机选一对词
    - 8个角色（玩家+7NPC），随机2个是卧底，6个平民
    - 玩家有可能是卧底也可能是平民
    """
    session_id = str(uuid.uuid4())
    
    # 随机选一对词
    word_pair = random.choice(WORD_PAIRS)
    word_civilian, word_spy = word_pair
    
    # 创建玩家和NPC
    players: List[SpyPlayer] = []
    
    # 8个角色中随机选2个卧底
    all_ids = ["player"] + [f"npc{i}" for i in range(1, 8)]
    spy_ids = random.sample(all_ids, 2)
    
    # 创建玩家
    player_is_spy = "player" in spy_ids
    player_word = word_spy if player_is_spy else word_civilian
    players.append(SpyPlayer(
        id="player",
        name=player_name,
        word=player_word,
        is_spy=player_is_spy,
        is_alive=True,
        descriptions=[]
    ))
    
    # 创建7个NPC
    for i in range(1, 8):
        npc_id = f"npc{i}"
        npc_is_spy = npc_id in spy_ids
        npc_word = word_spy if npc_is_spy else word_civilian
        players.append(SpyPlayer(
            id=npc_id,
            name=NPC_NAMES[i-1],
            word=npc_word,
            is_spy=npc_is_spy,
            is_alive=True,
            descriptions=[]
        ))
    
    # 创建游戏状态
    state = SpyDungeonState(
        session_id=session_id,
        player_name=player_name,
        word_civilian=word_civilian,
        word_spy=word_spy,
        players=players,
        rounds=[],
        current_round=1,
        status="describing",
        result=None,
        player_is_spy=player_is_spy
    )
    
    # 保存会话
    _sessions[session_id] = state
    
    return state


def get_state(session_id: str) -> Optional[SpyDungeonState]:
    """获取游戏状态"""
    return _sessions.get(session_id)


async def generate_npc_description(session_id: str, npc_id: str) -> str:
    """
    NPC根据自己的词生成描述
    """
    state = _sessions.get(session_id)
    if not state:
        return ""
    
    npc = next((p for p in state.players if p.id == npc_id), None)
    if not npc or not npc.is_alive:
        return ""
    
    word = npc.word
    round_num = state.current_round
    
    # 构建prompt
    prompt = f"""你在玩'谁是卧底'游戏。你的词是'{word}'。
请用一句话描述这个词的特征（不能直接说出这个词）。
要求：15字以内，描述要巧妙，不能太明显也不能太模糊。
你是第{round_num}轮发言。"""
    
    # 如果是卧底，额外提示
    if npc.is_spy:
        prompt += "\n注意：你是卧底，你的描述要尽量模仿平民，不要暴露自己。"
    
    messages = [{"role": "user", "content": prompt}]
    
    try:
        description = await chat_completion(messages, temperature=0.9, max_tokens=100)
        # 清理描述，确保不超过15字
        description = description.strip().replace("\"", "").replace("'", "")
        if len(description) > 20:
            description = description[:20]
        return description
    except Exception as e:
        print(f"生成NPC描述失败: {e}")
        # 返回默认描述
        defaults = ["是一种食物", "可以穿戴", "很常见", "生活中常用", "大家都见过"]
        return random.choice(defaults)


def submit_player_description(session_id: str, description: str) -> bool:
    """保存玩家描述"""
    state = _sessions.get(session_id)
    if not state:
        return False
    
    player = next((p for p in state.players if p.id == "player"), None)
    if not player:
        return False
    
    # 保存到当前轮次
    if len(state.rounds) < state.current_round:
        # 创建新轮次
        state.rounds.append(SpyRound(
            round_num=state.current_round,
            descriptions={},
            votes=[]
        ))
    
    current_round_obj = state.rounds[state.current_round - 1]
    current_round_obj.descriptions["player"] = description
    player.descriptions.append(description)
    
    return True


async def generate_all_descriptions(session_id: str) -> Dict[str, str]:
    """
    生成所有NPC的描述（并行调用LLM加速）
    返回所有人（包含玩家）的描述
    """
    state = _sessions.get(session_id)
    if not state:
        return {}
    
    # 获取所有活着的NPC
    alive_npcs = [p for p in state.players if p.id != "player" and p.is_alive]
    
    # 并行生成所有NPC的描述
    tasks = [generate_npc_description(session_id, npc.id) for npc in alive_npcs]
    descriptions_list = await asyncio.gather(*tasks, return_exceptions=True)
    
    # 确保当前轮次对象存在
    if len(state.rounds) < state.current_round:
        state.rounds.append(SpyRound(
            round_num=state.current_round,
            descriptions={},
            votes=[]
        ))
    
    current_round_obj = state.rounds[state.current_round - 1]
    
    # 保存NPC描述
    for npc, desc in zip(alive_npcs, descriptions_list):
        if isinstance(desc, Exception):
            desc = "是一种常见的东西"
        current_round_obj.descriptions[npc.id] = desc
        npc.descriptions.append(desc)
    
    # 返回所有人的描述
    return current_round_obj.descriptions


async def generate_npc_votes(session_id: str) -> List[VoteRecord]:
    """
    每个活着的NPC投票
    返回投票记录列表
    """
    state = _sessions.get(session_id)
    if not state:
        return []
    
    # 获取当前轮次
    if len(state.rounds) < state.current_round:
        return []
    
    current_round_obj = state.rounds[state.current_round - 1]
    descriptions = current_round_obj.descriptions
    
    # 获取所有活着的NPC
    alive_npcs = [p for p in state.players if p.id != "player" and p.is_alive]
    alive_ids = {p.id for p in state.players if p.is_alive}
    
    votes = []
    
    for npc in alive_npcs:
        # 构建描述文本
        desc_text = "\n".join([
            f"{next((p.name for p in state.players if p.id == pid), pid)}: {desc}"
            for pid, desc in descriptions.items()
        ])
        
        # 构建prompt
        prompt = f"""你在玩'谁是卧底'游戏。你的词是'{npc.word}'。
以下是本轮所有人的描述：
{desc_text}

请分析谁最可能是卧底，投票淘汰一个人。
你只能从以下活着的人中选择（不能投自己）：{', '.join([p.name for p in state.players if p.is_alive and p.id != npc.id])}
只输出你要投票的人名，不要有任何其他内容。"""
        
        messages = [{"role": "user", "content": prompt}]
        
        try:
            vote_name = await chat_completion(messages, temperature=0.7, max_tokens=50)
            vote_name = vote_name.strip()
            
            # 根据名字找到对应的player_id
            target = None
            for p in state.players:
                if p.name == vote_name and p.id != npc.id and p.is_alive:
                    target = p.id
                    break
            
            # 如果没找到，随机投一个活着的（除了自己）
            if not target:
                valid_targets = [p.id for p in state.players if p.is_alive and p.id != npc.id]
                if valid_targets:
                    target = random.choice(valid_targets)
            
            if target:
                votes.append(VoteRecord(voter=npc.id, target=target))
                
        except Exception as e:
            print(f"NPC投票失败: {e}")
            # 随机投票
            valid_targets = [p.id for p in state.players if p.is_alive and p.id != npc.id]
            if valid_targets:
                target = random.choice(valid_targets)
                votes.append(VoteRecord(voter=npc.id, target=target))
    
    # 保存投票
    current_round_obj.votes.extend(votes)
    
    return votes


def submit_player_vote(session_id: str, target_id: str) -> bool:
    """玩家投票"""
    state = _sessions.get(session_id)
    if not state:
        return False
    
    # 确保目标活着且不是玩家自己
    target = next((p for p in state.players if p.id == target_id and p.is_alive), None)
    if not target or target_id == "player":
        return False
    
    # 获取当前轮次
    if len(state.rounds) < state.current_round:
        return False
    
    current_round_obj = state.rounds[state.current_round - 1]
    
    # 检查玩家是否已经投过票
    existing_vote = next((v for v in current_round_obj.votes if v.voter == "player"), None)
    if existing_vote:
        # 更新投票
        existing_vote.target = target_id
    else:
        # 添加新投票
        current_round_obj.votes.append(VoteRecord(voter="player", target=target_id))
    
    return True


def resolve_votes(session_id: str) -> Optional[str]:
    """
    统计票数，票最多的人被淘汰
    返回被淘汰的人id，如果平票则随机选一个
    """
    state = _sessions.get(session_id)
    if not state:
        return None
    
    # 获取当前轮次
    if len(state.rounds) < state.current_round:
        return None
    
    current_round_obj = state.rounds[state.current_round - 1]
    votes = current_round_obj.votes
    
    if not votes:
        return None
    
    # 统计票数
    vote_count: Dict[str, int] = {}
    for vote in votes:
        vote_count[vote.target] = vote_count.get(vote.target, 0) + 1
    
    # 找出最高票数
    max_votes = max(vote_count.values())
    
    # 找出所有得票最高的人
    candidates = [pid for pid, count in vote_count.items() if count == max_votes]
    
    # 平票随机选一个
    eliminated_id = random.choice(candidates)
    
    # 标记淘汰
    eliminated_player = next((p for p in state.players if p.id == eliminated_id), None)
    if eliminated_player:
        eliminated_player.is_alive = False
    
    # 保存淘汰信息
    current_round_obj.eliminated = eliminated_id
    
    # 更新状态
    state.status = "eliminated"
    
    return eliminated_id


def check_game_end(session_id: str) -> Optional[str]:
    """
    检查游戏是否结束
    - 所有卧底被淘汰 -> 平民胜 (玩家win)
    - 卧底存活数 >= 平民存活数 -> 卧底胜 (玩家根据身份判断)
    返回: "win" / "lose" / None (未结束)
    """
    state = _sessions.get(session_id)
    if not state:
        return None
    
    alive_players = [p for p in state.players if p.is_alive]
    alive_spies = [p for p in alive_players if p.is_spy]
    alive_civilians = [p for p in alive_players if not p.is_spy]
    
    # 所有卧底被淘汰 -> 平民胜
    if len(alive_spies) == 0:
        state.status = "finished"
        state.result = "win" if not state.player_is_spy else "lose"
        return state.result
    
    # 卧底存活数 >= 平民存活数 -> 卧底胜
    if len(alive_spies) >= len(alive_civilians):
        state.status = "finished"
        state.result = "win" if state.player_is_spy else "lose"
        return state.result
    
    return None


def next_round(session_id: str) -> bool:
    """进入下一轮"""
    state = _sessions.get(session_id)
    if not state:
        return False
    
    state.current_round += 1
    state.status = "describing"
    
    return True


def get_player_view(state: SpyDungeonState) -> dict:
    """
    获取玩家视角的游戏信息（隐藏其他玩家的词和身份）
    """
    return {
        "session_id": state.session_id,
        "player_name": state.player_name,
        "your_word": next((p.word for p in state.players if p.id == "player"), ""),
        "your_role": "spy" if state.player_is_spy else "civilian",
        "current_round": state.current_round,
        "status": state.status,
        "result": state.result,
        "players": [
            {
                "id": p.id,
                "name": p.name,
                "is_alive": p.is_alive,
                # 玩家只能看到被淘汰的人的身份
                "is_spy": p.is_spy if not p.is_alive else None,
                "descriptions": p.descriptions
            }
            for p in state.players
        ],
        "rounds": [
            {
                "round_num": r.round_num,
                "descriptions": r.descriptions,
                "eliminated": r.eliminated
            }
            for r in state.rounds
        ]
    }
