"""地图服务"""
import json
import os
from typing import Optional, Dict, List

from backend.models.map_data import MapData, MapNode, MapMeta


# 地图数据缓存 {map_id: MapData}
_map_cache: Dict[str, MapData] = {}


def _get_maps_directory() -> str:
    """获取地图目录路径"""
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(current_dir, "data", "maps")


def _get_map_file_path(map_id: str) -> str:
    """获取指定地图文件路径"""
    maps_dir = _get_maps_directory()
    return os.path.join(maps_dir, f"{map_id}.json")


def list_maps() -> List[MapMeta]:
    """列出所有可用地图"""
    maps_dir = _get_maps_directory()
    maps = []
    
    if os.path.exists(maps_dir):
        for filename in os.listdir(maps_dir):
            if filename.endswith('.json'):
                map_id = filename[:-5]  # 去掉 .json
                try:
                    map_data = load_map(map_id)
                    maps.append(MapMeta(
                        map_id=map_id,
                        name=map_data.name,
                        description=map_data.description,
                        node_count=len(map_data.nodes)
                    ))
                except Exception:
                    continue
    
    return maps


def load_map(map_id: str = "map_01") -> MapData:
    """加载指定地图配置"""
    global _map_cache
    
    # 检查缓存
    if map_id in _map_cache:
        return _map_cache[map_id]
    
    config_path = _get_map_file_path(map_id)
    
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"地图 {map_id} 不存在")
    
    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    map_data = MapData(
        map_id=data.get("map_id", map_id),
        name=data.get("name", "未知地图"),
        description=data.get("description", ""),
        nodes=data["nodes"]
    )
    
    # 缓存地图数据
    _map_cache[map_id] = map_data
    return map_data


def get_map_data(map_id: str = "map_01") -> MapData:
    """获取指定地图完整数据"""
    return load_map(map_id)


def get_node(map_id: str, node_id: int) -> Optional[MapNode]:
    """获取指定地图的单个节点信息"""
    map_data = load_map(map_id)
    for node in map_data.nodes:
        if node.id == node_id:
            return node
    return None


def get_total_nodes(map_id: str = "map_01") -> int:
    """获取指定地图的节点总数"""
    map_data = load_map(map_id)
    return len(map_data.nodes)


# 向后兼容的默认地图函数（使用 map_01 作为默认）
def load_default_map() -> MapData:
    """加载默认地图（向后兼容）"""
    return load_map("map_01")


def get_default_map_data() -> MapData:
    """获取默认地图数据（向后兼容）"""
    return get_map_data("map_01")


def get_default_node(node_id: int) -> Optional[MapNode]:
    """获取默认地图的节点（向后兼容）"""
    return get_node("map_01", node_id)


def get_default_total_nodes() -> int:
    """获取默认地图节点总数（向后兼容）"""
    return get_total_nodes("map_01")
