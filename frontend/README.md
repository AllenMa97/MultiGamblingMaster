# Frontend - 前端游戏

基于 Phaser 3 的 HTML5 游戏前端，提供流畅的 2D 游戏体验。

## 📁 目录结构

```
frontend/
├── src/
│   ├── scenes/         # 游戏场景
│   ├── components/     # UI 组件
│   ├── utils/          # 工具函数
│   └── main.js         # 入口文件
├── public/assets/      # 静态资源
├── index.html          # HTML 模板
├── package.json        # 依赖配置
└── vite.config.js      # 构建配置
```

## 🏗️ 架构设计

### 场景系统 (Scenes)

Phaser 场景是游戏的核心组成部分。

**主要场景：**

| 场景 | 文件 | 功能描述 |
|------|------|----------|
| 启动场景 | `BootScene.js` | 资源加载和初始化 |
| 主菜单 | `MainMenuScene.js` | 游戏主菜单界面 |
| 地图场景 | `MapScene.js` | 棋盘地图探索 |
| 卡牌副本 | `CardDungeonScene.js` | 卡牌对战副本 |
| 行动副本 | `ActionDungeonScene.js` | 动作挑战副本 |
| AI 副本 | `AIDungeonScene.js` | AI 互动剧情 |
| 间谍副本 | `SpyDungeonScene.js` | 推理策略副本 |
| 约会副本 | `DatingDungeonScene.js` | 恋爱模拟副本 |
| 诗歌副本 | `PoetryDungeonScene.js` | 文学创作副本 |
| 反转副本 | `ReverseDungeonScene.js` | 逆向思维副本 |
| 荒诞副本 | `AbsurdDungeonScene.js` | 脑洞大开副本 |
| 审问副本 | `InterrogateDungeonScene.js` | 心理博弈副本 |

### 组件系统 (Components)

可复用的 UI 组件。

**主要组件：**
- `ChatPanel.js` - 聊天对话面板
- `CardHand.js` - 手牌管理组件
- `Dice.js` - 骰子动画组件

### 工具模块 (Utils)

- `api.js` - API 调用封装
- `gameState.js` - 游戏状态管理

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

开发服务器将在 `http://localhost:5173` 启动

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录

## 🎮 场景开发指南

### 创建新场景

1. **创建场景文件** (`src/scenes/YourScene.js`):

```javascript
import Phaser from 'phaser';

export default class YourScene extends Phaser.Scene {
  constructor() {
    super({ key: 'YourScene' });
  }

  preload() {
    // 加载资源
  }

  create() {
    // 初始化场景
  }

  update() {
    // 每帧更新逻辑
  }
}
```

2. **注册场景** (`src/main.js`):

```javascript
import YourScene from './scenes/YourScene.js';

const config = {
  // ...
  scene: [BootScene, MainMenuScene, YourScene], // 添加新场景
};
```

### 场景跳转

```javascript
// 跳转到其他场景
this.scene.start('MapScene', { mapId: 'map_01' });

// 返回上一场景
this.scene.stop();
```

### 场景间通信

```javascript
// 传递数据
this.scene.launch('YourScene', { data: 'value' });

// 接收数据（在目标场景中）
create(data) {
  console.log(data);
}
```

## 🎨 资源管理

### 资源加载

在 `BootScene.js` 中预加载所有资源：

```javascript
preload() {
  // 加载图片
  this.load.image('player', 'assets/player.png');
  
  // 加载精灵图
  this.load.spritesheet('dice', 'assets/dice.png', {
    frameWidth: 64,
    frameHeight: 64
  });
  
  // 加载音频
  this.load.audio('bgm', 'assets/bgm.mp3');
}
```

### 资源使用

```javascript
create() {
  // 创建精灵
  this.add.image(400, 300, 'player');
  
  // 创建动画
  this.anims.create({
    key: 'dice-roll',
    frames: this.anims.generateFrameNumbers('dice'),
    frameRate: 10
  });
}
```

## 🔌 API 集成

