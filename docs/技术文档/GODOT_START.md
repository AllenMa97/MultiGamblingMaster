# 🚀 Godot 启动说明

## ⚠️ 问题

尝试直接运行 `godot.exe` 失败，因为 Godot 没有添加到系统 PATH 中。

## ✅ 解决方案

### 方法 1：双击项目文件（推荐）
1. 打开文件资源管理器
2. 导航到：`d:\MultiGamblingMaster\godot_client\`
3. 双击 `project.godot` 文件
4. Godot 编辑器会自动打开项目

### 方法 2：通过 Godot 导入
1. 启动 Godot（从桌面快捷方式或安装目录）
2. 点击"导入"按钮
3. 浏览并选择：`d:\MultiGamblingMaster\godot_client\project.godot`
4. 点击"导入并编辑"

### 方法 3：添加到 PATH（高级）
如果想从命令行启动，需要将 Godot 添加到系统 PATH：

#### Windows 步骤：
1. 找到 Godot 安装位置，例如：
   ```
   C:\Program Files\Godot\Godot_v4.x.x.exe
   ```
2. 右键"此电脑" → "属性" → "高级系统设置"
3. 点击"环境变量"
4. 在"系统变量"中找到 `Path`
5. 点击"编辑" → "新建"
6. 添加 Godot 所在目录路径
7. 确定保存
8. 重新打开 PowerShell
9. 测试：`godot --version`

## 📁 Godot 项目结构

```
godot_client/
├── project.godot          # 项目配置文件 ⭐
├── export_presets.cfg     # 导出预设
├── scripts/
│   ├── player.gd          # 玩家控制（玉石精灵）
│   ├── enemy.gd           # 敌人 AI
│   ├── base_dungeon.gd    # 副本基类
│   ├── main_menu.gd       # 主菜单
│   ├── api_client.gd      # API 客户端
│   └── levels/
│       ├── speed_run.gd           # 跑酷关卡
│       ├── castle_battle.gd       # 城堡战斗
│       ├── platform_challenge.gd  # 平台攀爬
│       └── boss_battle.gd         # Boss 战
└── scenes/ (需要创建)
    └── levels/
        ├── speed_run.tscn
        ├── castle_battle.tscn
        ├── platform_challenge.tscn
        └── boss_battle.tscn
```

## 🎮 已有脚本功能

### 1. speed_run.gd（跑酷关卡）
- **用途**: 城市跑酷挑战
- **适配**: 13 个城市
- **玩法**: 快速移动、收集物品、计时挑战
- **配置参数**:
  ```gdscript
  var level_name = "园林跑酷"
  var difficulty = 1
  var time_limit = 60.0
  var collectibles_needed = 10
  ```

### 2. castle_battle.gd（城堡战斗）
- **用途**: 攀登建筑战斗
- **适配**: 11 个城市
- **玩法**: 逐层挑战、击败敌人、到达塔顶
- **配置参数**:
  ```gdscript
  var level_name = "雷峰塔挑战"
  var difficulty = 2
  var floors = 5
  var enemies_per_floor = 2
  ```

### 3. platform_challenge.gd（平台攀爬）
- **用途**: 垂直攀爬挑战
- **适配**: 5 个城市
- **玩法**: 平台跳跃、精确操作、垂直向上
- **配置参数**:
  ```gdscript
  var level_name = "攀登黄山"
  var difficulty = 3
  var height = 2000
  var platform_count = 50
  ```

### 4. boss_battle.gd（Boss 战）
- **用途**: 挑战 Boss
- **适配**: 2 个城市
- **玩法**: 单挑 Boss、躲避攻击、寻找弱点
- **配置参数**:
  ```gdscript
  var level_name = "壮族神兽"
  var difficulty = 3
  var boss_hp = 100
  var boss_attacks = 4
  ```

## 🎨 角色设定

### 主角：石头（玉石精灵）
- **原型**: 和田玉
- **外观**: 圆润的白色身体，淡绿色光晕
- **特征**: 小短手、小短脚、大眼睛
- **能力**: 
  - 移动速度：中等
  - 跳跃力：高
  - 特殊能力：玉之护盾（短暂无敌）

### 在 Godot 中的实现
```gdscript
# player.gd
var speed = 200.0
var jump_strength = -400.0
var has_shield = false
var shield_duration = 3.0
```

## 📋 测试清单

### 在 Godot 中测试关卡
1. ✅ 打开 Godot 编辑器
2. ✅ 导入项目（如果还没导入）
3. ✅ 打开场景：
   - `res://scenes/levels/speed_run.tscn`
   - `res://scenes/levels/castle_battle.tscn`
   - `res://scenes/levels/platform_challenge.tscn`
   - `res://scenes/levels/boss_battle.tscn`
