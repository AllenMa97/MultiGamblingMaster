# Godot 与 Phaser 集成方案

## 架构概述

本项目采用 **双引擎架构**：
- **Phaser 3**: 主菜单、地图探索、简单交互关卡（卡牌、AI 对话等）
- **Godot 4.x**: 横版动作关卡（跑酷、战斗、平台跳跃、Boss 战）

## 集成方式

### 方案 1: iframe 嵌入（推荐）

**原理**：
- Phaser 作为主应用运行
- Godot 导出为 HTML5，通过 iframe 嵌入
- 通过 `postMessage` API 进行通信

**优点**：
- 隔离性好，互不干扰
- 可以独立开发和测试
- Godot 场景按需加载

**缺点**：
- 包体积较大（Godot WebAssembly ~15-20MB）
- 需要处理两个 Canvas 的切换

#### 实现步骤

**1. Phaser 端（frontend/src/index.html）**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>MultiGamblingMaster</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #1a1a2e;
        }
        #game-container {
            position: relative;
            width: 1280px;
            height: 720px;
            margin: 0 auto;
        }
        #godot-frame {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 1280px;
            height: 720px;
            border: none;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <!-- Phaser 游戏容器 -->
    </div>
    
    <!-- Godot iframe（隐藏，按需显示） -->
    <iframe id="godot-frame" src="godot_client/exports/web/index.html"></iframe>
    
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**2. Phaser 端通信代码（frontend/src/utils/godotBridge.js）**

```javascript
class GodotBridge {
  constructor() {
    this.iframe = document.getElementById('godot-frame');
    this.pendingCallbacks = new Map();
    this.messageId = 0;
    
    // 监听 Godot 消息
    window.addEventListener('message', (event) => {
      this.handleGodotMessage(event);
    });
  }

  /**
   * 加载横版动作关卡
   */
  loadActionLevel(levelType, difficulty, saveId, nodeId, callback) {
    const messageId = this.messageId++;
    
    if (callback) {
      this.pendingCallbacks.set(messageId, callback);
    }
    
    // 显示 iframe
    this.iframe.style.display = 'block';
    
    // 发送消息给 Godot
    this.iframe.contentWindow.postMessage({
      type: 'LOAD_LEVEL',
      messageId,
      payload: {
        levelType,      // 'speed_run', 'castle_battle', 'platform_challenge', 'boss_battle'
        difficulty,     // 1, 2, 3
        saveId,         // 存档 ID
        nodeId          // 格子 ID
      }
    }, '*');
  }

  /**
   * 关闭 Godot，返回 Phaser
   */
  closeGodot() {
    this.iframe.style.display = 'none';
  }

  /**
   * 处理 Godot 消息
   */
  handleGodotMessage(event) {
    const { type, messageId, payload } = event.data;
    
    switch (type) {
      case 'LEVEL_COMPLETE':
        // 关卡完成
        if (this.pendingCallbacks.has(messageId)) {
          const callback = this.pendingCallbacks.get(messageId);
          callback(true, payload);
          this.pendingCallbacks.delete(messageId);
        }
        this.closeGodot();
        break;
        
      case 'LEVEL_FAILED':
        // 关卡失败
        if (this.pendingCallbacks.has(messageId)) {
          const callback = this.pendingCallbacks.get(messageId);
          callback(false, payload);
          this.pendingCallbacks.delete(messageId);
        }
        this.closeGodot();
        break;
        
      case 'READY':
        // Godot 已就绪
        console.log('Godot 已就绪');
        break;
    }
  }
}

// 导出单例
export const godotBridge = new GodotBridge();
```

**3. Godot 端通信代码（godot_client/scripts/js_bridge.gd）**

