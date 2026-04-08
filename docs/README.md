# 华夏游录 - 中国风游历冒险游戏

> 📚 **需要详细文档？** 请查看 **[文档中心](START_HERE.md)** - 完整的游戏说明书、开发指南、测试文档

一个基于 Web 的中国风游历冒险游戏，玩家扮演明代旅行家徐霞客，游历中华大地，体验各地文化。结合传统副本与 AI 驱动的互动玩法，使用 FastAPI 后端、Phaser 前端和 Godot 横版动作引擎打造。

## 🎮 游戏特色

- **中国风游历**：扮演徐霞客，游览中华大地
  - 🏯 苏州园林 - 亭台楼阁，诗词歌赋
  - 🌸 杭州西湖 - 断桥相会，雷峰塔影
  - ⛰️ 黄山云海 - 奇松怪石，云海仙境
  - 🏛️ 长安古城 - 大唐盛世，兵马俑阵
  - 🏔️ 雪域高原 - 布达拉宫，珠穆朗玛

- **15 种多样副本**：
  - **Godot 横版动作**（4 种）:
    - 🏃 园林跑酷 - 在亭台楼阁间穿梭
    - ⚔️ 古塔战斗 - 逐层挑战守塔者
    - 🧗 登山攀岩 - 垂直攀爬险峻山峰
    - 🐉 神兽 Boss - 挑战各地传说神兽
  
  - **文化策略**（11 种）:
    - 📖 园林题诗 - 根据景色创作诗词
    - 💕 断桥邂逅 - 浪漫恋爱模拟
    - 🤖 长安诗会 - 与李白杜甫对诗
    - 🕵️ 徽州商帮 - 找出卧底
    - 🃏 大唐牌坊 - 扑克牌比大小
    - 更多...

- **AI 驱动**：集成通义千问大模型，李白与你诗词对决，白娘子与你浪漫互动
- **双引擎架构**：Phaser（策略回合）+ Godot（横版动作），无缝切换
- **存档系统**：完整的游戏进度保存和读取功能
- **精美 UI**：中国风水墨画风，传统音乐配乐

## 🏗️ 技术架构

### 后端技术栈
- **框架**: FastAPI
- **API 文档**: 自动生成 OpenAPI/Swagger 文档
- **LLM 集成**: 通义千问 (DashScope)
- **数据持久化**: SQLite + JSON 存档
- **环境配置**: python-dotenv

### 前端技术栈
- **游戏引擎**: Phaser 3.80+（策略回合制）
- **动作引擎**: Godot 4.x（横版动作关卡）
- **构建工具**: Vite 5.4+
- **开发语言**: JavaScript/TypeScript
- **分辨率**: 1280x720
- **集成方式**: iframe + postMessage 通信

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
├── frontend/               # 前端游戏（Phaser）
│   ├── src/
│   │   ├── scenes/         # 游戏场景
│   │   │   ├── ChinaMapScene.js     # 中国地图场景
│   │   │   ├── CardDungeonScene.js  # 卡牌副本场景
│   │   │   ├── GodotBridgeScene.js  # Godot 集成桥接
│   │   │   └── ...                  # 各传统副本场景
│   │   ├── components/     # UI 组件
│   │   │   ├── PlayerCharacter.js   # 玩家角色（徐霞客）
│   │   │   ├── DungeonPortal.js     # 副本传送门
│   │   │   └── ...
│   │   ├── utils/          # 工具函数
│   │   │   ├── api.js       # API 调用
│   │   │   └── godotBridge.js # Godot 通信桥接
│   │   └── main.js         # 入口文件
│   ├── public/assets/      # 静态资源（中国风）
│   ├── public/godot_client/ # Godot 导出文件
│   ├── index.html          # HTML 模板
│   ├── package.json        # Node.js 依赖
│   └── vite.config.js      # Vite 配置
├── godot_client/           # Godot 横版动作项目
│   ├── scripts/
│   │   ├── player.gd       # 玩家控制（徐霞客）
│   │   ├── enemy.gd        # 敌人 AI（侍卫、神兽）
│   │   └── levels/         # 4 个 Godot 关卡脚本
│   ├── scenes/             # Godot 场景（待创建）
│   └── exports/web/        # Web 导出文件
├── .env                    # 环境变量配置（⚠️不提交到 git）
├── .env.example            # 环境变量模板
├── README.md               # 项目文档
└── CHINA_LEVELS.md         # 中国风关卡设计文档
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

