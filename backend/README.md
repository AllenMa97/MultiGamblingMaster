# Backend - 后端服务

基于 FastAPI 的游戏后端服务，提供 RESTful API 和 AI 集成功能。

## 📁 目录结构

```
backend/
├── routers/          # API 路由层
├── models/           # 数据模型层
├── services/         # 业务逻辑层
├── data/             # 数据文件
│   ├── maps/         # 地图配置文件
│   ├── saves/        # 游戏存档
│   └── game.db       # SQLite 数据库
├── config.py         # 配置管理
├── main.py           # 应用入口
└── requirements.txt  # Python 依赖
```

## 🏗️ 架构分层

### 1. Routers (路由层)
负责接收 HTTP 请求，参数验证和响应返回。

**主要路由文件：**
- `map_router.py` - 地图管理接口
- `card_router.py` - 卡牌副本接口
- `action_router.py` - 行动副本接口
- `ai_router.py` - AI 互动接口
- `game_router.py` - 游戏存档接口
- `spy_router.py` - 间谍副本接口
- `dating_router.py` - 约会副本接口
- `poetry_router.py` - 诗歌副本接口
- `reverse_router.py` - 反转副本接口
- `absurd_router.py` - 荒诞副本接口
- `interrogate_router.py` - 审问副本接口

### 2. Models (模型层)
定义数据结构和验证逻辑（基于 Pydantic）。

**主要模型：**
- `game_state.py` - 游戏状态和存档模型
- `player.py` - 玩家信息模型
- `card.py` - 卡牌数据模型
- `action.py` - 行动数据模型
- `ai_dungeon.py` - AI 副本相关模型
- `dating.py` - 约会副本相关模型
- `spy.py` - 间谍副本相关模型
- `poetry.py` - 诗歌副本相关模型
- `reverse.py` - 反转副本相关模型
- `absurd.py` - 荒诞副本相关模型
- `interrogate.py` - 审问副本相关模型

### 3. Services (服务层)
实现核心业务逻辑。

**主要服务：**
- `database.py` - 数据库操作
- `llm_client.py` - LLM API 客户端
- `dice_service.py` - 骰子逻辑
- `map_service.py` - 地图管理
- `*_dungeon.py` - 各副本的业务逻辑

## 🚀 快速开始

### 安装依赖

```bash
pip install -r requirements.txt
```

### 配置环境变量

在项目根目录创建 `.env` 文件：

```env
DASHSCOPE_API_KEYS=your_api_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL_FAST=qwen-flash
LLM_MODEL_PLUS=qwen-plus
```

### 启动服务

```bash
python main.py
```

服务将在 `http://localhost:8001` 启动

## 📖 API 文档

启动服务后访问：
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## 🔧 开发指南

### 添加新的副本类型

1. **创建模型** (`models/your_dungeon.py`):
```python
from pydantic import BaseModel

class YourDungeonRequest(BaseModel):
    # 定义请求数据结构
    pass

class YourDungeonResponse(BaseModel):
    # 定义响应数据结构
    pass
```

2. **实现服务** (`services/your_dungeon.py`):
```python
class YourDungeonService:
    def process(self, request: YourDungeonRequest):
        # 实现业务逻辑
        pass
```

3. **创建路由** (`routers/your_router.py`):
```python
from fastapi import APIRouter

router = APIRouter()

@router.post("/your-endpoint")
async def your_endpoint(request: YourDungeonRequest):
    # 处理请求
    pass
```

4. **注册路由** (`main.py`):
```python
from backend.routers.your_router import router as your_router
app.include_router(your_router, prefix="/api")
```

### 数据库操作

使用 SQLite 存储游戏数据，通过 `services/database.py` 统一管理。

### LLM 集成

通过 `services/llm_client.py` 调用 DashScope API，支持多个 API Key 轮询。

## 📦 依赖说明

- **fastapi** (0.115.0) - Web 框架
- **uvicorn** (0.30.0) - ASGI 服务器
- **python-dotenv** (1.0.1) - 环境变量管理
- **pydantic** (2.9.0) - 数据验证
- **openai** (1.50.0) - AI 客户端（兼容 DashScope）

## 🎯 核心功能

### 1. 地图系统
- 多地图配置支持
- 格子事件触发
- 路径规划

### 2. 副本系统
- 9 种不同主题副本
- 独立的副本逻辑
- AI 驱动的剧情生成

### 3. 存档系统
- JSON 格式存档
- UUID 唯一标识
- 完整的状态保存

### 4. AI 集成
- 通义千问大模型
- 多模型支持（fast/plus）
- 智能 NPC 对话

## 🐛 调试技巧

### 启用调试模式

```python
# main.py
uvicorn.run(app, host="0.0.0.0", port=8001, log_level="debug")
```

### 查看日志

Uvicorn 默认输出访问日志和错误日志。

### 数据库检查

游戏存档位于 `backend/data/saves/`，可直接查看 JSON 文件。

## 📝 代码规范

- 使用类型注解
- 遵循 PEP 8 规范
- 函数添加文档字符串
- 模型添加 Field 描述

## 🔐 安全提示

- 不要将 `.env` 文件提交到 git
- 定期轮换 API Key
- 验证所有用户输入
- 使用 CORS 限制来源

---

**版本**: v0.1.0  
**维护者**: MultiGamblingMaster Team
