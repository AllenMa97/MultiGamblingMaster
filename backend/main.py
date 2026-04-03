from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect

from backend.routers.map_router import router as map_router
from backend.routers.card_router import router as card_router
from backend.routers.action_router import router as action_router
from backend.routers.ai_router import router as ai_router
from backend.routers.game_router import router as game_router
from backend.routers.spy_router import router as spy_router

app = FastAPI(title="多副本棋盘冒险", version="0.1.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok", "message": "服务运行正常"}


# 注册路由
app.include_router(map_router)
app.include_router(card_router, prefix="/api")
app.include_router(action_router, prefix="/api")
app.include_router(ai_router)
app.include_router(game_router, prefix="/api")
app.include_router(spy_router, prefix="/api")

# WebSocket 支持（预留）
# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     try:
#         while True:
#             data = await websocket.receive_text()
#             await websocket.send_text(f"收到消息: {data}")
#     except WebSocketDisconnect:
#         pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