### 调用后端 API

使用 `src/utils/api.js` 封装的方法：

```javascript
import api from '../utils/api.js';

// 获取地图信息
const mapData = await api.getMap('map_01');

// 保存游戏
const saveResult = await api.saveGame({
  player_name: '玩家',
  map_id: 'map_01'
});
```

### 错误处理

```javascript
try {
  const result = await api.someAction();
} catch (error) {
  console.error('API 调用失败:', error);
  // 显示错误提示
}
```

## 🎯 核心功能实现

### 1. 棋盘移动系统

```javascript
// MapScene.js
rollDice() {
  const diceValue = Math.floor(Math.random() * 6) + 1;
  this.movePlayer(diceValue);
}

movePlayer(steps) {
  // 移动玩家精灵
  // 触发格子事件
}
```

### 2. 副本挑战系统

```javascript
// 进入副本
this.scene.start('CardDungeonScene', {
  mapId: this.mapId,
  nodeId: this.currentNode
});

// 返回地图（必须传递 mapId）
this.scene.stop('CardDungeonScene');
this.scene.resume('MapScene', { mapId: this.mapId });
```

### 3. DOM 交互

```javascript
// 创建 HTML 输入框
const input = document.createElement('input');
input.type = 'text';
input.style.zIndex = '1000'; // 确保在 canvas 上层
document.getElementById('game-container').appendChild(input);
```

### 4. 游戏状态管理

```javascript
// gameState.js
export const gameState = {
  playerId: null,
  mapId: null,
  currentPosition: 0,
  saveId: null,
  
  init() {
    // 初始化状态
  },
  
  reset() {
    // 重置状态
  }
};
```

## 🐛 常见问题

### DOM 元素被 canvas 遮挡

**问题**: 输入框等 DOM 元素显示不出来

**解决**: 设置 z-index

```javascript
element.style.zIndex = '1000';
element.style.position = 'absolute';
```

### 场景参数传递丢失

**问题**: 从副本返回地图时参数丢失

**解决**: 必须传递 mapId

```javascript
// ✅ 正确
this.scene.resume('MapScene', { mapId: this.mapId });

// ❌ 错误
this.scene.resume('MapScene');
```

### 资源加载失败

**解决**: 
1. 检查路径是否正确
2. 确保在 `preload()` 中加载
3. 使用 `this.load.on('filecomplete')` 监听加载完成

## 📦 构建配置

### Vite 配置

```javascript
// vite.config.js
export default {
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}
```

### 生产环境部署

构建后的 `dist/` 目录可直接部署到静态服务器：

```bash
# 使用 Nginx
server {
  listen 80;
  server_name your-domain.com;
  root /path/to/dist;
  index index.html;
}
```

## 🎨 性能优化

### 1. 资源优化
- 使用纹理图集（Texture Atlas）
- 压缩图片资源
- 按需加载资源

### 2. 渲染优化
- 使用对象池管理游戏对象
- 避免频繁创建/销毁对象
- 合理使用 Layer

### 3. 代码优化
- 减少 update() 中的计算
- 使用事件监听替代轮询
- 合理设置帧率

## 🔧 开发工具

### Phaser 调试工具

```javascript
// 启用调试模式
this.physics.world.debug = true;
```

### 浏览器 DevTools

- 使用 Performance 面板分析性能
- 使用 Console 查看日志
- 使用 Network 监控 API 请求

## 📝 代码规范

- 使用 ES6+ 语法
- 类名使用 PascalCase
- 函数名使用 camelCase
- 添加必要的注释
- 保持代码格式统一

## 🔐 安全提示

- 不要在前端硬编码 API Key
- 验证所有后端返回的数据
- 使用 CORS 限制请求来源
- 敏感逻辑放在后端

## 👥 作者

**Zhiyong Ma (马智勇)** - 主要开发者 & 前端架构  
<!-- 预留位置：其他团队成员 -->

---

**版本**: v0.1.0  
**维护者**: MultiGamblingMaster Team
