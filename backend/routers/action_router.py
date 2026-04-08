"""
动作副本路由 - 支持两种模式：
1. 传统指令输入模式（键盘按键序列）
2. Godot 横版动作模式（实时战斗、跑酷）
"""
from fastapi import APIRouter, HTTPException
from backend.models.action import (
    ActionDungeonState,
    ActionSubmitRequest,
    ActionResult
)
from backend.services.action_dungeon import generate_commands, validate_inputs
import uuid
from datetime import datetime

router = APIRouter(prefix="/dungeon/action", tags=["action_dungeon"])

# 临时存储 Godot 横版动作关卡状态
godot_action_sessions = {}


@router.post("/start", response_model=ActionDungeonState)
async def start_dungeon(data: dict):
    """
    开始动作副本（自动判断模式）
    
    Request Body:
        - difficulty: int - 难度等级 (1, 2, 3)
        - mode: str - 模式选择 ("keyboard" 或 "godot")，默认 "keyboard"
        - godot_level: str - Godot 关卡类型（可选，"speed_run", "castle_battle", "platform_challenge", "boss_battle"）
        - save_id: str - 存档 ID
        - node_id: int - 格子 ID
        
    Returns:
        ActionDungeonState: 包含指令序列、时间限制和 session_id（键盘模式）
        或 Godot 关卡配置（Godot 模式）
    """
    difficulty = data.get("difficulty", 1)
    mode = data.get("mode", "keyboard")
    godot_level = data.get("godot_level", "speed_run")
    save_id = data.get("save_id", "")
    node_id = data.get("node_id", 0)
    
    # 验证难度参数
    if not isinstance(difficulty, int) or difficulty < 1 or difficulty > 3:
        difficulty = 1
    
    if mode == "godot":
        # Godot 横版动作模式
        session_id = str(uuid.uuid4())
        
        # 存储会话信息
        godot_action_sessions[session_id] = {
            "godot_level": godot_level,
            "difficulty": difficulty,
            "save_id": save_id,
            "node_id": node_id,
            "start_time": datetime.now().isoformat(),
            "status": "active"
        }
        
        # 返回 Godot 关卡配置
        return {
            "session_id": session_id,
            "godot_level": godot_level,
            "difficulty": difficulty,
            "save_id": save_id,
            "node_id": node_id,
            "time_limit": get_time_limit_for_level(godot_level, difficulty),
            "objective": get_objective_for_level(godot_level)
        }
    else:
        # 传统键盘指令模式
        state = generate_commands(difficulty)
        return state


@router.post("/godot/submit", response_model=ActionResult)
async def submit_godot_result(request: dict):
    """
    提交 Godot 横版动作关卡结果
    
    Request Body:
        - session_id: str - 会话 ID
        - time_used: float - 用时（秒）
        - success: bool - 是否成功
        - stats: dict - 统计数据（击杀数、死亡次数等）
        
    Returns:
        ActionResult: 结果
    """
    session_id = request.get("session_id")
    time_used = request.get("time_used", 0.0)
    success = request.get("success", False)
    stats = request.get("stats", {})
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id 不能为空")
    
    # 获取会话信息
    session = godot_action_sessions.get(session_id)
    if not session:
        return ActionResult(
            success=False,
            correct_count=0,
            total_count=0,
            time_used=time_used
        )
    
    # 更新会话状态
    session["status"] = "completed"
    session["result"] = "success" if success else "failed"
    session["time_used"] = time_used
    session["stats"] = stats
    
    # 这里可以调用存档系统更新玩家进度
    # await update_game_state(session["save_id"], {...})
    
    return ActionResult(
        success=success,
        correct_count=stats.get("kills", 0) if success else 0,
        total_count=stats.get("total_enemies", 0),
        time_used=time_used
    )


@router.post("/submit", response_model=ActionResult)
async def submit_result(request: ActionSubmitRequest):
    """
    提交动作指令副本结果（键盘模式）
    
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


def get_time_limit_for_level(godot_level: str, difficulty: int) -> int:
    """根据 Godot 关卡类型和难度获取时间限制（秒）"""
    base_limits = {
        "speed_run": 60,
        "castle_battle": 180,
        "platform_challenge": 120,
        "boss_battle": 300
    }
    base = base_limits.get(godot_level, 60)
    # 难度越高时间越短
    difficulty_multiplier = {1: 1.2, 2: 1.0, 3: 0.8}.get(difficulty, 1.0)
    return int(base * difficulty_multiplier)


def get_objective_for_level(godot_level: str) -> str:
    """根据 Godot 关卡类型获取目标描述"""
    objectives = {
        "speed_run": "在限定时间内到达终点",
        "castle_battle": "击败所有敌人",
        "platform_challenge": "到达顶层",
        "boss_battle": "击败 Boss"
    }
    return objectives.get(godot_level, "完成关卡")
