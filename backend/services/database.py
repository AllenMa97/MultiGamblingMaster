"""
数据库服务
使用 JSON 文件存储游戏存档
"""
import json
import uuid
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from backend.models.game_state import GameState

# 存档目录路径
SAVES_DIR = Path(__file__).parent.parent / "data" / "saves"


async def init_db() -> None:
    """
    初始化数据库
    对于 JSON 文件存储，只需确保存档目录存在
    """
    SAVES_DIR.mkdir(parents=True, exist_ok=True)


async def save_game(game_state: GameState) -> None:
    """
    保存或更新游戏状态
    
    Args:
        game_state: 游戏状态对象
    """
    SAVES_DIR.mkdir(parents=True, exist_ok=True)
    save_path = SAVES_DIR / f"{game_state.save_id}.json"
    
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(game_state.model_dump(), f, ensure_ascii=False, indent=2)


async def load_game(save_id: str) -> Optional[GameState]:
    """
    加载指定存档
    
    Args:
        save_id: 存档ID
        
    Returns:
        GameState 对象，如果不存在则返回 None
    """
    save_path = SAVES_DIR / f"{save_id}.json"
    
    if not save_path.exists():
        return None
    
    with open(save_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    return GameState(**data)


async def list_saves() -> List[GameState]:
    """
    列出所有存档，按更新时间倒序排列
    
    Returns:
        GameState 对象列表
    """
    saves = []
    
    if not SAVES_DIR.exists():
        return saves
    
    for file in SAVES_DIR.glob("*.json"):
        try:
            with open(file, "r", encoding="utf-8") as f:
                data = json.load(f)
            saves.append(GameState(**data))
        except (json.JSONDecodeError, Exception):
            # 跳过损坏的存档文件
            continue
    
    # 按更新时间倒序排列
    saves.sort(key=lambda s: s.updated_at, reverse=True)
    return saves


async def delete_save(save_id: str) -> bool:
    """
    删除指定存档
    
    Args:
        save_id: 存档ID
        
    Returns:
        是否成功删除
    """
    save_path = SAVES_DIR / f"{save_id}.json"
    
    if save_path.exists():
        os.remove(save_path)
        return True
    
    return False


async def create_new_game(player_name: str = "玩家", map_id: str = "map_01") -> GameState:
    """
    创建新游戏
    
    Args:
        player_name: 玩家名称
        map_id: 地图 ID
        
    Returns:
        新创建的 GameState 对象
    """
    now = datetime.now().isoformat()
    game_state = GameState(
        save_id=str(uuid.uuid4()),
        player_name=player_name,
        map_id=map_id,
        current_position=0,
        completed_nodes=[],
        failed_nodes=[],
        dice_history=[],
        total_wins=0,
        total_losses=0,
        created_at=now,
        updated_at=now,
        is_completed=False
    )
    
    await save_game(game_state)
    return game_state


async def update_position(
    save_id: str, 
    position: int, 
    won: bool, 
    node_id: int
) -> Optional[GameState]:
    """
    更新玩家位置和战绩
    
    Args:
        save_id: 存档ID
        position: 新位置
        won: 是否胜利
        node_id: 格子ID
        
    Returns:
        更新后的 GameState 对象，如果不存在则返回 None
    """
    game_state = await load_game(save_id)
    if game_state is None:
        return None
    
    # 更新位置
    game_state.current_position = position
    
    # 更新通关/失败记录
    if won:
        if node_id not in game_state.completed_nodes:
            game_state.completed_nodes.append(node_id)
        game_state.total_wins += 1
    else:
        if node_id not in game_state.failed_nodes:
            game_state.failed_nodes.append(node_id)
        game_state.total_losses += 1
    
    # 更新时间
    game_state.updated_at = datetime.now().isoformat()
    
    await save_game(game_state)
    return game_state


async def add_dice_roll(save_id: str, dice_value: int) -> Optional[GameState]:
    """
    添加骰子记录
    
    Args:
        save_id: 存档ID
        dice_value: 骰子点数
        
    Returns:
        更新后的 GameState 对象，如果不存在则返回 None
    """
    game_state = await load_game(save_id)
    if game_state is None:
        return None
    
    game_state.dice_history.append(dice_value)
    game_state.updated_at = datetime.now().isoformat()
    
    await save_game(game_state)
    return game_state
