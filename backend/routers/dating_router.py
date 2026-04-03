"""AI泡妞副本路由"""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse

from backend.models.dating import DatingDungeonState, DatingStartRequest
from backend.services import dating_dungeon as dungeon_service

router = APIRouter(prefix="/api/dungeon/dating", tags=["dating_dungeon"])


@router.post("/start")
async def start_dungeon(request: DatingStartRequest = None):
    """开始新的AI泡妞副本"""
    player_name = request.player_name if request else "玩家"
    session = dungeon_service.start_dungeon(player_name)
    return JSONResponse(content=session.model_dump())


@router.get("/state/{session_id}")
async def get_dungeon_state(session_id: str):
    """获取当前副本状态"""
    session = dungeon_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    return JSONResponse(content=session.model_dump())


@router.websocket("/ws/dungeon/dating/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket端点用于实时泡妞对话"""
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
        # 发送初始状态
        await websocket.send_json({
            "type": "round_info",
            "round": session.current_round,
            "max_rounds": session.max_rounds,
            "actions_remaining": session.max_actions_per_round - session.player_actions_this_round,
            "girlfriends": [
                {
                    "id": gf.id,
                    "name": gf.name,
                    "personality": gf.personality,
                    "affection_player": gf.affection_player,
                    "affection_rival": gf.affection_rival
                }
                for gf in session.girlfriends
            ]
        })
        
        # 主循环
        while session.status == "playing":
            # 接收客户端消息
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "content": "消息格式错误"
                })
                continue
            
            msg_type = message_data.get("type")
            
            if msg_type == "chat":
                # 玩家发送聊天消息
                target = message_data.get("target")
                content = message_data.get("content", "").strip()
                
                if not target or not content:
                    await websocket.send_json({
                        "type": "error",
                        "content": "目标或内容不能为空"
                    })
                    continue
                
                if target not in ["gf1", "gf2", "gf3"]:
                    await websocket.send_json({
                        "type": "error",
                        "content": "无效的目标"
                    })
                    continue
                
                try:
                    # 调用服务处理玩家聊天
                    result = await dungeon_service.player_chat(session_id, target, content)
                    
                    # 发送女友回复
                    await websocket.send_json({
                        "type": "gf_reply",
                        "speaker": result["gf_id"],
                        "speaker_name": result["gf_name"],
                        "content": result["content"],
                        "affection": result["affection_player"],
                        "affection_change": result["affection_change"]
                    })
                    
                    # 发送更新后的行动次数
                    session = dungeon_service.get_session(session_id)
                    await websocket.send_json({
                        "type": "action_update",
                        "actions_remaining": session.max_actions_per_round - session.player_actions_this_round,
                        "max_actions": session.max_actions_per_round
                    })
                    
                except ValueError as e:
                    await websocket.send_json({
                        "type": "error",
                        "content": str(e)
                    })
                
            elif msg_type == "end_round":
                # 玩家结束本轮
                # 先触发情敌行动
                rival_results = await dungeon_service.rival_auto_chat(session_id)
                
                # 发送情敌行动结果
                await websocket.send_json({
                    "type": "rival_action",
                    "messages": [
                        {
                            "gf_id": r["gf_id"],
                            "gf_name": r["gf_name"],
                            "rival_content": r["rival_content"],
                            "gf_response": r["gf_response"],
                            "affection_rival": r["affection_rival"],
                            "affection_change": r["affection_change"]
                        }
                        for r in rival_results
                    ]
                })
                
                # 进入下一轮
                round_info = dungeon_service.advance_round(session_id)
                session = dungeon_service.get_session(session_id)
                
                if session.status == "judging":
                    # 游戏结束，进入评判阶段
                    await websocket.send_json({
                        "type": "round_info",
                        "round": session.current_round - 1,
                        "max_rounds": session.max_rounds,
                        "status": "judging",
                        "message": "游戏结束，进入评判阶段"
                    })
                    break
                else:
                    # 发送新一轮信息
                    await websocket.send_json({
                        "type": "round_info",
                        "round": session.current_round,
                        "max_rounds": session.max_rounds,
                        "actions_remaining": session.max_actions_per_round,
                        "status": "playing",
                        "message": f"进入第{session.current_round}轮"
                    })
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "content": f"未知消息类型: {msg_type}"
                })
        
        # 评判阶段
        if session.status == "judging":
            await websocket.send_json({
                "type": "judge",
                "content": "",
                "done": False
            })
            
            judge_text = ""
            async for token in dungeon_service.judge_result(session_id):
                judge_text += token
                await websocket.send_json({
                    "type": "judge",
                    "content": token,
                    "done": False
                })
            
            # 评判结束
            await websocket.send_json({
                "type": "judge",
                "content": "",
                "done": True
            })
            
            # 刷新会话获取结果
            session = dungeon_service.get_session(session_id)
        
        # 发送最终结果
        if session.status == "finished" and session.result:
            await websocket.send_json({
                "type": "result",
                "result": session.result,  # win/lose
                "girlfriends": [
                    {
                        "id": gf.id,
                        "name": gf.name,
                        "affection_player": gf.affection_player,
                        "affection_rival": gf.affection_rival
                    }
                    for gf in session.girlfriends
                ]
            })
    
    except WebSocketDisconnect:
        print(f"客户端断开连接: {session_id}")
    except Exception as e:
        print(f"WebSocket错误: {e}")
        await websocket.send_json({
            "type": "error",
            "content": f"服务器错误: {str(e)}"
        })
    finally:
        # 清理会话
        dungeon_service.cleanup_session(session_id)
        await websocket.close()
