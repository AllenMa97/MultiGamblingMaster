"""反向说服关卡路由"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import json
import asyncio

from backend.models.reverse import ReverseDungeonState
from backend.services.reverse_dungeon import (
    start_dungeon,
    generate_opponent_argument,
    submit_player_argument,
    generate_judge_response,
    get_session,
)

router = APIRouter(prefix="/api/dungeon/reverse", tags=["reverse_dungeon"])


class SubmitArgumentRequest(BaseModel):
    session_id: str
    argument: str


@router.post("/start")
async def start_reverse_dungeon():
    """开始反向说服关卡，返回 session_id 和荒谬论点"""
    state = await start_dungeon()
    return {
        "session_id": state.session_id,
        "absurd_claim": state.absurd_claim
    }


@router.post("/submit")
async def submit_argument(request: SubmitArgumentRequest):
    """提交玩家论点（REST 备用接口）"""
    await submit_player_argument(request.session_id, request.argument)
    return {"status": "success"}


@router.websocket("/ws/dungeon/reverse/{session_id}")
async def reverse_websocket(websocket: WebSocket, session_id: str):
    """WebSocket 连接处理 - 多轮辩论"""
    await websocket.accept()
    
    try:
        # 检查 session 是否存在
        state = get_session(session_id)
        if not state:
            await websocket.send_json({
                "type": "error",
                "content": "Session not found"
            })
            await websocket.close()
            return
        
        # 发送初始信息
        await websocket.send_json({
            "type": "game_info",
            "absurd_claim": state.absurd_claim,
            "max_rounds": state.max_rounds
        })
        
        # 多轮辩论循环
        while state.status != "finished":
            # 1. AI对手发言（流式）
            opponent_buffer = ""
            async for token in generate_opponent_argument(state):
                opponent_buffer += token
                await websocket.send_json({
                    "type": "opponent_argument",
                    "content": token,
                    "done": False,
                    "round": state.current_round + 1
                })
            
            await websocket.send_json({
                "type": "opponent_argument",
                "content": "",
                "done": True,
                "full_content": opponent_buffer,
                "round": state.current_round + 1
            })
            
            # 检查游戏是否结束
            if state.status == "finished":
                break
            
            # 2. 等待玩家发言
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=300.0)
                data = json.loads(message)
                
                if data.get("type") == "player_argument":
                    player_content = data.get("content", "")
                    await submit_player_argument(session_id, player_content)
                else:
                    await websocket.send_json({
                        "type": "error",
                        "content": "Invalid message type, expected 'player_argument'"
                    })
                    continue
                    
            except asyncio.TimeoutError:
                await websocket.send_json({
                    "type": "error",
                    "content": "Timeout waiting for player argument"
                })
                break
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "content": "Invalid JSON format"
                })
                continue
            
            # 3. 裁判回应（流式）
            judge_buffer = ""
            async for token in generate_judge_response(state):
                judge_buffer += token
                await websocket.send_json({
                    "type": "judge_response",
                    "content": token,
                    "done": False,
                    "round": state.current_round + 1
                })
            
            await websocket.send_json({
                "type": "judge_response",
                "content": "",
                "done": True,
                "full_content": judge_buffer,
                "round": state.current_round + 1
            })
            
            # 检查游戏是否结束
            if state.status == "finished":
                break
        
        # 游戏结束，发送结果
        state = get_session(session_id)
        if state and state.result:
            await websocket.send_json({
                "type": "result",
                "result": state.result,
                "message": "恭喜你成功说服了裁判！" if state.result == "win" else "很遗憾，裁判没有被你说服。"
            })
    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "content": str(e)
            })
        except:
            pass
        await websocket.close()
