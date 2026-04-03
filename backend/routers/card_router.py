from fastapi import APIRouter, HTTPException
from backend.models.card import (
    CardDungeonRequest, 
    CardDungeonState, 
    CardMagicRequest,
    CardRoundRequest
)
from backend.services.card_dungeon import start_dungeon, apply_magic, play_round, get_session

router = APIRouter(prefix="/dungeon/card", tags=["card_dungeon"])


@router.post("/start", response_model=CardDungeonState)
async def card_dungeon_start(request: CardDungeonRequest):
    """
    开始扑克牌副本(三局两胜制)
    
    开始一局新的扑克牌对决，采用三局两胜制
    
    Args:
        request: 包含 game_mode 的请求体
        
    Returns:
        CardDungeonState: 副本状态，包含 session_id，但不包含具体牌面
    """
    try:
        state = start_dungeon(game_mode=request.game_mode)
        return state
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"开始副本失败: {str(e)}")


@router.post("/magic", response_model=CardDungeonState)
async def card_dungeon_magic(request: CardMagicRequest):
    """
    应用魔法指令
    
    在下一轮发牌前应用魔法指令，影响发牌结果
    
    支持的魔法指令:
    - "大"/"大牌": 玩家抽到 J/Q/K/A 的概率提升到 60%
    - "小"/"小牌": 对手抽到 2-6 的概率提升到 60%
    - "黑桃"/"红心"/"方块"/"梅花": 玩家抽到指定花色的概率提升到 50%
    - "炸"/"boom": 双方都从大牌区(10-A)随机抽
    - "换"/"swap": 先正常发牌，然后交换双方的牌
    - 其他指令: 随机效果
    
    Args:
        request: 包含 session_id 和 command 的请求体
        
    Returns:
        CardDungeonState: 更新后的副本状态
    """
    state = apply_magic(request.session_id, request.command)
    
    if state is None:
        raise HTTPException(status_code=404, detail="会话不存在或已过期")
    
    return state


@router.post("/round", response_model=CardDungeonState)
async def card_dungeon_round(request: CardRoundRequest):
    """
    进行一轮对决（包含 LLM 干预）
    
    执行一轮发牌和比大小，返回本轮结果和当前状态
    
    Args:
        request: 包含 session_id 和可选 magic_command 的请求体
        
    Returns:
        CardDungeonState: 包含本轮结果和当前状态的副本状态
    """
    # 获取 magic_command（如果有）
    magic_command = getattr(request, 'magic_command', None)
    
    state = await play_round(request.session_id, magic_command)
    
    if state is None:
        raise HTTPException(status_code=404, detail="会话不存在或已过期")
    
    return state
