"""地图数据模型"""
from typing import List, Optional, Dict
from pydantic import BaseModel


class MapNode(BaseModel):
    """地图节点"""
    id: int
    type: str
    name: str
    next: List[int]
    x: float = 0
    y: float = 0


class Challenge(BaseModel):
    """挑战/副本"""
    id: str
    type: str
    subtype: Optional[str] = None
    name: str
    difficulty: int
    description: str = ""
    godot_level: Optional[str] = None


class City(BaseModel):
    """城市"""
    city_id: str
    name: str
    province: str
    x: float
    y: float
    is_start_city: bool = False
    difficulty: int = 1
    unlocks: List[str] = []
    challenges: List[Challenge] = []


class Region(BaseModel):
    """地区"""
    region_id: str
    name: str
    center_x: float
    center_y: float
    cities: List[City] = []


class ChainStory(BaseModel):
    """连锁剧情"""
    id: str
    name: str
    trigger_cities: List[str]
    trigger_challenges: List[str]
    reward: str
    description: str


class MapMeta(BaseModel):
    """地图元信息"""
    map_id: str
    name: str
    description: str
    node_count: int


class MapData(BaseModel):
    """地图数据"""
    map_id: str
    name: str
    description: str
    nodes: List[MapNode] = []
    background_image: Optional[str] = None
    regions: List[Region] = []
    chain_stories: List[ChainStory] = []
    max_travel_distance: int = 2


class DiceResult(BaseModel):
    """骰子结果"""
    value: int
    current_position: int
    new_position: int
    path: List[int]
    need_choice: bool
    choices: Optional[List[int]] = None
    remaining_steps: int = 0
