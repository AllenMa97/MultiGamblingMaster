"""地图服务"""
import json
import os
from typing import Optional, Dict, List

from backend.models.map_data import MapData, MapNode, MapMeta, City, Region, Challenge, ChainStory


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


# 中国地图城市网络相关函数
def get_available_start_cities(map_id: str = "china_travel") -> List[City]:
    """获取所有可选的起点城市"""
    map_data = load_map(map_id)
    start_cities = []
    
    for region in map_data.regions:
        for city in region.cities:
            if city.is_start_city:
                start_cities.append(city)
    
    return start_cities


def get_city(map_id: str, city_id: str) -> Optional[City]:
    """获取指定城市信息"""
    map_data = load_map(map_id)
    
    for region in map_data.regions:
        for city in region.cities:
            if city.city_id == city_id:
                return city
    
    return None


def get_all_cities(map_id: str = "china_travel") -> List[City]:
    """获取所有城市"""
    map_data = load_map(map_id)
    all_cities = []
    
    for region in map_data.regions:
        all_cities.extend(region.cities)
    
    return all_cities


def get_unlocked_cities(map_id: str, current_city_id: str, visited_cities: List[str]) -> List[str]:
    """根据当前城市，获取可前往的下一个城市列表"""
    current_city = get_city(map_id, current_city_id)
    if not current_city:
        return []
    
    # 可前往的城市 = 当前城市解锁的城市
    unlocked = current_city.unlocks
    
    # 过滤掉已经访问过的（可选，看设计需求）
    # unlocked = [city for city in unlocked if city not in visited_cities]
    
    return unlocked


def can_travel_to(map_id: str, from_city_id: str, to_city_id: str) -> bool:
    """检查是否可以从一个城市前往另一个城市"""
    from_city = get_city(map_id, from_city_id)
    if not from_city:
        return False
    
    return to_city_id in from_city.unlocks


def get_city_challenge(map_id: str, city_id: str, challenge_id: str) -> Optional[Challenge]:
    """获取城市的指定挑战"""
    city = get_city(map_id, city_id)
    if not city:
        return None
    
    for challenge in city.challenges:
        if challenge.id == challenge_id:
            return challenge
    
    return None


def get_chain_story(map_id: str, story_id: str) -> Optional[ChainStory]:
    """获取连锁剧情"""
    map_data = load_map(map_id)
    
    for story in map_data.chain_stories:
        if story.id == story_id:
            return story
    
    return None


def check_chain_story_trigger(map_id: str, city_id: str, challenge_id: str, 
                               completed_challenges: Dict[str, List[str]]) -> Optional[ChainStory]:
    """检查是否触发连锁剧情"""
    map_data = load_map(map_id)
    
    for story in map_data.chain_stories:
        # 检查城市和挑战是否都完成
        if city_id not in story.trigger_cities:
            continue
        
        if challenge_id not in story.trigger_challenges:
            continue
        
        # 检查所有触发条件是否满足
        all_completed = True
        for trigger_city in story.trigger_cities:
            if trigger_city not in completed_challenges:
                all_completed = False
                break
            
            # 检查该城市的所有触发挑战是否都完成
            for trigger_challenge in story.trigger_challenges:
                if trigger_challenge not in completed_challenges.get(trigger_city, []):
                    all_completed = False
                    break
        
        if all_completed:
            return story
    
    return None


def get_city_progress(map_id: str, visited_cities: List[str], 
                     completed_challenges: Dict[str, List[str]]) -> Dict:
    """获取城市探索进度"""
    all_cities = get_all_cities(map_id)
    progress = {
        "total_cities": len(all_cities),
        "visited_cities": visited_cities,
        "completed_challenges": completed_challenges,
        "cities_detail": []
    }
    
    for city in all_cities:
        city_progress = {
            "city_id": city.city_id,
            "name": city.name,
            "visited": city.city_id in visited_cities,
            "completed_count": len(completed_challenges.get(city.city_id, [])),
            "total_challenges": len(city.challenges)
        }
        progress["cities_detail"].append(city_progress)
    
    return progress
