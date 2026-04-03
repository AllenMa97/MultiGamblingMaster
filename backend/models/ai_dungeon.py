"""AI 辩论副本数据模型"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AIDungeonState(BaseModel):
    """AI 辩论副本状态"""
    session_id: str
    player_card: Dict[str, Any]  # 玩家的牌
    opponent_card: Dict[str, Any]  # 对手的牌（对玩家隐藏）
    rounds: List[Dict[str, Any]] = Field(default_factory=list)  # 每轮对话记录
    max_rounds: int = 3  # 最大回合数
    current_round: int = 0  # 当前回合
    status: str = "playing"  # playing/judging/finished
    result: Optional[str] = None  # win/lose


class PlayerMessage(BaseModel):
    """玩家发送的消息"""
    session_id: str
    message: str


class AIDungeonStartRequest(BaseModel):
    """开始 AI 辩论副本请求（可选参数）"""
    max_rounds: Optional[int] = 3


class WebSocketMessage(BaseModel):
    """WebSocket 消息格式"""
    type: str  # player_message / opponent_message / judge_message / result / error
    content: Optional[str] = None
    done: bool = False
    result: Optional[str] = None  # 用于最终结果 win/lose
