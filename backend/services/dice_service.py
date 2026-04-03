"""骰子服务"""
import random
from typing import Optional

from backend.models.map_data import DiceResult, MapData
from backend.services.map_service import get_node, get_total_nodes


def roll_dice() -> int:
    """掷骰子，返回1-6随机数"""
    return random.randint(1, 6)


def calculate_move(
    current_pos: int,
    steps: int,
    map_data: MapData,
    choice: Optional[int] = None
) -> DiceResult:
    """
    计算移动
    
    Args:
        current_pos: 当前位置
        steps: 步数
        map_data: 地图数据
        choice: 分叉路径选择（可选）
    
    Returns:
        DiceResult: 骰子结果
    """
    # 从 map_data 获取总节点数
    total_nodes = len(map_data.nodes)
    path = [current_pos]
    remaining_steps = steps
    need_choice = False
    choices = None
    
    # 构建节点id到节点的映射
    node_map = {node.id: node for node in map_data.nodes}
    
    while remaining_steps > 0:
        current_node = node_map.get(current_pos)
        
        if current_node is None:
            break
        
        # 检查是否到达终点
        if current_node.type == "end" or len(current_node.next) == 0:
            break
        
        # 检查是否有分叉
        if len(current_node.next) > 1:
            if choice is None:
                # 需要用户选择
                need_choice = True
                choices = current_node.next
                break
            else:
                # 使用用户选择的路径
                if choice in current_node.next:
                    current_pos = choice
                    choice = None  # 重置选择，只使用一次
                else:
                    # 无效选择，默认选择第一个
                    current_pos = current_node.next[0]
        else:
            # 单一路径
            current_pos = current_node.next[0]
        
        path.append(current_pos)
        remaining_steps -= 1
        
        # 检查是否超出地图范围
        if current_pos >= total_nodes - 1:
            break
    
    return DiceResult(
        value=steps,
        current_position=path[0],
        new_position=current_pos,
        path=path,
        need_choice=need_choice,
        choices=choices,
        remaining_steps=remaining_steps
    )
