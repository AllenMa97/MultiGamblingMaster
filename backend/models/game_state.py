"""
游戏状态模型
定义游戏存档相关的 Pydantic 模型
"""
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class GameState(BaseModel):
    """游戏状态模型，表示一个存档的完整状态"""
    save_id: str = Field(..., description="存档 ID (UUID)")
    player_name: str = Field(default="玩家", description="玩家名称")
    map_id: str = Field(default="china_travel", description="地图 ID")
    current_position: int = Field(default=0, description="当前所在格子 id")
    current_city: str = Field(default="suzhou", description="当前所在城市")
    visited_cities: List[str] = Field(default_factory=list, description="已访问的城市列表")
    unlocked_cities: List[str] = Field(default_factory=list, description="已解锁的城市列表")
    completed_challenges: Dict[str, List[str]] = Field(default_factory=dict, description="已完成挑战 {city_id: [challenge_ids]}")
    completed_nodes: List[int] = Field(default_factory=list, description="已通关的格子 id 列表")
    failed_nodes: List[int] = Field(default_factory=list, description="失败过的格子 id 列表")
    dice_history: List[int] = Field(default_factory=list, description="骰子历史记录")
    total_wins: int = Field(default=0, description="总胜利次数")
    total_losses: int = Field(default=0, description="总失败次数")
    chain_stories_triggered: List[str] = Field(default_factory=list, description="已触发的连锁剧情 ID 列表")
    created_at: str = Field(..., description="创建时间 (ISO 格式)")
    updated_at: str = Field(..., description="更新时间 (ISO 格式)")
    is_completed: bool = Field(default=False, description="是否通关")

    class Config:
        json_schema_extra = {
            "example": {
                "save_id": "550e8400-e29b-41d4-a716-446655440000",
                "player_name": "玩家",
                "current_position": 5,
                "completed_nodes": [1, 2, 3],
                "failed_nodes": [4],
                "dice_history": [3, 4, 2, 6],
                "total_wins": 3,
                "total_losses": 1,
                "created_at": "2026-04-03T10:00:00",
                "updated_at": "2026-04-03T11:30:00",
                "is_completed": False
            }
        }


class SaveGameRequest(BaseModel):
    """保存游戏请求模型"""
    player_name: Optional[str] = Field(default=None, description="玩家名称")
    map_id: Optional[str] = Field(default=None, description="地图 ID")

    class Config:
        json_schema_extra = {
            "example": {
                "player_name": "勇者",
                "map_id": "map_01"
            }
        }


class LoadGameResponse(GameState):
    """加载游戏响应模型，继承自 GameState"""
    pass


class UpdatePositionRequest(BaseModel):
    """更新位置请求模型"""
    position: int = Field(..., description="新位置")
    won: bool = Field(..., description="是否胜利")
    node_id: int = Field(..., description="格子ID")

    class Config:
        json_schema_extra = {
            "example": {
                "position": 6,
                "won": True,
                "node_id": 6
            }
        }