4. ✅ 按 F5 运行当前场景
5. ✅ 测试基本功能：
   - 移动（方向键/WASD）
   - 跳跃（空格键）
   - 攻击（Z 键或鼠标左键）
   - 特殊能力（X 键）

### 与 Phaser 集成测试
1. ✅ 导出 Godot 项目为 Web 版本
   ```
   菜单：项目 → 导出
   选择：Web
   导出到：exports/web/index.html
   ```
2. ✅ 复制导出文件到前端
   ```
   cp -r exports/web/* ../frontend/public/godot_client/
   ```
3. ✅ 启动前端测试
   ```
   cd ../frontend
   npm run dev
   ```
4. ✅ 在浏览器中测试从地图进入关卡

## 🔧 配置示例

### 苏州 - 园林跑酷配置
```gdscript
# 在 speed_run.gd 中
func _ready():
    level_config = {
        "name": "园林跑酷",
        "city": "苏州",
        "difficulty": 1,
        "time_limit": 60.0,
        "collectibles": 10,
        "obstacles": ["月亮门", "石桌", "回廊"],
        "theme": "苏州园林"
    }
```

### 杭州 - 雷峰塔挑战配置
```gdscript
# 在 castle_battle.gd 中
func _ready():
    level_config = {
        "name": "雷峰塔挑战",
        "city": "杭州",
        "difficulty": 2,
        "floors": 5,
        "enemies": ["侍卫", "弓箭手", "白蛇"],
        "theme": "古塔"
    }
```

## 🎯 下一步工作

### 优先级 1（必须）
- [ ] 在 Godot 中创建场景文件（.tscn）
  - 使用现有脚本
  - 布置地形、障碍物、敌人
  - 添加收集品和终点

### 优先级 2（重要）
- [ ] 配置每个关卡的具体参数
- [ ] 测试 4 种基础关卡类型
- [ ] 导出 Web 版本

### 优先级 3（集成）
- [ ] 实现 Phaser → Godot 通信
- [ ] 实现 Godot → Phaser 回调
- [ ] 测试完整的"选择关卡→游戏→返回"流程

## 📞 常见问题

### Q: 双击 project.godot 没反应？
A: 需要先安装 Godot 4.x，然后右键选择"打开方式"→ Godot

### Q: 导入项目后看不到场景？
A: 需要手动创建场景文件（.tscn），脚本（.gd）只是逻辑代码

### Q: 如何测试特定城市的关卡？
A: 在 Godot 中打开对应场景，修改配置参数，然后按 F5 测试

### Q: Godot 版本要求？
A: Godot 4.2+（推荐使用最新稳定版）

## 🔗 相关文档

- [关卡总览](LEVELS_OVERVIEW.md) - 31 个关卡详细列表
- [美术设计](ART_DESIGN_SIMPLE.md) - 角色和场景设计
- [Godot 集成](godot_client/INTEGRATION.md) - Phaser 与 Godot 通信
- [Godot 快速开始](godot_client/QUICKSTART.md) - Godot 入门指南

---

**现在请双击 `godot_client/project.godot` 打开 Godot 编辑器吧！** 🎮✨
