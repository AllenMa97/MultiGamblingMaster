"""谁是卧底路由 - 支持REST API和WebSocket"""
import asyncio
import json
from typing import Dict
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from backend.models.spy import SpyDungeonState
from backend.services.spy_dungeon import (
    start_dungeon, get_state, get_player_view,
    submit_player_description, generate_all_descriptions,
    submit_player_vote, generate_npc_votes, resolve_votes,
    check_game_end, next_round
)

router = APIRouter(prefix="/dungeon/spy", tags=["spy_dungeon"])

# WebSocket连接管理
_connections: Dict[str, WebSocket] = {}


@router.post("/start")
async def spy_dungeon_start(request: dict):
    """
    开始谁是卧底游戏
    
    Args:
        request: {"player_name": "玩家名字"}
        
    Returns:
        游戏状态（玩家视角）
    """
    try:
        player_name = request.get("player_name", "玩家")
        state = start_dungeon(player_name)
        return get_player_view(state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"开始游戏失败: {str(e)}")


@router.get("/state/{session_id}")
async def spy_dungeon_state(session_id: str):
    """
    获取游戏状态
    
    Args:
        session_id: 会话ID
        
    Returns:
        游戏状态（玩家视角）
    """
    state = get_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="会话不存在或已过期")
    
    return get_player_view(state)


@router.websocket("/ws/dungeon/spy/{session_id}")
async def spy_dungeon_websocket(websocket: WebSocket, session_id: str):
    """
    谁是卧底WebSocket连接
    
    流程：
    1. 连接后发送游戏信息
    2. 每轮NPC逐个发言
    3. 等待玩家描述
    4. 进入投票阶段
    5. 显示投票结果
    6. 检查游戏结束或继续下一轮
    """
    await websocket.accept()
    _connections[session_id] = websocket
    
    try:
        # 获取游戏状态
        state = get_state(session_id)
        if not state:
            await websocket.send_json({
                "type": "error",
                "message": "会话不存在"
            })
            await websocket.close()
            return
        
        # 发送游戏信息
        player = next((p for p in state.players if p.id == "player"), None)
        await websocket.send_json({
            "type": "game_info",
            "your_word": player.word if player else "",
            "your_role": "spy" if state.player_is_spy else "civilian",
            "players": [
                {"id": p.id, "name": p.name, "is_alive": p.is_alive}
                for p in state.players
            ]
        })
        
        # 游戏主循环
        while state.status != "finished":
            # 描述阶段
            state.status = "describing"
            
            # 获取所有活着的NPC（按顺序）
            alive_npcs = [p for p in state.players if p.id != "player" and p.is_alive]
            
            # 逐个发送NPC描述
            for npc in alive_npcs:
                # 生成NPC描述
                from backend.services.spy_dungeon import generate_npc_description
                description = await generate_npc_description(session_id, npc.id)
                
                await websocket.send_json({
                    "type": "description",
                    "player_id": npc.id,
                    "name": npc.name,
                    "content": description
                })
                
                # 稍微延迟，让玩家有阅读时间
                await asyncio.sleep(0.8)
            
            # 等待玩家描述
            await websocket.send_json({
                "type": "player_turn",
                "message": "请输入你的描述"
            })
            
            # 等待玩家发送描述
            player_desc_received = False
            while not player_desc_received:
                try:
                    data = await asyncio.wait_for(websocket.receive_json(), timeout=60.0)
                    
                    if data.get("type") == "player_description":
                        description = data.get("content", "").strip()
                        if description:
                            submit_player_description(session_id, description)
                            player_desc_received = True
                            
                            # 确认收到
                            await websocket.send_json({
                                "type": "description_received",
                                "content": description
                            })
                    
                except asyncio.TimeoutError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "等待超时，请重新连接"
                    })
                    return
            
            # 描述阶段结束
            await websocket.send_json({
                "type": "description_phase_end"
            })
            
            await asyncio.sleep(0.5)
            
            # 投票阶段
            state.status = "voting"
            
            # 获取活着的玩家
            alive_players = [p for p in state.players if p.is_alive]
            
            await websocket.send_json({
                "type": "vote_start",
                "alive_players": [
                    {"id": p.id, "name": p.name}
                    for p in alive_players if p.id != "player"
                ]
            })
            
            # 等待玩家投票
            player_vote_received = False
            while not player_vote_received:
                try:
                    data = await asyncio.wait_for(websocket.receive_json(), timeout=60.0)
                    
                    if data.get("type") == "player_vote":
                        target = data.get("target", "")
                        if target and submit_player_vote(session_id, target):
                            player_vote_received = True
                            
                            # 确认收到
                            await websocket.send_json({
                                "type": "vote_received",
                                "target": target
                            })
                    
                except asyncio.TimeoutError:
                    # 超时随机投票
                    valid_targets = [p.id for p in alive_players if p.id != "player"]
                    if valid_targets:
                        target = random.choice(valid_targets)
                        submit_player_vote(session_id, target)
                        await websocket.send_json({
                            "type": "vote_received",
                            "target": target,
                            "message": "超时，系统自动投票"
                        })
                    player_vote_received = True
            
            # NPC投票
            await generate_npc_votes(session_id)
            
            # 统计投票结果
            eliminated_id = resolve_votes(session_id)
            
            # 获取投票详情
            current_round = state.rounds[state.current_round - 1]
            votes_info = []
            for vote in current_round.votes:
                voter = next((p for p in state.players if p.id == vote.voter), None)
                target = next((p for p in state.players if p.id == vote.target), None)
                if voter and target:
                    votes_info.append({
                        "voter": voter.name,
                        "target": target.name
                    })
            
            eliminated_player = next((p for p in state.players if p.id == eliminated_id), None)
            
            # 发送投票结果
            await websocket.send_json({
                "type": "vote_result",
                "votes": votes_info,
                "eliminated": eliminated_id,
                "eliminated_name": eliminated_player.name if eliminated_player else "",
                "eliminated_role": "spy" if (eliminated_player and eliminated_player.is_spy) else "civilian"
            })
            
            await asyncio.sleep(1.5)
            
            # 检查游戏是否结束
            result = check_game_end(session_id)
            
            if result:
                # 游戏结束
                await websocket.send_json({
                    "type": "game_end",
                    "result": result,  # "win" 或 "lose"
                    "message": "恭喜你获胜！" if result == "win" else "很遗憾，你输了。"
                })
                break
            else:
                # 继续下一轮
                next_round(session_id)
                await websocket.send_json({
                    "type": "next_round",
                    "round": state.current_round
                })
                await asyncio.sleep(1)
        
        # 保持连接，等待玩家关闭
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data == "close":
                    break
            except asyncio.TimeoutError:
                continue
            except WebSocketDisconnect:
                break
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket错误: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
    finally:
        if session_id in _connections:
            del _connections[session_id]
        try:
            await websocket.close()
        except:
            pass


# 导入random用于超时随机投票
import random
