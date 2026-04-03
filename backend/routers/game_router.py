"""
游戏路由
处理游戏存档相关的 API 请求
"""
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from backend.models.game_state import (
    GameState, 
    SaveGameRequest, 
    LoadGameResponse,
    UpdatePositionRequest
)
from backend.services.database import (
    init_db,
    create_new_game,
    save_game,
    load_game,
    list_saves,
    delete_save,
    update_position
)

# 数据库初始化标志
_db_initialized = False


async def ensure_db_initialized():
    """确保数据库已初始化（懒加载）"""
    global _db_initialized
    if not _db_initialized:
        await init_db()
        _db_initialized = True


router = APIRouter(prefix="/game", tags=["game"])


@router.post("/new", response_model=GameState)
async def create_game(request: SaveGameRequest):
    """
    创建新游戏
    
    创建一个新的游戏存档
    
    Args:
        request: 包含玩家名称和地图 ID 的请求体
        
    Returns:
        GameState: 新创建的游戏状态
    """
    await ensure_db_initialized()
    player_name = request.player_name or "玩家"
    map_id = request.map_id or "map_01"
    return await create_new_game(player_name, map_id)


@router.get("/saves", response_model=List[GameState])
async def get_saves():
    """
    列出所有存档
    
    获取所有游戏存档列表，按更新时间倒序排列
    
    Returns:
        List[GameState]: 存档列表
    """
    await ensure_db_initialized()
    return await list_saves()


@router.get("/load/{save_id}", response_model=LoadGameResponse)
async def get_game(save_id: str):
    """
    加载指定存档
    
    根据存档ID加载游戏状态
    
    Args:
        save_id: 存档ID
        
    Returns:
        LoadGameResponse: 游戏状态
        
    Raises:
        HTTPException: 存档不存在时返回 404
    """
    await ensure_db_initialized()
    game_state = await load_game(save_id)
    
    if game_state is None:
        raise HTTPException(status_code=404, detail=f"存档 {save_id} 不存在")
    
    return game_state


@router.put("/save/{save_id}", response_model=GameState)
async def update_game(save_id: str, game_state: GameState):
    """
    保存游戏状态
    
    保存或更新游戏状态
    
    Args:
        save_id: 存档ID
        game_state: 游戏状态
        
    Returns:
        GameState: 保存后的游戏状态
        
    Raises:
        HTTPException: 存档ID不匹配时返回 400
    """
    await ensure_db_initialized()
    
    if game_state.save_id != save_id:
        raise HTTPException(
            status_code=400, 
            detail="存档ID不匹配"
        )
    
    await save_game(game_state)
    return game_state


@router.delete("/delete/{save_id}")
async def remove_game(save_id: str):
    """
    删除存档
    
    删除指定的游戏存档
    
    Args:
        save_id: 存档ID
        
    Returns:
        dict: 删除结果
        
    Raises:
        HTTPException: 存档不存在时返回 404
    """
    await ensure_db_initialized()
    deleted = await delete_save(save_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail=f"存档 {save_id} 不存在")
    
    return {"message": f"存档 {save_id} 已删除", "save_id": save_id}


@router.put("/update-position/{save_id}", response_model=GameState)
async def update_game_position(save_id: str, request: UpdatePositionRequest):
    """
    更新位置和战绩
    
    更新玩家当前位置，并记录通关或失败
    
    Args:
        save_id: 存档ID
        request: 包含位置、胜负结果和格子ID的请求体
        
    Returns:
        GameState: 更新后的游戏状态
        
    Raises:
        HTTPException: 存档不存在时返回 404
    """
    await ensure_db_initialized()
    game_state = await update_position(
        save_id=save_id,
        position=request.position,
        won=request.won,
        node_id=request.node_id
    )
    
    if game_state is None:
        raise HTTPException(status_code=404, detail=f"存档 {save_id} 不存在")
    
    return game_state


# 注意：需要在 main.py 中添加以下代码来注册路由：
# from backend.routers import game_router
# app.include_router(game_router.router, prefix="/api")
