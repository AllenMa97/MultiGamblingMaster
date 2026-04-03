"""AI审讯室关卡路由"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import json
import asyncio

from backend.models.interrogate import InterrogateDungeonState
from backend.services.interrogate_dungeon import (
    start_dungeon,
    generate_opponent_story,
    submit_player_story,
    generate_detective_question,
    submit_answer_and_analyze,
    generate_final_verdict,
    get_session,
)

router = APIRouter(prefix="/api/dungeon/interrogate", tags=["interrogate_dungeon"])


class SubmitStoryRequest(BaseModel):
    session_id: str
    story: str


@router.post("/start")
async def start_interrogate_dungeon():
    """开始AI审讯室关卡，返回 session_id 和场景"""
    state = await start_dungeon()
    return {
        "session_id": state.session_id,
        "scenario": state.scenario
    }


@router.post("/submit_story")
async def submit_story(request: SubmitStoryRequest):
    """提交玩家故事（REST 备用接口）"""
    await submit_player_story(request.session_id, request.story)
    return {"status": "success"}


@router.websocket("/ws/dungeon/interrogate/{session_id}")
async def interrogate_websocket(websocket: WebSocket, session_id: str):
    """WebSocket 连接处理 - 审讯流程"""
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
            "scenario": state.scenario,
            "max_questions": state.max_questions
        })
        
        # 1. AI对手先编故事（流式）
        story_buffer = ""
        async for token in generate_opponent_story(session_id):
            story_buffer += token
            await websocket.send_json({
                "type": "opponent_story",
                "content": token,
                "done": False
            })
        
        await websocket.send_json({
            "type": "opponent_story",
            "content": "",
            "done": True,
            "full_content": story_buffer
        })
        
        # 2. 等待玩家写故事
        try:
            message = await asyncio.wait_for(websocket.receive_text(), timeout=300.0)
            data = json.loads(message)
            
            if data.get("type") == "player_story":
                player_story = data.get("content", "")
                await submit_player_story(session_id, player_story)
            else:
                await websocket.send_json({
                    "type": "error",
                    "content": "Invalid message type, expected 'player_story'"
                })
                await websocket.close()
                return
                
        except asyncio.TimeoutError:
            await websocket.send_json({
                "type": "error",
                "content": "Timeout waiting for player story"
            })
            await websocket.close()
            return
        except json.JSONDecodeError:
            await websocket.send_json({
                "type": "error",
                "content": "Invalid JSON format"
            })
            await websocket.close()
            return
        
        # 3. 开始审讯循环
        state = get_session(session_id)
        while state and state.status != "finished":
            # 生成问题（流式）
            question_buffer = ""
            async for token in generate_detective_question(state):
                question_buffer += token
                await websocket.send_json({
                    "type": "detective_question",
                    "content": token,
                    "done": False,
                    "question_num": state.current_question + 1,
                    "target": "player" if state.current_question % 2 == 0 else "opponent"
                })
            
            await websocket.send_json({
                "type": "detective_question",
                "content": "",
                "done": True,
                "full_content": question_buffer,
                "question_num": state.current_question + 1,
                "target": "player" if state.current_question % 2 == 0 else "opponent"
            })
            
            # 如果是问对手，自动生成回答
            if state.current_question % 2 == 1:  # 对手回合
                # 这里简化处理，让前端知道该谁回答
                await websocket.send_json({
                    "type": "waiting_opponent",
                    "message": "等待嫌疑人B回答..."
                })
                
                # 模拟对手回答（实际应该在service层实现）
                # 这里发送一个信号让前端知道对手在回答
                await asyncio.sleep(1)
                
                # 生成对手回答和分析
                opponent_answer = "我坚持我的说法，我记得很清楚。"
                analysis_buffer = ""
                async for token in submit_answer_and_analyze(session_id, opponent_answer):
                    analysis_buffer += token
                    await websocket.send_json({
                        "type": "detective_analysis",
                        "content": token,
                        "done": False,
                        "speaker": "opponent"
                    })
                
                await websocket.send_json({
                    "type": "detective_analysis",
                    "content": "",
                    "done": True,
                    "full_content": analysis_buffer,
                    "speaker": "opponent",
                    "answer": opponent_answer
                })
            else:  # 玩家回合
                # 等待玩家回答
                try:
                    message = await asyncio.wait_for(websocket.receive_text(), timeout=300.0)
                    data = json.loads(message)
                    
                    if data.get("type") == "player_answer":
                        player_answer = data.get("content", "")
                        
                        # 提交回答并获取分析
                        analysis_buffer = ""
                        async for token in submit_answer_and_analyze(session_id, player_answer):
                            analysis_buffer += token
                            await websocket.send_json({
                                "type": "detective_analysis",
                                "content": token,
                                "done": False,
                                "speaker": "player"
                            })
                        
                        await websocket.send_json({
                            "type": "detective_analysis",
                            "content": "",
                            "done": True,
                            "full_content": analysis_buffer,
                            "speaker": "player"
                        })
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "content": "Invalid message type, expected 'player_answer'"
                        })
                        
                except asyncio.TimeoutError:
                    await websocket.send_json({
                        "type": "error",
                        "content": "Timeout waiting for player answer"
                    })
                    break
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "content": "Invalid JSON format"
                    })
                    continue
            
            # 更新状态
            state = get_session(session_id)
            
            # 发送当前漏洞统计
            if state:
                await websocket.send_json({
                    "type": "hole_count",
                    "player_holes": state.player_holes,
                    "opponent_holes": state.opponent_holes,
                    "current_question": state.current_question
                })
        
        # 4. 最终判决
        state = get_session(session_id)
        if state and state.status == "verdict":
            verdict_buffer = ""
            async for token in generate_final_verdict(session_id):
                verdict_buffer += token
                await websocket.send_json({
                    "type": "final_verdict",
                    "content": token,
                    "done": False
                })
            
            await websocket.send_json({
                "type": "final_verdict",
                "content": "",
                "done": True,
                "full_content": verdict_buffer
            })
        
        # 发送最终结果
        state = get_session(session_id)
        if state and state.result:
            await websocket.send_json({
                "type": "result",
                "result": state.result,
                "player_holes": state.player_holes,
                "opponent_holes": state.opponent_holes,
                "message": "恭喜你通过了审讯！" if state.result == "win" else "很遗憾，你的故事漏洞太多了。"
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
