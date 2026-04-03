"""AI 辩论副本路由"""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse

from backend.models.ai_dungeon import AIDungeonState, AIDungeonStartRequest, WebSocketMessage
from backend.services import ai_dungeon as dungeon_service

router = APIRouter(prefix="/api/dungeon/ai", tags=["ai_dungeon"])


@router.post("/start", response_model=AIDungeonState)
async def start_dungeon(request: AIDungeonStartRequest = None):
    """开始新的 AI 辩论副本"""
    max_rounds = request.max_rounds if request else 3
    session = dungeon_service.create_session(max_rounds=max_rounds)
    
    # 返回时隐藏对手的牌
    response_data = session.model_dump()
    response_data["opponent_card"] = {"hidden": True}
    
    return JSONResponse(content=response_data)


@router.get("/state/{session_id}", response_model=AIDungeonState)
async def get_dungeon_state(session_id: str):
    """获取当前辩论副本状态"""
    session = dungeon_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    # 返回时隐藏对手的牌
    response_data = session.model_dump()
    if session.status != "finished":
        response_data["opponent_card"] = {"hidden": True}
    
    return JSONResponse(content=response_data)


@router.websocket("/ws/dungeon/ai/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket 端点用于实时辩论对话"""
    await websocket.accept()
    
    # 获取会话
    session = dungeon_service.get_session(session_id)
    if not session:
        await websocket.send_json({
            "type": "error",
            "content": "会话不存在",
            "done": True
        })
        await websocket.close()
        return
    
    try:
        # 发送对手开场白
        await websocket.send_json({
            "type": "opponent_message",
            "content": "",
            "done": False
        })
        
        opening_text = ""
        async for token in dungeon_service.generate_opponent_opening(session):
            opening_text += token
            await websocket.send_json({
                "type": "opponent_message",
                "content": token,
                "done": False
            })
        
        # 开场白结束标记
        await websocket.send_json({
            "type": "opponent_message",
            "content": "",
            "done": True
        })
        
        # 主循环：处理玩家消息
        while session.status == "playing":
            # 接收玩家消息
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "content": "消息格式错误",
                    "done": True
                })
                continue
            
            if message_data.get("type") != "player_message":
                await websocket.send_json({
                    "type": "error",
                    "content": "未知消息类型",
                    "done": True
                })
                continue
            
            player_content = message_data.get("content", "").strip()
            if not player_content:
                await websocket.send_json({
                    "type": "error",
                    "content": "消息不能为空",
                    "done": True
                })
                continue
            
            # 发送玩家消息确认
            await websocket.send_json({
                "type": "player_message",
                "content": player_content,
                "done": True
            })
            
            # 生成对手回复（流式）
            await websocket.send_json({
                "type": "opponent_message",
                "content": "",
                "done": False
            })
            
            async for token in dungeon_service.generate_opponent_response(session, player_content):
                await websocket.send_json({
                    "type": "opponent_message",
                    "content": token,
                    "done": False
                })
            
            # 对手回复结束
            await websocket.send_json({
                "type": "opponent_message",
                "content": "",
                "done": True
            })
            
            # 刷新会话状态
            session = dungeon_service.get_session(session_id)
        
        # 辩论结束，进入裁判阶段
        if session.status == "judging":
            await websocket.send_json({
                "type": "judge_message",
                "content": "",
                "done": False
            })
            
            async for token in dungeon_service.generate_judge_verdict(session):
                await websocket.send_json({
                    "type": "judge_message",
                    "content": token,
                    "done": False
                })
            
            # 裁判判决结束
            await websocket.send_json({
                "type": "judge_message",
                "content": "",
                "done": True
            })
            
            # 刷新会话状态获取结果
            session = dungeon_service.get_session(session_id)
        
        # 发送最终结果
        if session.status == "finished" and session.result:
            await websocket.send_json({
                "type": "result",
                "result": session.result,
                "done": True
            })
        
    except WebSocketDisconnect:
        print(f"客户端断开连接: {session_id}")
    except Exception as e:
        print(f"WebSocket 错误: {e}")
        await websocket.send_json({
            "type": "error",
            "content": f"服务器错误: {str(e)}",
            "done": True
        })
    finally:
        # 清理会话
        dungeon_service.cleanup_session(session_id)
        await websocket.close()
