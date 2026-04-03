"""AI泡妞副本核心逻辑"""
import uuid
import random
import re
from typing import Dict, Optional, List, AsyncGenerator

from backend.models.dating import DatingDungeonState, Girlfriend, ChatMessage
from backend.services.llm_client import chat_completion, chat_completion_stream
from backend.config import LLM_MODEL_PLUS


# 内存存储会话
_sessions: Dict[str, DatingDungeonState] = {}


# 女友基础设定
GIRLFRIEND_TEMPLATES = [
    {
        "id": "gf1",
        "name": "小甜",
        "personality": "活泼开朗，喜欢幽默搞笑的人，讨厌沉闷无趣的对话"
    },
    {
        "id": "gf2",
        "name": "冷月",
        "personality": "高冷知性，喜欢有深度有文化的人，讨厌肤浅庸俗"
    },
    {
        "id": "gf3",
        "name": "暖暖",
        "personality": "温柔体贴，喜欢真诚关心她的人，讨厌虚伪做作"
    }
]


def start_dungeon(player_name: str = "玩家") -> DatingDungeonState:
    """开始新的泡妞副本"""
    session_id = str(uuid.uuid4())
    
    # 初始化3个女友
    girlfriends = []
    for template in GIRLFRIEND_TEMPLATES:
        gf = Girlfriend(
            id=template["id"],
            name=template["name"],
            personality=template["personality"],
            affection_player=50,
            affection_rival=50
        )
        girlfriends.append(gf)
    
    state = DatingDungeonState(
        session_id=session_id,
        player_name=player_name,
        girlfriends=girlfriends,
        rival_name="情敌·渣男",
        current_round=1,
        player_actions_this_round=0,
        status="playing"
    )
    
    _sessions[session_id] = state
    return state


def get_session(session_id: str) -> Optional[DatingDungeonState]:
    """获取会话状态"""
    return _sessions.get(session_id)


def cleanup_session(session_id: str):
    """清理会话"""
    if session_id in _sessions:
        del _sessions[session_id]


def _build_gf_system_prompt(gf: Girlfriend, state: DatingDungeonState) -> str:
    """构建女友的系统prompt"""
    # 获取与该女友相关的对话历史
    related_history = []
    for msg in state.chat_history[-10:]:  # 最近10条
        if msg.speaker in [gf.id, "player", "rival"] and msg.target in [gf.id, "player", "rival"]:
            related_history.append(f"{msg.speaker}对{msg.target}说：{msg.content}")
    
    history_text = "\n".join(related_history) if related_history else "暂无对话"
    
    # 根据好感度决定态度
    if gf.affection_player >= 70:
        attitude = "对玩家很有好感，态度热情友好"
    elif gf.affection_player >= 40:
        attitude = "对玩家态度一般，保持礼貌"
    else:
        attitude = "对玩家没什么好感，态度冷淡"
    
    prompt = f"""你是{gf.name}，一个{gf.personality}的女生。
当前你对玩家的好感度是{gf.affection_player}/100，对情敌的好感度是{gf.affection_rival}/100。
你当前对玩家的态度：{attitude}

最近的对话历史：
{history_text}

规则：
1. 根据你的性格和当前好感度自然回应
2. 如果玩家说的话符合你的喜好，好感度会上升
3. 回复要符合你的性格特点（小甜活泼、冷月高冷、暖暖温柔）
4. 在回复末尾输出隐藏标记 [好感度变化:+X] 或 [好感度变化:-X] 或 [好感度变化:0]
5. 标记范围通常是-10到+10，特别好的回复可以到+15，特别差的可以到-15
6. 不要透露你在评分
"""
    return prompt


def _extract_affection_change(content: str) -> int:
    """从回复中提取好感度变化"""
    match = re.search(r'\[好感度变化:([+-]?\d+)\]', content)
    if match:
        return int(match.group(1))
    return 0


def _remove_affection_tag(content: str) -> str:
    """移除好感度变化标记"""
    return re.sub(r'\[好感度变化:[+-]?\d+\]', '', content).strip()


async def player_chat(session_id: str, target_id: str, message: str) -> dict:
    """玩家与女友对话"""
    state = get_session(session_id)
    if not state:
        raise ValueError("会话不存在")
    
    if state.status != "playing":
        raise ValueError("游戏已结束")
    
    if state.player_actions_this_round >= state.max_actions_per_round:
        raise ValueError("本轮行动次数已用完")
    
    # 找到目标女友
    gf = None
    for g in state.girlfriends:
        if g.id == target_id:
            gf = g
            break
    
    if not gf:
        raise ValueError("目标不存在")
    
    # 记录玩家消息
    state.chat_history.append(ChatMessage(
        speaker="player",
        target=target_id,
        content=message
    ))
    
    # 构建prompt并调用LLM
    system_prompt = _build_gf_system_prompt(gf, state)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"{state.player_name}对你说：{message}\n\n请回复："}
    ]
    
    response = await chat_completion(
        messages=messages,
        model=LLM_MODEL_PLUS,
        temperature=0.8,
        max_tokens=300
    )
    
    # 提取好感度变化
    affection_change = _extract_affection_change(response)
    clean_response = _remove_affection_tag(response)
    
    # 更新好感度
    gf.affection_player = max(0, min(100, gf.affection_player + affection_change))
    
    # 记录女友回复
    state.chat_history.append(ChatMessage(
        speaker=target_id,
        target="player",
        content=clean_response
    ))
    
    # 增加行动次数
    state.player_actions_this_round += 1
    
    return {
        "gf_id": target_id,
        "gf_name": gf.name,
        "content": clean_response,
        "affection_player": gf.affection_player,
        "affection_change": affection_change
    }


