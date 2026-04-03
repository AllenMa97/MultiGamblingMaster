"""
动作指令副本路由
"""
from fastapi import APIRouter, HTTPException
from backend.models.action import (
    ActionDungeonState,
    ActionSubmitRequest,
    ActionResult
)
from backend.services.action_dungeon import generate_commands, validate_inputs

router = APIRouter(prefix="/dungeon/action", tags=["action_dungeon"])


@router.post("/start", response_model=ActionDungeonState)
async def start_dungeon(data: dict):
    """
    开始动作指令副本
    
    Request Body:
        - difficulty: int - 难度等级 (1, 2, 3)
        
    Returns:
        ActionDungeonState: 包含指令序列、时间限制和 session_id
    """
    difficulty = data.get("difficulty", 1)
    
    # 验证难度参数
    if not isinstance(difficulty, int) or difficulty < 1 or difficulty > 3:
        difficulty = 1
    
    # 生成指令序列
    state = generate_commands(difficulty)
    
    return state


@router.post("/submit", response_model=ActionResult)
async def submit_result(request: ActionSubmitRequest):
    """
    提交动作指令副本结果
    
    Request Body:
        - session_id: str - 会话 ID
        - inputs: List[str] - 玩家输入的指令列表
        - time_used: float - 用时（秒）
        
    Returns:
        ActionResult: 验证结果
    """
    # 验证输入
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id 不能为空")
    
    # 验证结果
    result = validate_inputs(
        session_id=request.session_id,
        inputs=request.inputs,
        time_used=request.time_used
    )
    
    return result
