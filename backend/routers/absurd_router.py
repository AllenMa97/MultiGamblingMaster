"""AI胡说大赛关卡路由"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import json
import asyncio

from backend.models.absurd import AbsurdDungeonState
from backend.services.absurd_dungeon import (
    start_dungeon,
    generate_opponent_answer,
    submit_player_answer,
    generate_judge_verdict,
    get_session,
)

router = APIRouter(prefix="/api/dungeon/absurd", tags=["absurd_dungeon"])


class SubmitAnswerRequest(BaseModel):
    session_id: str
    answer: str


@router.post("/start")
async def start_absurd_dungeon():
    """开始AI胡说大赛关卡，返回 session_id 和题目"""
    state = await start_dungeon()
    return {
        "session_id": state.session_id,
        "topic": state.topic
    }


@router.post("/submit")
async def submit_answer(request: SubmitAnswerRequest):
    """提交玩家答案（REST 备用接口）"""
    await submit_player_answer(request.session_id, request.answer)
    return {"status": "success"}


@router.websocket("/ws/dungeon/absurd/{session_id}")
async def absurd_websocket(websocket: WebSocket, session_id: str):
    """WebSocket 连接处理"""
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
        
        # 1. 流式发送对手的胡说答案
        opponent_buffer = ""
        async for token in generate_opponent_answer(session_id):
            opponent_buffer += token
            await websocket.send_json({
                "type": "opponent_answer",
                "content": token,
                "done": False
            })
        
        # 发送完成标记
        await websocket.send_json({
            "type": "opponent_answer",
            "content": "",
            "done": True,
            "full_content": opponent_buffer
        })
        
        # 2. 等待客户端发送玩家答案
        try:
            message = await asyncio.wait_for(websocket.receive_text(), timeout=300.0)
            data = json.loads(message)
            
            if data.get("type") == "player_answer":
                player_content = data.get("content", "")
                await submit_player_answer(session_id, player_content)
                
                # 3. 流式发送裁判评判
                judge_buffer = ""
                async for token in generate_judge_verdict(session_id):
                    judge_buffer += token
                    await websocket.send_json({
                        "type": "judge_verdict",
                        "content": token,
                        "done": False
                    })
                
                # 发送完成标记
                await websocket.send_json({
                    "type": "judge_verdict",
                    "content": "",
                    "done": True,
                    "full_content": judge_buffer
                })
                
                # 4. 发送最终结果
                state = get_session(session_id)
                if state and state.result:
                    await websocket.send_json({
                        "type": "result",
                        "result": state.result,
                        "message": "恭喜你赢得了胡说大师称号！" if state.result == "win" else "很遗憾，对手的胡说更胜一筹。"
                    })
            else:
                await websocket.send_json({
                    "type": "error",
                    "content": "Invalid message type"
                })
                
        except asyncio.TimeoutError:
            await websocket.send_json({
                "type": "error",
                "content": "Timeout waiting for player answer"
            })
        except json.JSONDecodeError:
            await websocket.send_json({
                "type": "error",
                "content": "Invalid JSON format"
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
