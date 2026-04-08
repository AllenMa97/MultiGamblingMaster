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


class LevelResult(BaseModel):
    """通用关卡结果（支持所有类型）"""
    success: bool
    time_used: float = 0.0
    score: int = 0
    # Godot 动作数据
    godot_data: dict = {}
    # 新增关卡类型数据
    puzzle_data: dict = {}  # 解谜：hints_used, attempts
    rhythm_data: dict = {}  # 节奏：accuracy, hit_count, miss_count
    dating_data: dict = {}  # 恋爱：ending_type, affection_level
    survival_data: dict = {}  # 生存：wave_reached, enemies_defeated
    escape_data: dict = {}  # 逃亡：escape_time, collisions
