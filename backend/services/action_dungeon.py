"""
动作指令副本服务
"""
import random
import string
import uuid
from typing import Dict, Optional
from backend.models.action import ActionCommand, ActionDungeonState, ActionResult


# 内存存储 session
sessions: Dict[str, ActionDungeonState] = {}

# 方向键映射
ARROW_COMMANDS = [
    {"type": "arrow", "value": "up", "display": "↑"},
    {"type": "arrow", "value": "down", "display": "↓"},
    {"type": "arrow", "value": "left", "display": "←"},
    {"type": "arrow", "value": "right", "display": "→"},
]


def generate_commands(difficulty: int = 1) -> ActionDungeonState:
    """
    生成指令序列
    
    Args:
        difficulty: 难度等级 (1, 2, 3)
        
    Returns:
        ActionDungeonState: 包含指令序列、时间限制和 session_id
    """
    # 根据难度确定参数
    if difficulty == 1:
        count = random.randint(6, 8)
        time_limit = 10.0
    elif difficulty == 2:
        count = random.randint(10, 12)
        time_limit = 8.0
    else:  # difficulty >= 3
        count = random.randint(14, 16)
        time_limit = 6.0
    
    commands: list[ActionCommand] = []
    
    for _ in range(count):
        # 50% 概率生成方向键，50% 概率生成字母键
        if random.random() < 0.5:
            # 方向键
            cmd_data = random.choice(ARROW_COMMANDS)
            commands.append(ActionCommand(**cmd_data))
        else:
            # 字母键 (a-z)
            letter = random.choice(string.ascii_lowercase)
            commands.append(ActionCommand(
                type="key",
                value=letter,
                display=letter.upper()
            ))
    
    # 生成 session_id
    session_id = str(uuid.uuid4())
    
    # 创建状态
    state = ActionDungeonState(
        commands=commands,
        time_limit=time_limit,
        session_id=session_id
    )
    
    # 存储 session
    sessions[session_id] = state
    
    return state


def validate_inputs(
    session_id: str,
    inputs: list[str],
    time_used: float
) -> ActionResult:
    """
    验证玩家输入
    
    Args:
        session_id: 会话 ID
        inputs: 玩家输入的指令列表
        time_used: 用时（秒）
        
    Returns:
        ActionResult: 验证结果
    """
    # 获取 session
    state = sessions.get(session_id)
    if state is None:
        return ActionResult(
            success=False,
            correct_count=0,
            total_count=len(inputs) if inputs else 0,
            time_used=time_used
        )
    
    # 获取期望的指令值列表
    expected = [cmd.value for cmd in state.commands]
    total_count = len(expected)
    
    # 计算正确数量
    correct_count = 0
    for i, user_input in enumerate(inputs):
        if i < len(expected) and user_input.lower() == expected[i]:
            correct_count += 1
        else:
            # 一旦有一个错误，就停止计数
            break
    
    # 检查是否超时
    is_timeout = time_used > state.time_limit
    
    # 成功条件：全部正确且未超时
    is_success = (correct_count == total_count) and not is_timeout and len(inputs) == total_count
    
    # 清理 session
    if session_id in sessions:
        del sessions[session_id]
    
    return ActionResult(
        success=is_success,
        correct_count=correct_count,
        total_count=total_count,
        time_used=time_used
    )


def get_session(session_id: str) -> Optional[ActionDungeonState]:
    """获取 session 状态（用于调试）"""
    return sessions.get(session_id)


def clear_expired_sessions():
    """清理过期 session（预留接口）"""
    # 当前实现中 session 在验证后即被清理
    # 如需自动清理，可在此添加时间戳检查逻辑
    pass