```gdscript
extends Node
class_name JSBridge

## JavaScript 桥接 - 与 Phaser 通信

signal level_loaded(data: Dictionary)
signal level_completed(success: bool, data: Dictionary)

func _ready() -> void:
	# 监听 JavaScript 消息
	if JavaScriptBridge.is_available():
		JavaScriptBridge.eval("window.godotReady = true;")
		send_to_js({"type": "READY"})

func _process(_delta: float) -> void:
	# 轮询来自 JavaScript 的消息
	if JavaScriptBridge.is_available():
		var message = JavaScriptBridge.eval("window.godotMessageQueue.shift()")
		if message and message != "null":
			handle_js_message(message.parse_json())

func send_to_js(data: Dictionary) -> void:
	"""发送消息到 JavaScript"""
	var json = JSON.stringify(data)
	if JavaScriptBridge.is_available():
		JavaScriptBridge.eval("window.postMessage(%s, '*')" % json)

func handle_js_message(data: Dictionary) -> void:
	"""处理来自 JavaScript 的消息"""
	match data.get("type"):
		"LOAD_LEVEL":
			var payload = data.get("payload", {})
			load_level_from_phaser(payload)

func load_level_from_phaser(data: Dictionary) -> void:
	"""从 Phaser 加载关卡"""
	var level_type = data.get("level_type", "speed_run")
	var difficulty = data.get("difficulty", 1)
	var save_id = data.get("save_id", "")
	var node_id = data.get("node_id", 0)
	
	# 设置 API 客户端
	var api = get_node_or_null("/root/APIClient")
	if api:
		api.save_id = save_id
		api.node_id = node_id
	
	# 加载对应场景
	var scene_path = get_scene_path_for_type(level_type)
	if scene_path:
		get_tree().change_scene_to_file(scene_path)
		
		# 设置场景属性
		var scene = get_tree().current_scene
		if scene and scene.has_method("set_config"):
			scene.set_config(level_type, difficulty, save_id, node_id)

func get_scene_path_for_type(level_type: String) -> String:
	"""根据类型获取场景路径"""
	var paths = {
		"speed_run": "res://scenes/levels/speed_run.tscn",
		"castle_battle": "res://scenes/levels/castle_battle.tscn",
		"platform_challenge": "res://scenes/levels/platform_challenge.tscn",
		"boss_battle": "res://scenes/levels/boss_battle.tscn",
	}
	return paths.get(level_type, "")

func complete_level(result_data: Dictionary) -> void:
	"""完成关卡，通知 Phaser"""
	send_to_js({
		"type": "LEVEL_COMPLETE",
		"payload": result_data
	})
	await get_tree().create_timer(2.0).timeout
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func fail_level(reason: String) -> void:
	"""失败关卡，通知 Phaser"""
	send_to_js({
		"type": "LEVEL_FAILED",
		"reason": reason
	})
	await get_tree().create_timer(2.0).timeout
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
```

**4. Godot HTML 导出修改（godot_client/exports/web/index.html）**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Godot Action Dungeon</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #1a1a2e;
        }
        canvas {
            display: block;
        }
    </style>
    <script>
        // 消息队列（Godot 轮询）
        window.godotMessageQueue = [];
        
        // 监听来自父窗口的消息
        window.addEventListener('message', function(event) {
            window.godotMessageQueue.push(JSON.stringify(event.data));
        });
    </script>
</head>
<body>
    <!-- Godot 导出内容 -->
    $GODOT_CONTENT
</body>
</html>
```

---

### 方案 2: 直接集成（高级）

**原理**：
- 将 Godot 导出为 JavaScript 模块
- 在 Phaser 中直接调用 Godot 引擎
- 共享同一个 Canvas

**优点**：
- 性能更好
- 包体积更小
- 无缝切换

**缺点**：
- 实现复杂
- 需要修改 Godot 引擎源码
- 维护成本高

**不推荐**，除非对性能有极致要求。

---

## 数据流

### 1. 开始横版动作关卡

```
用户点击地图格子
    ↓
Phaser ActionDungeonScene
    ↓
调用后端 API: POST /dungeon/action/start
    ↓
返回关卡配置（level_type, difficulty）
    ↓
调用 godotBridge.loadActionLevel(...)
    ↓
iframe 显示，Godot 加载场景
    ↓
Godot 调用后端 API 获取详细配置
    ↓
关卡开始
```

### 2. 关卡进行中

```
Godot 场景
    ↓
玩家移动/战斗/跳跃
    ↓
实时更新 UI（血量、时间）
    ↓
可选：定期同步到后端（自动存档）
```

### 3. 关卡结束

```
胜利/失败条件触发
    ↓
