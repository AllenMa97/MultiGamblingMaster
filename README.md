# MultiGamblingMaster - 多副本棋盘冒险游戏

一个基于 Web 的多副本棋盘冒险游戏，结合了传统桌游与 AI 驱动的互动玩法。使用 FastAPI 后端和 Phaser 前端框架打造。

## 🎮 游戏特色

- **多副本冒险**：提供多种不同主题的副本挑战
  - 🃏 卡牌副本 - 策略卡牌对决
  - ⚔️ 行动副本 - 动作冒险挑战
  - 🤖 AI 副本 - AI 驱动的互动剧情
  - 🕵️ 间谍副本 - 推理与策略
  - 💕 约会副本 - 模拟恋爱互动
  - 📖 诗歌副本 - 文学创作挑战
  - 🔀 反转副本 - 逆向思维挑战
  - 🎭 荒诞副本 - 脑洞大开的冒险
  - 🗣️ 审问副本 - 心理博弈对决

- **AI 驱动**：集成通义千问大模型，提供智能 NPC 互动和动态剧情生成
- **棋盘探索**：经典掷骰子走格子的桌游玩法
- **存档系统**：完整的游戏进度保存和读取功能
- **精美 UI**：基于 Phaser 的流畅 2D 游戏界面

## 🏗️ 技术架构

### 后端技术栈
- **框架**: FastAPI
- **API 文档**: 自动生成 OpenAPI/Swagger 文档
- **LLM 集成**: 通义千问 (DashScope)
- **数据持久化**: SQLite + JSON 存档
- **环境配置**: python-dotenv

### 前端技术栈
- **游戏引擎**: Phaser 3.80+
- **构建工具**: Vite 5.4+
- **开发语言**: JavaScript (ES6+)
- **分辨率**: 1280x720

## 📁 项目结构

```
MultiGamblingMaster/
├── backend/                 # 后端服务
│   ├── routers/            # API 路由
│   │   ├── map_router.py   # 地图相关接口
│   │   ├── card_router.py  # 卡牌副本接口
│   │   ├── action_router.py # 行动副本接口
│   │   ├── ai_router.py    # AI 互动接口
│   │   ├── game_router.py  # 游戏管理接口
│   │   ├── spy_router.py   # 间谍副本接口
│   │   ├── dating_router.py # 约会副本接口
│   │   ├── poetry_router.py # 诗歌副本接口
│   │   ├── reverse_router.py # 反转副本接口
│   │   ├── absurd_router.py # 荒诞副本接口
│   │   └── interrogate_router.py # 审问副本接口
│   ├── models/             # 数据模型
│   │   ├── game_state.py   # 游戏状态模型
│   │   ├── player.py       # 玩家模型
│   │   ├── card.py         # 卡牌模型
│   │   └── ...
│   ├── services/           # 业务逻辑层
│   │   ├── database.py     # 数据库服务
│   │   ├── llm_client.py   # LLM 客户端
│   │   ├── dice_service.py # 骰子服务
│   │   ├── map_service.py  # 地图服务
│   │   └── *_dungeon.py    # 各副本逻辑
│   ├── data/               # 数据文件
│   │   ├── maps/           # 地图配置
│   │   ├── saves/          # 游戏存档
│   │   └── game.db         # SQLite 数据库
│   ├── config.py           # 配置管理
│   ├── main.py             # 应用入口
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端游戏
│   ├── src/
│   │   ├── scenes/         # 游戏场景
│   │   │   ├── MapScene.js          # 地图场景
│   │   │   ├── CardDungeonScene.js  # 卡牌副本场景
│   │   │   ├── ActionDungeonScene.js # 行动副本场景
│   │   │   ├── AIDungeonScene.js    # AI 副本场景
│   │   │   ├── SpyDungeonScene.js   # 间谍副本场景
│   │   │   ├── DatingDungeonScene.js # 约会副本场景
│   │   │   └── ...
│   │   ├── components/     # UI 组件
│   │   │   ├── ChatPanel.js # 聊天面板
│   │   │   ├── CardHand.js  # 卡牌手牌
│   │   │   └── Dice.js      # 骰子组件
│   │   ├── utils/          # 工具函数
│   │   │   ├── api.js       # API 调用
│   │   │   └── gameState.js # 状态管理
│   │   └── main.js         # 入口文件
│   ├── public/assets/      # 静态资源
│   ├── index.html          # HTML 模板
│   ├── package.json        # Node.js 依赖
│   └── vite.config.js      # Vite 配置
├── .env                    # 环境变量配置（⚠️不提交到 git）
├── .env.example            # 环境变量模板
└── README.md               # 项目文档
```

