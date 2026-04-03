"""地图路由"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from backend.models.map_data import MapData, MapNode, DiceResult, MapMeta
from backend.services.map_service import get_map_data, get_node, list_maps
from backend.services.dice_service import roll_dice, calculate_move


router = APIRouter(prefix="/api/map", tags=["map"])


class RollDiceRequest(BaseModel):
    """掷骰子请求"""
    current_position: int
    map_id: Optional[str] = "map_01"  # 默认使用新手村地图


class ChoosePathRequest(BaseModel):
    """选择路径请求"""
    current_position: int
    steps: int
    choice: int
    map_id: Optional[str] = "map_01"  # 默认使用新手村地图


@router.get("/list", response_model=List[MapMeta])
async def get_map_list():
    """获取所有可用地图列表"""
    return list_maps()


@router.get("/data/{map_id}", response_model=MapData)
async def get_map(map_id: str):
    """获取指定地图完整数据"""
    try:
        return get_map_data(map_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"地图 {map_id} 不存在")


# 向后兼容的旧API
@router.get("/data", response_model=MapData)
async def get_default_map():
    """获取默认地图数据（向后兼容）"""
    return get_map_data("map_01")


@router.get("/node/{map_id}/{node_id}", response_model=MapNode)
async def get_node_info(map_id: str, node_id: int):
    """获取指定地图的单个节点信息"""
    try:
        node = get_node(map_id, node_id)
        if node is None:
            raise HTTPException(status_code=404, detail=f"节点 {node_id} 不存在")
        return node
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"地图 {map_id} 不存在")


# 向后兼容的旧API
@router.get("/node/{node_id}", response_model=MapNode)
async def get_default_node_info(node_id: int):
    """获取默认地图的节点信息（向后兼容）"""
    node = get_node("map_01", node_id)
    if node is None:
        raise HTTPException(status_code=404, detail=f"节点 {node_id} 不存在")
    return node


@router.post("/roll-dice", response_model=DiceResult)
async def roll_and_move(request: RollDiceRequest):
    """
    掷骰子并计算移动
    
    如果遇到分叉路径，会返回 need_choice=true 和 choices 选项
    """
    map_id = request.map_id or "map_01"
    
    try:
        # 验证当前位置
        current_node = get_node(map_id, request.current_position)
        if current_node is None:
            raise HTTPException(status_code=400, detail=f"当前位置 {request.current_position} 无效")
        
        # 掷骰子
        dice_value = roll_dice()
        
        # 计算移动
        map_data = get_map_data(map_id)
        result = calculate_move(
            current_pos=request.current_position,
            steps=dice_value,
            map_data=map_data
        )
        
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"地图 {map_id} 不存在")


@router.post("/choose-path", response_model=DiceResult)
async def choose_path(request: ChoosePathRequest):
    """
    选择分叉路径后继续移动
    
    在 roll-dice 返回 need_choice=true 后，使用此接口选择路径
    """
    map_id = request.map_id or "map_01"
    
    try:
        # 验证当前位置
        current_node = get_node(map_id, request.current_position)
        if current_node is None:
            raise HTTPException(status_code=400, detail=f"当前位置 {request.current_position} 无效")
        
        # 验证选择是否有效
        if current_node is not None and len(current_node.next) > 1:
            if request.choice not in current_node.next:
                raise HTTPException(
                    status_code=400, 
                    detail=f"无效的选择 {request.choice}，可选值为 {current_node.next}"
                )
        
        # 计算移动
        map_data = get_map_data(map_id)
        result = calculate_move(
            current_pos=request.current_position,
            steps=request.steps,
            map_data=map_data,
            choice=request.choice
        )
        
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"地图 {map_id} 不存在")
