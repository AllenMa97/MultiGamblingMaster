"""
玩家模型
定义玩家相关的 Pydantic 模型
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class Player(BaseModel):
    """玩家模型，表示游戏中的玩家信息"""
    name: str = Field(..., description="玩家名称")
    current_position: int = Field(default=0, description="当前位置")
    stats: Dict[str, Any] = Field(default_factory=dict, description="统计数据")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "勇者",
                "current_position": 5,
                "stats": {
                    "total_games": 10,
                    "win_rate": 0.7,
                    "favorite_dungeon": "card"
                }
            }
        }


class PlayerStats(BaseModel):
    """玩家统计数据模型"""
    total_games: int = Field(default=0, description="总游戏次数")
    wins: int = Field(default=0, description="胜利次数")
    losses: int = Field(default=0, description="失败次数")
    win_rate: float = Field(default=0.0, description="胜率")
    total_dice_rolls: int = Field(default=0, description="总骰子投掷次数")
    average_dice: float = Field(default=0.0, description="平均骰子点数")

    class Config:
        json_schema_extra = {
            "example": {
                "total_games": 10,
                "wins": 7,
                "losses": 3,
                "win_rate": 0.7,
                "total_dice_rolls": 25,
                "average_dice": 3.5
            }
        }
