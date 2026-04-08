"""中国地图相关 API 路由"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict

from backend.models.map_data import MapData, City, Challenge
from backend.services.map_service import (
    get_map_data,
    get_available_start_cities,
    get_city,
    get_all_cities,
    get_unlocked_cities,
    can_travel_to,
    get_city_challenge,
    get_city_progress,
    check_chain_story_trigger,
    get_chain_story
)
from backend.services.database import load_game, save_game

router = APIRouter(prefix="/api/china-map", tags=["中国地图"])


@router.get("/info", response_model=MapData)
async def get_china_map_info(map_id: str = "china_travel"):
    """获取中国地图完整信息"""
    return get_map_data(map_id)


@router.get("/start-cities", response_model=List[City])
async def get_start_cities(map_id: str = "china_travel"):
    """获取所有可选的起点城市"""
    return get_available_start_cities(map_id)


@router.get("/city/{city_id}", response_model=City)
async def get_city_info(city_id: str, map_id: str = "china_travel"):
    """获取指定城市信息"""
    city = get_city(map_id, city_id)
    if not city:
        raise HTTPException(status_code=404, detail="城市不存在")
    return city


@router.get("/all-cities", response_model=List[City])
async def get_all_cities_endpoint(map_id: str = "china_travel"):
    """获取所有城市列表"""
    return get_all_cities(map_id)


@router.get("/unlocked-cities")
async def get_unlocked_cities_endpoint(
    current_city: str,
    save_id: str,
    map_id: str = "china_travel"
):
    """获取可前往的城市列表"""
    game_state = load_game(save_id)
    unlocked = get_unlocked_cities(map_id, current_city, game_state.visited_cities)
    return {
        "current_city": current_city,
        "unlocked_cities": unlocked,
        "can_travel_to": unlocked
    }


@router.post("/travel")
async def travel_to_city(
    from_city: str,
    to_city: str,
    save_id: str,
    map_id: str = "china_travel"
):
    """前往另一个城市"""
    # 验证移动合法性
    if not can_travel_to(map_id, from_city, to_city):
        raise HTTPException(
            status_code=400, 
            detail=f"无法从 {from_city} 直接前往 {to_city}，需要先探索中间城市"
        )
    
    # 加载游戏状态
    game_state = load_game(save_id)
    
    # 更新位置
    game_state.current_city = to_city
    
    # 标记为已访问
    if to_city not in game_state.visited_cities:
        game_state.visited_cities.append(to_city)
    
    # 保存游戏
    save_game(game_state)
    
    return {
        "success": True,
        "current_city": to_city,
        "message": f"成功到达 {to_city}"
    }


@router.get("/city/{city_id}/challenge/{challenge_id}")
async def get_challenge_info(
    city_id: str,
    challenge_id: str,
    map_id: str = "china_travel"
):
    """获取城市挑战信息"""
    challenge = get_city_challenge(map_id, city_id, challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="挑战不存在")
    return challenge


@router.get("/progress/{save_id}")
async def get_city_progress_endpoint(
    save_id: str,
    map_id: str = "china_travel"
):
    """获取城市探索进度"""
    game_state = load_game(save_id)
    progress = get_city_progress(
        map_id,
        game_state.visited_cities,
        game_state.completed_challenges
    )
    return progress


@router.post("/check-chain-story")
async def check_chain_story(
    city_id: str,
    challenge_id: str,
    save_id: str,
    map_id: str = "china_travel"
):
    """检查是否触发连锁剧情"""
    game_state = load_game(save_id)
    
    story = check_chain_story_trigger(
        map_id,
        city_id,
        challenge_id,
        game_state.completed_challenges
    )
    
    if not story:
        return {"triggered": False}
    
    # 检查是否已经触发过
    if story.id in game_state.chain_stories_triggered:
        return {
            "triggered": False,
            "already_triggered": True,
            "message": "该剧情已触发过"
        }
    
    return {
        "triggered": True,
        "story": {
            "id": story.id,
            "name": story.name,
            "description": story.description,
            "reward": story.reward
        }
    }


@router.post("/trigger-chain-story")
async def trigger_chain_story(
    story_id: str,
    save_id: str,
    map_id: str = "china_travel"
):
    """触发连锁剧情"""
    game_state = load_game(save_id)
    
    # 检查剧情是否存在
    story = get_chain_story(map_id, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="剧情不存在")
    
    # 添加到已触发列表
    if story_id not in game_state.chain_stories_triggered:
        game_state.chain_stories_triggered.append(story_id)
        save_game(game_state)
    
    return {
        "success": True,
        "story": {
            "id": story.id,
            "name": story.name,
            "reward": story.reward
        },
        "message": f"成功触发剧情：{story.name}"
    }
