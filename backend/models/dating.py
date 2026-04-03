"""AI泡妞副本数据模型"""
from pydantic import BaseModel
from typing import Optional, List, Dict


class Girlfriend(BaseModel):
    id: str              # "gf1", "gf2", "gf3"
    name: str            # 角色名
    personality: str     # 性格描述
    affection_player: int = 50     # 对玩家好感度 0-100
    affection_rival: int = 50      # 对情敌好感度 0-100


class ChatMessage(BaseModel):
    speaker: str         # "player"/"rival"/"gf1"/"gf2"/"gf3"
    target: str          # 对话对象
    content: str


class DatingDungeonState(BaseModel):
    session_id: str
    player_name: str = "玩家"
    girlfriends: List[Girlfriend] = []
    rival_name: str = "情敌·渣男"
    chat_history: List[ChatMessage] = []
    current_round: int = 0
    max_rounds: int = 5
    player_actions_this_round: int = 0
    max_actions_per_round: int = 2   # 每轮玩家可以跟2个人说话
    status: str = "playing"  # playing/judging/finished
    result: Optional[str] = None


class DatingStartRequest(BaseModel):
    """开始AI泡妞副本请求"""
    player_name: str = "玩家"


class DatingChatRequest(BaseModel):
    """玩家发送聊天消息请求"""
    session_id: str
    target_id: str   # gf1/gf2/gf3
    message: str