## 🚀 快速开始

### 环境要求

- **Python**: 3.8+
- **Node.js**: 16+
- **npm**: 8+

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/MultiGamblingMaster.git
cd MultiGamblingMaster
```

#### 2. 配置环境变量

**⚠️ 重要：请勿将 `.env` 文件提交到版本控制系统！**

项目已提供 `.env.example` 模板文件，复制并重命名为 `.env`：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，配置你的 API 密钥：

```env
# DashScope API Keys (逗号分隔多个 key)
DASHSCOPE_API_KEYS=your_api_key_here

# DashScope Base URL
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# LLM Models
LLM_MODEL_FAST=qwen-flash
LLM_MODEL_PLUS=qwen-plus
```

**获取 API Key：**
1. 访问 [阿里云 DashScope](https://dashscope.console.aliyun.com/)
2. 注册/登录账号
3. 在控制台获取 API Key

#### 3. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 4. 安装前端依赖

```bash
cd frontend
npm install
```

### 运行项目

#### 启动后端服务

```bash
# 在项目根目录
cd backend
python main.py
```

后端服务将在 `http://localhost:8001` 启动

#### 启动前端开发服务器

```bash
# 在新终端窗口
cd frontend
npm run dev
```

前端开发服务器将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
cd frontend
npm run build
```

构建产物将输出到 `frontend/dist` 目录

## 📖 API 文档

启动后端服务后，访问以下地址查看自动生成的 API 文档：

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### 主要 API 端点

| 端点 | 描述 |
|------|------|
| `GET /api/health` | 健康检查 |
| `POST /api/maps` | 获取地图信息 |
| `POST /api/card/` | 卡牌副本操作 |
| `POST /api/action/` | 行动副本操作 |
| `POST /api/ai/` | AI 互动接口 |
| `POST /api/game/save` | 保存游戏进度 |
| `POST /api/game/load` | 加载游戏进度 |

## 🎲 游戏玩法

1. **创建角色**：输入玩家名称开始游戏
2. **探索地图**：掷骰子在棋盘上移动
3. **挑战副本**：停留不同格子触发对应副本挑战
4. **使用策略**：根据副本类型运用不同策略
5. **达成目标**：完成副本挑战，收集胜利点数

## 🔧 开发指南

### 添加新副本

1. 在 `backend/models/` 创建新的数据模型
2. 在 `backend/services/` 实现副本逻辑
3. 在 `backend/routers/` 创建 API 路由
4. 在 `frontend/src/scenes/` 创建游戏场景
5. 在 `backend/main.py` 注册路由
6. 在 `frontend/src/main.js` 注册场景

### 修改地图配置

地图配置文件位于 `backend/data/maps/`，格式如下：

```json
{
  "map_id": "map_01",
  "name": "初始之地",
  "nodes": [
    {
      "id": 1,
      "type": "card",
      "difficulty": "easy"
    }
  ]
}
```

## 🔒 安全提示

- **`.env` 文件**：包含敏感的 API 密钥，已添加到 `.gitignore`，**切勿提交到公开仓库**
- **API Key 管理**：请妥善保管你的 API Key，不要分享或泄露给他人
- **密钥轮换**：如怀疑 API Key 泄露，请及时在 DashScope 控制台重新生成

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证

## 🙏 致谢

- **FastAPI** - 现代高性能 Web 框架
- **Phaser** - HTML5 游戏开发框架
- **通义千问** - AI 大模型支持
- **DashScope** - 阿里云灵积模型服务

## 📬 联系方式

如有问题或建议，请提交 Issue 或联系项目维护者。

---

**游戏版本**: v0.1.0  
**最后更新**: 2026-04-03  
**开发状态**: 开发中 🚧
