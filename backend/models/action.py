"""
动作指令副本 Pydantic 模型
"""
from pydantic import BaseModel
from typing import List


class ActionCommand(BaseModel):
    """单个动作指令"""
    type: str  # "arrow" 或 "key"
    value: str  # 如 "up"/"down"/"left"/"right"/"a"/"b" 等
    display: str  # 显示文本如 "↑"/"↓"/"←"/"→"/"A"/"B"


class ActionDungeonState(BaseModel):
    """动作副本状态"""
    commands: List[ActionCommand]
    time_limit: float  # 秒
    session_id: str


class ActionSubmitRequest(BaseModel):
    """提交请求"""
    session_id: str
    inputs: List[str]
    time_used: float


class ActionResult(BaseModel):
    """动作副本结果"""
    success: bool
    correct_count: int
    total_count: int
    time_used: float
