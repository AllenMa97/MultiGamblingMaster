# 🎮 华夏游录 - 完整文档中心

**欢迎来到《华夏游录》项目文档中心**

---

## 🚀 快速开始

### 第一次来这里？
1. **新手玩家** → 先看 [游戏说明书](#游戏说明书)
2. **开发人员** → 直接看 [开发指南](#开发指南)
3. **测试人员** → 查看 [测试指南](#测试指南)
4. **美术设计** → 参考 [美术资源](#美术资源)

---

## 📖 文档导航

### 🎯 游戏说明书（面向玩家）

#### 📚 88 页终极完全攻略本
**最详细的游戏攻略，2000 年代游戏杂志风格**

- 📄 [打开攻略本](GAME_ULTIMATE_GUIDE.md) - 88 页超详细攻略（推荐收藏）
  - 世界观完全解析
  - 玩法深度解析
  - 关卡完全攻略
  - 城市详细解析
  - 高级技巧篇
  - 设定资料篇

#### 📘 完全游戏指南
**官方游戏说明书，快速上手**

- 📄 [阅读指南](GAME_COMPREHENSIVE_GUIDE.md) - 完整官方说明书
  - 背景故事
  - 核心玩法
  - 游戏系统
  - 关卡设计
  - 技术架构

#### 📋 攻略本结构
**了解 88 页攻略本是如何组织的**

- 📄 [查看结构](GAME_88PAGES_STRUCTURE.md) - 详细页码安排
- 📄 [图片清单](GAME_IMAGE_LIST.md) - 256 张图片说明

---

### 🛠️ 开发指南（面向开发者）

#### 快速启动
1. **环境准备**
   - Godot 4.6.2（已内置在项目根目录）
   - Python 3.x（后端）
   - FastAPI（后端框架）

2. **启动游戏**
   ```bash
   # 方式 1：双击 Godot 引擎
   双击项目根目录的 Godot_v4.6.2-stable_win64.exe
   
   # 方式 2：使用启动脚本
   双击 godot_client/start_godot.ps1
   ```

3. **启动后端**
   ```bash
   # 进入后端目录
   cd backend
   
   # 安装依赖
   pip install -r requirements.txt
   
   # 启动服务
   python main.py
   ```

#### 技术文档
- 📄 [中国地图技术实现](技术文档/CHINA_MAP_IMPLEMENTATION.md)
  - GeoJSON 数据来源
  - 坐标转换算法
  - 高清渲染技术

- 📄 [Godot 脚本开发指南](技术文档/GODOT_SCRIPTS_GUIDE.md)
  - 脚本结构说明
  - API 使用方法
  - 最佳实践

- 📄 [Godot 项目启动](技术文档/GODOT_START.md)
  - 环境配置
  - 启动步骤
  - 常见问题

#### 后端开发
- 📄 [后端 README](../backend/README.md)
  - API 接口文档
  - 数据模型说明
  - 服务层架构

#### 前端开发
- 📄 [Godot 客户端 README](../godot_client/README.md)
  - 场景结构
  - 脚本说明
  - 资源管理

---

### 🧪 测试指南（面向测试人员）

#### 快速测试
- 📄 [快速测试指南](测试文档/QUICK_TEST_GUIDE.md) - 简化版测试步骤
- 📄 [完整测试文档](测试文档/QUICK_TEST.md) - 详细测试流程

#### 专项测试
- 📄 [中国地图测试](测试文档/README_CHINA_MAP.md)
  - 地图准确性验证
  - 省界划分测试
  - 城市位置验证

---

### 🎨 设计文档（面向策划和美术）

#### 关卡设计
- 📄 [中国风关卡设计](设计文档/CHINA_LEVELS.md)
  - 15 种地域特色关卡
  - 华北、华东、华南、西南、西北等地区

- 📄 [关卡扩展设计](设计文档/EXTENDED_LEVELS_DESIGN.md)
  - 65 城 195 关完整设计
  - 难度分布（五星级正态分布）
  - 文化元素融合

- 📄 [关卡总览](设计文档/LEVELS_OVERVIEW.md)
  - 关卡统计信息
  - 类型分布

- 📄 [关卡完成统计](设计文档/LEVELS_COMPLETE_STATS.md)
  - 各区域完成情况
  - 难度分布验证

#### 美术设计
- 📄 [美术设计指南](设计文档/ART_DESIGN_SIMPLE.md)
  - 中国风美术风格
  - 角色设计
  - 场景设计

#### 开发计划
- 📄 [下一步计划](设计文档/NEXT_STEPS.md)
  - 待完成功能
  - 优化建议
  - 未来规划

---

## 📂 完整文档结构

```
docs/
├── 📄 START_HERE.md              ← 你在这里
├── 📄 INDEX.md                   ← 完整索引
├── 📄 CLEANUP_SUMMARY.md         ← 整理记录
│
├── 📖 游戏说明书/
│   ├── GAME_ULTIMATE_GUIDE.md    # 88 页终极攻略
│   ├── GAME_COMPREHENSIVE_GUIDE.md
│   ├── GAME_88PAGES_STRUCTURE.md
│   └── GAME_IMAGE_LIST.md
│
├── 🛠️ 技术文档/
│   ├── CHINA_MAP_IMPLEMENTATION.md
│   ├── GODOT_SCRIPTS_GUIDE.md
│   └── GODOT_START.md
│
├── 🧪 测试文档/
│   ├── README_CHINA_MAP.md
│   ├── QUICK_TEST.md
│   └── QUICK_TEST_GUIDE.md
│
└── 🎨 设计文档/
    ├── CHINA_LEVELS.md
    ├── EXTENDED_LEVELS_DESIGN.md
    ├── LEVELS_OVERVIEW.md
    ├── LEVELS_COMPLETE_STATS.md
    ├── NEXT_STEPS.md
    └── ART_DESIGN_SIMPLE.md
```

---

## 🎯 按身份查看文档

### 我是玩家
1. 📖 [88 页终极攻略](GAME_ULTIMATE_GUIDE.md) - 完全制霸指南
2. 📘 [完全游戏指南](GAME_COMPREHENSIVE_GUIDE.md) - 快速上手
3. 📋 [攻略本结构](GAME_88PAGES_STRUCTURE.md) - 了解内容安排

### 我是开发者
1. 🛠️ [Godot 脚本指南](技术文档/GODOT_SCRIPTS_GUIDE.md)
2. 🛠️ [中国地图实现](技术文档/CHINA_MAP_IMPLEMENTATION.md)
3. 📄 [后端 README](../backend/README.md)
4. 📄 [前端 README](../godot_client/README.md)

### 我是测试人员
1. 🧪 [快速测试指南](测试文档/QUICK_TEST_GUIDE.md)
2. 🧪 [完整测试文档](测试文档/QUICK_TEST.md)
3. 🧪 [中国地图测试](测试文档/README_CHINA_MAP.md)

### 我是策划/美术
1. 🎨 [关卡设计](设计文档/CHINA_LEVELS.md)
2. 🎨 [关卡扩展](设计文档/EXTENDED_LEVELS_DESIGN.md)
3. 🎨 [美术设计](设计文档/ART_DESIGN_SIMPLE.md)

---

## 📊 项目概览

### 游戏信息
- **游戏名称：** 华夏游录
- **游戏类型：** 中国风地图游历 + 横版动作冒险
- **游戏平台：** PC (Windows)
- **开发引擎：** Godot 4.6.2
- **后端框架：** FastAPI (Python)

### 游戏规模
- **城市数量：** 65 座
- **关卡数量：** 195 个
- **难度星级：** 五星级（正态分布）
- **省级行政区：** 33 个

### 特色系统
- ✅ 真实中国地图（GeoJSON 数据）
- ✅ 省界清晰标注
- ✅ 掷骰子移动机制
- ✅ 三种关卡类型（极速跑酷、城堡战斗、平台跳跃）
- ✅ 难度正态分布体系

---

## 🔗 相关链接

### 项目仓库
- GitHub 仓库：（待添加）

### 外部资源
- Godot 引擎：https://godotengine.org/
- FastAPI 文档：https://fastapi.tiangolo.com/
- GeoJSON 数据：https://geo.datav.aliyun.com/

---

## 📞 需要帮助？

### 常见问题
- Q: 如何启动游戏？
  - A: 双击项目根目录的 `Godot_v4.6.2-stable_win64.exe`

- Q: 后端如何启动？
  - A: 进入 `backend` 目录，运行 `python main.py`

- Q: 文档太多不知道看哪个？
  - A: 玩家看 [游戏说明书](#游戏说明书)，开发者看 [开发指南](#开发指南)

### 联系方式
- 项目团队：MultiGamblingMaster Team
- 文档更新：2026 年 4 月 8 日

---

## 🎮 开始你的华夏游历之旅吧！

**踏遍 65 座城市，完成 195 个关卡挑战，揭开山海经的终极秘密！**

---

*最后更新：2026 年 4 月 8 日*  
*维护：MultiGamblingMaster Team*