### 快速开始指南

#### 方式 1：直接运行测试（推荐新手）

**步骤 1：配置环境**
```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 编辑 .env 文件，填入你的阿里云 DashScope API Key
# 访问 https://dashscope.console.aliyun.com/ 获取
```

**步骤 2：启动后端**
```bash
cd backend
pip install -r requirements.txt
python main.py
# 后端将在 http://localhost:8001 启动
```

**步骤 3：启动前端**
```bash
# 在新终端窗口
cd frontend
npm install
npm run dev
# 前端将在 http://localhost:5173 启动
```

**步骤 4：打开浏览器**
访问 http://localhost:5173 开始游戏！

#### 方式 2：测试 Godot 横版动作关卡

**步骤 1：安装 Godot**
- 访问 https://godotengine.org/download/
- 下载 Godot 4.2+ Standard 版
- 解压运行

**步骤 2：导入 Godot 项目**
- 打开 Godot 编辑器
- 点击"导入"
- 选择 `godot_client/project.godot`
- 点击"导入并编辑"

**步骤 3：测试关卡**
- 在 Godot 编辑器中按 F5
- 选择要测试的关卡场景
- 或使用主菜单选择关卡

**步骤 4：导出 Web 版本**
```
菜单：项目 → 导出
选择：Web 预设
导出到：exports/web/index.html
```

**步骤 5：集成到 Phaser**
```bash
# 复制 Godot 导出文件
cp -r godot_client/exports/web/* frontend/public/godot_client/

# 启动前端测试
cd frontend
npm run dev
```

### 游戏流程

1. **创建角色**：扮演明代旅行家徐霞客
2. **选择起点**：从苏州园林开始游历
3. **探索地域**：左右移动探索中华大地
   - 苏州 → 杭州 → 黄山 → 长安 → 西藏
4. **挑战副本**：
   - **想玩操作** → 选择 Godot 横版动作（跑酷、战斗、Boss）
   - **想玩策略** → 选择传统回合制（诗词、卡牌、推理）
5. **体验文化**：每个地区都有独特历史文化和美食
6. **达成成就**：收集诗词、印章、各地纪念品

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

## 👥 作者团队

### 主要开发者

**Zhiyong Ma (马智勇)**  
- 📧 主要开发者 & 项目负责人
- 🌐 [知乎](https://www.zhihu.com/people/allenma-49)
- 🎓 [Google Scholar](https://scholar.google.com/citations?user=Brs63a8AAAAJ&hl=en)

### 核心贡献者

<!-- 预留位置：其他 3 位团队成员信息 -->
<!-- 
**Contributor Name 1**  
- 📧 角色/职责
- 🌐 个人链接（GitHub/知乎/网站等）

**Contributor Name 2**  
- 📧 角色/职责
- 🌐 个人链接

**Contributor Name 3**  
- 📧 角色/职责
- 🌐 个人链接
-->

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

**游戏版本**: v0.2.0（中国风游历主题）  
**最后更新**: 2026-04-07  
**开发状态**: 框架完成，等待场景实现 🚀

---

## 📚 更多文档

- **[中国风关卡设计大全](CHINA_LEVELS.md)** - 15 种关卡详细说明
- **[Godot 快速开始](godot_client/QUICKSTART.md)** - Godot 横版动作指南
- **[Godot 集成方案](godot_client/INTEGRATION.md)** - Phaser 与 Godot 通信
- **[DNF 风格架构](DNF_STYLE_DESIGN.md)** - 横版地图设计文档