Godot 调用后端 API: POST /dungeon/action/submit
    ↓
发送结果到 Phaser: postMessage({type: 'LEVEL_COMPLETE'})
    ↓
iframe 隐藏
    ↓
Phaser 接收结果
    ↓
更新地图状态（格子颜色、胜利次数）
    ↓
玩家继续探索
```

---

## 项目目录结构

```
MultiGamblingMaster/
├── frontend/                    # Phaser 项目
│   ├── src/
│   │   ├── utils/
│   │   │   └── godotBridge.js   # Godot 通信桥接
│   │   └── ...
│   ├── public/
│   │   └── godot_client/        # Godot 导出文件（构建后复制）
│   └── ...
├── godot_client/                # Godot 项目
│   ├── scenes/
│   │   ├── main_menu.tscn
│   │   └── levels/
│   │       ├── speed_run.tscn
│   │       ├── castle_battle.tscn
│   │       ├── platform_challenge.tscn
│   │       └── boss_battle.tscn
│   ├── scripts/
│   │   ├── main_menu.gd
│   │   ├── base_dungeon.gd
│   │   ├── player.gd
│   │   ├── enemy.gd
│   │   ├── api_client.gd
│   │   ├── js_bridge.gd
│   │   └── levels/
│   │       ├── speed_run.gd
│   │       ├── castle_battle.gd
│   │       ├── platform_challenge.gd
│   │       └── boss_battle.gd
│   ├── exports/
│   │   └── web/                 # Web 导出目录
│   │       ├── index.html
│   │       ├── index.pck
│   │       └── index.wasm
│   └── project.godot
└── backend/                     # FastAPI 后端
    └── ...
```

---

## 构建流程

### 1. 构建 Godot Web 版本

```bash
cd godot_client

# 使用 Godot 命令行导出（需要先安装 Godot）
godot --headless --export-release "Web" exports/web/index.html

# 或使用 Godot 编辑器手动导出：
# 1. 打开项目
# 2. 项目 → 导出
# 3. 选择 Web 预设
# 4. 导出到 exports/web/
```

### 2. 复制到 frontend/public

```bash
# 复制 Godot 导出文件到 Phaser 项目
cp -r godot_client/exports/web/* frontend/public/godot_client/
```

### 3. 构建 Phaser 项目

```bash
cd frontend
npm run build

# 输出到 frontend/dist/
```

---

## 开发建议

### 1. 分别开发

- **Phaser 部分**：独立运行测试
  ```bash
  cd frontend
  npm run dev
  ```

- **Godot 部分**：使用 Godot 编辑器运行
  ```bash
  # 在 Godot 编辑器中打开项目，按 F5 运行
  ```

### 2. 集成测试

- 确保后端服务运行（`python backend/main.py`）
- 启动 Phaser 开发服务器
- 测试从地图进入横版动作关卡的完整流程

### 3. 调试技巧

**Phaser 端调试**：
```javascript
// 在浏览器控制台
console.log('Phaser 版本');
godotBridge.loadActionLevel('speed_run', 1, 'save_001', 5, (success, data) => {
  console.log('关卡结果:', success, data);
});
```

**Godot 端调试**：
```gdscript
# 在 Godot 脚本中
func _ready() -> void:
    print("Godot 场景已加载")
    print("关卡类型:", level_type)
```

---

## 性能优化

### 1. 减少 Godot 包体积

- 使用纹理压缩（WebP）
- 精简音频文件（OGG 格式）
- 移除未使用的资源
- 使用 LOD（细节层次）

### 2. 加载优化

- 预加载 Godot WebAssembly
- 显示加载进度条
- 异步加载资源

### 3. 内存管理

- 及时清理不用的场景
- 使用对象池管理敌人/子弹
- 避免频繁创建销毁对象

---

## 下一步

1. ✅ 创建 Godot 项目框架
2. ✅ 创建玩家和敌人脚本
3. ✅ 创建 4 个关卡脚本
4. ✅ 创建 API 客户端
5. ⏳ 在 Godot 编辑器中布置关卡场景
6. ⏳ 导出 Web 版本
7. ⏳ 集成到 Phaser 项目
8. ⏳ 端到端测试