async def rival_auto_chat(session_id: str) -> List[dict]:
    """情敌自动行动"""
    state = get_session(session_id)
    if not state:
        raise ValueError("会话不存在")
    
    results = []
    
    # 情敌每轮跟1-2个女友搭话
    num_targets = random.randint(1, 2)
    targets = random.sample(state.girlfriends, min(num_targets, len(state.girlfriends)))
    
    for gf in targets:
        # 情敌发言
        rival_prompt = f"""你是一个油嘴滑舌的情敌，名叫{state.rival_name}。
你正在追求{gf.name}，她是一个{gf.personality}的女生。
请根据她的性格说一句撩人的话，30字以内。要显得有点油腻但不算太恶心。"""
        
        rival_messages = [
            {"role": "system", "content": rival_prompt},
            {"role": "user", "content": "说一句撩人的话："}
        ]
        
        rival_content = await chat_completion(
            messages=rival_messages,
            model=LLM_MODEL_PLUS,
            temperature=0.9,
            max_tokens=100
        )
        
        # 记录情敌消息
        state.chat_history.append(ChatMessage(
            speaker="rival",
            target=gf.id,
            content=rival_content
        ))
        
        # 女友回复情敌
        gf_system = f"""你是{gf.name}，一个{gf.personality}的女生。
当前你对情敌的好感度是{gf.affection_rival}/100，对玩家的好感度是{gf.affection_player}/100。

情敌{state.rival_name}对你说：{rival_content}

规则：
1. 根据你的性格和当前好感度自然回应
2. 如果情敌的话让你反感，好感度可能下降
3. 回复要符合你的性格特点
4. 在回复末尾输出隐藏标记 [好感度变化:+X] 或 [好感度变化:-X] 或 [好感度变化:0]
5. 标记范围通常是-10到+10
"""
        
        gf_messages = [
            {"role": "system", "content": gf_system},
            {"role": "user", "content": "请回复情敌："}
        ]
        
        gf_response = await chat_completion(
            messages=gf_messages,
            model=LLM_MODEL_PLUS,
            temperature=0.8,
            max_tokens=200
        )
        
        # 提取好感度变化
        affection_change = _extract_affection_change(gf_response)
        clean_response = _remove_affection_tag(gf_response)
        
        # 更新情敌好感度
        gf.affection_rival = max(0, min(100, gf.affection_rival + affection_change))
        
        # 记录女友回复
        state.chat_history.append(ChatMessage(
            speaker=gf.id,
            target="rival",
            content=clean_response
        ))
        
        results.append({
            "gf_id": gf.id,
            "gf_name": gf.name,
            "rival_content": rival_content,
            "gf_response": clean_response,
            "affection_rival": gf.affection_rival,
            "affection_change": affection_change
        })
    
    return results


def advance_round(session_id: str) -> dict:
    """进入下一轮"""
    state = get_session(session_id)
    if not state:
        raise ValueError("会话不存在")
    
    state.current_round += 1
    state.player_actions_this_round = 0
    
    # 检查是否结束
    if state.current_round > state.max_rounds:
        state.status = "judging"
        return {
            "round": state.current_round - 1,
            "max_rounds": state.max_rounds,
            "status": state.status,
            "message": "游戏结束，进入评判阶段"
        }
    
    return {
        "round": state.current_round,
        "max_rounds": state.max_rounds,
        "status": state.status,
        "message": f"进入第{state.current_round}轮"
    }


async def judge_result(session_id: str) -> AsyncGenerator[str, None]:
    """最终裁判评判（流式）"""
    state = get_session(session_id)
    if not state:
        yield "会话不存在"
        return
    
    state.status = "judging"
    
    # 计算总分
    player_total = sum(gf.affection_player for gf in state.girlfriends)
    rival_total = sum(gf.affection_rival for gf in state.girlfriends)
    
    # 生成评判prompt
    judge_prompt = f"""你是情感大师，现在要评判一场追求竞赛的结果。

参赛者：
- 玩家 {state.player_name}
- 情敌 {state.rival_name}

三位女生的最终好感度：
"""
    
    for gf in state.girlfriends:
        judge_prompt += f"- {gf.name}（{gf.personality}）：对玩家{gf.affection_player}分，对情敌{gf.affection_rival}分\n"
    
    judge_prompt += f"\n总分：玩家{player_total}分，情敌{rival_total}分\n"
    
    winner = "玩家" if player_total > rival_total else "情敌"
    judge_prompt += f"\n请分析每个女生的选择原因，然后宣布{winner}获胜。"
    
    messages = [
        {"role": "system", "content": "你是公正的情感大师，分析恋爱竞赛结果。分析要幽默风趣，最后必须输出【裁决】玩家胜 或 【裁决】对手胜"},
        {"role": "user", "content": judge_prompt}
    ]
    
    full_response = ""
    async for token in chat_completion_stream(
        messages=messages,
        model=LLM_MODEL_PLUS,
        temperature=0.8,
        max_tokens=800
    ):
        full_response += token
        yield token
    
    # 判断结果
    if "【裁决】玩家胜" in full_response or "玩家胜" in full_response[-50:]:
        state.result = "win"
    else:
        state.result = "lose"
    
    state.status = "finished"


def get_girlfriend_state(session_id: str, gf_id: str) -> Optional[dict]:
    """获取特定女友状态"""
    state = get_session(session_id)
    if not state:
        return None
    
    for gf in state.girlfriends:
        if gf.id == gf_id:
            return {
                "id": gf.id,
                "name": gf.name,
                "personality": gf.personality,
                "affection_player": gf.affection_player,
                "affection_rival": gf.affection_rival
            }
    return None
