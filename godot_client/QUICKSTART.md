# Godot 横版动作关卡 - 快速开始指南

## 📦 已完成的内容

### 1. Godot 项目结构 ✅

```
godot_client/
├── project.godot              # 项目配置（输入映射、窗口设置）
├── export_presets.cfg         # Web 导出配置
├── scripts/
│   ├── player.gd              # 玩家控制器（移动、跳跃、攻击、防御）
│   ├── enemy.gd               # 敌人 AI（追击、攻击、血量）
│   ├── api_client.gd          # HTTP 客户端（与 FastAPI 通信）
│   ├── base_dungeon.gd        # 关卡基类（通用逻辑）
│   ├── main_menu.gd           # 主菜单（关卡选择）
│   └── levels/
│       ├── speed_run.gd       # 极速跑酷关卡
│       ├── castle_battle.gd   # 城堡战斗关卡
│       ├── platform_challenge.gd  # 平台跳跃关卡
│       └── boss_battle.gd     # Boss 战关卡
├── LEVEL_DESIGN.md            # 关卡设计文档
└── INTEGRATION.md             # 与 Phaser 集成方案
```

### 2. 核心功能 ✅

**玩家系统**：
- ✅ WASD/方向键移动
- ✅ 空格键跳跃
- ✅ J 键攻击
- ✅ K 键防御
- ✅ L 键技能
- ✅ 血量系统
- ✅ 动画状态机

**敌人 AI**：
- ✅ 巡逻逻辑
- ✅ 追击玩家
- ✅ 攻击判定
- ✅ 血量管理
- ✅ 死亡处理

**API 通信**：
- ✅ 与 FastAPI 后端 HTTP 通信
- ✅ 开始/提交关卡结果
- ✅ 存档 ID 和格子 ID 传递

**关卡系统**：
- ✅ 4 种不同关卡类型
- ✅ 胜利/失败条件
- ✅ 计时器 UI
- ✅ 血量条 UI
- ✅ 消息提示

---

## 🚀 下一步操作指南

### 步骤 1：安装 Godot 4.x

1. 访问 [Godot 官网](https://godotengine.org/download/)
2. 下载 **Godot 4.2+** 稳定版（推荐 Standard 版）
3. 解压后运行 `Godot_v4.x.exe`

### 步骤 2：导入项目

1. 打开 Godot 编辑器
2. 点击"导入"（Import）
3. 选择 `godot_client/project.godot`
4. 选择项目文件夹（`godot_client/`）
5. 点击"导入并编辑"

### 步骤 3：创建场景（需要在 Godot 编辑器中手动完成）

#### 3.1 创建玩家场景（Player.tscn）

```
1. 新建场景 → CharacterBody2D
2. 命名为 "Player"
3. 添加子节点:
   - Sprite2D（精灵）
   - CollisionShape2D（碰撞体，矩形）
   - AnimationPlayer（动画播放器）
   - AttackHitbox（Area2D，攻击判定）
   - Hurtbox（Area2D，受伤判定）
4. 附加脚本：scripts/player.gd
5. 设置碰撞层：
   - Layer 1: Player
   - Mask 3: Platforms
   - Mask 2: Enemies
```

**玩家场景树示例**：
```
Player (CharacterBody2D)
├── Sprite2D
├── CollisionShape2D
├── AnimationPlayer
├── AttackHitbox (Area2D)
│   └── CollisionShape2D
└── Hurtbox (Area2D)
    └── CollisionShape2D
```

#### 3.2 创建敌人场景（BasicEnemy.tscn）

```
1. 新建场景 → CharacterBody2D
2. 命名为 "BasicEnemy"
3. 添加子节点:
   - Sprite2D
   - CollisionShape2D
   - AnimationPlayer
   - AttackHitbox (Area2D)
4. 附加脚本：scripts/enemy.gd
5. 设置碰撞层：
   - Layer 2: Enemies
   - Mask 1: Player
   - Mask 3: Platforms
```

#### 3.3 创建主菜单场景（MainMenu.tscn）

```
1. 新建场景 → Control（UI 根节点）
2. 创建 UI 布局:
   - MarginContainer
     - VBoxContainer
       - Label（标题）
       - GridContainer（关卡选择按钮）
       - OptionButton（难度选择）
       - Button（退出）
3. 附加脚本：scripts/main_menu.gd
```

#### 3.4 创建 4 个关卡场景

**极速跑酷（speed_run.tscn）**：
```
1. 新建场景 → Node2D
2. 附加脚本：scripts/levels/speed_run.gd
3. 添加内容:
   - Player（玩家实例）
   - 平台（StaticBody2D + CollisionShape2D）
   - 陷阱（Area2D + Sprite）
   - 终点旗杆（Area2D）
   - 相机（Camera2D，跟随玩家）
   - 背景（Sprite2D 或 ParallaxLayer）
```

**城堡战斗（castle_battle.tscn）**：
```
1. 新建场景 → Node2D
2. 附加脚本：scripts/levels/castle_battle.gd
3. 添加内容:
   - Player
   - 敌人（BasicEnemy 实例 × 6）
   - 场地边界（StaticBody2D）
   - 相机（Camera2D）
```

**平台跳跃（platform_challenge.tscn）**：
```
1. 新建场景 → Node2D
2. 附加脚本：scripts/levels/platform_challenge.gd
3. 添加内容:
   - Player（底部起始点）
   - 固定平台（StaticBody2D × 8）
   - 移动平台（Path2D + PathFollow2D + Platform2D × 4）
   - 消失平台（自定义脚本 × 3）
   - 弹跳垫（Area2D × 2）
   - 终点宝箱（Area2D，顶部）
   - 相机（Camera2D，垂直跟随）
```

**Boss 战（boss_battle.tscn）**：
```
1. 新建场景 → Node2D
2. 附加脚本：scripts/levels/boss_battle.gd
3. 添加内容:
   - Player
   - Boss（MechGuardian.tscn）
   - 场地（StaticBody2D，1280x720）
   - 掩体（StaticBody2D × 2，可破坏）
   - 相机（Camera2D）
```

### 步骤 4：配置输入映射（已完成）

项目配置文件 `project.godot` 已包含输入映射：

```ini
[input]
move_left={...}      # A / 左箭头
move_right={...}     # D / 右箭头
move_up={...}        # W / 上箭头
move_down={...}      # S / 下箭头
jump={...}           # 空格
attack={...}         # J
defend={...}         # K
skill={...}          # L
```

### 步骤 5：导出 Web 版本

**方法 1：使用 Godot 编辑器**

1. 在 Godot 编辑器中，点击菜单 **项目 → 导出**
2. 选择左侧的 **Web** 预设
3. 点击 **...** 选择导出路径：`exports/web/index.html`
4. 点击 **导出项目**
5. 等待导出完成

**方法 2：命令行导出（高级）**

```bash
# 需要安装 Godot 命令行工具
godot --headless --export-release "Web" exports/web/index.html
```

**导出文件说明**：
```
exports/web/
├── index.html         # HTML 壳
├── index.pck          # 资源包
├── index.wasm         # WebAssembly 二进制
└── godot.html         # JavaScript 引导
```

### 步骤 6：集成到 Phaser

1. 复制 Godot 导出文件到 Phaser 项目：
   ```bash
   cp -r godot_client/exports/web/* frontend/public/godot_client/
   ```

2. 在 Phaser 项目中创建通信桥接：
   - 参考 `INTEGRATION.md` 文档
   - 创建 `frontend/src/utils/godotBridge.js`

3. 修改 Phaser 地图场景：
   - 当玩家进入动作关卡格子时
   - 调用 `godotBridge.loadActionLevel(...)`

4. 测试完整流程：
   ```
   启动后端 → 启动前端 → 进入地图 → 点击动作格子 → Godot 加载 → 完成关卡 → 返回地图
   ```

---

## 🎮 关卡操作说明

### 基础操作

| 按键 | 功能 |
|------|------|
| A / ← | 向左移动 |
| D / → | 向右移动 |
| W / ↑ | 向上移动（平台跳跃） |
| S / ↓ | 向下移动（平台跳跃） |
| 空格 | 跳跃 |
| J | 攻击 |
| K | 防御 |
| L | 技能 |

### 各关卡要点

**极速跑酷**：
- 目标：到达最右侧终点旗杆
- 技巧：连续跳跃、躲避尖刺、利用加速带
- 时间限制：60 秒

**城堡战斗**：
- 目标：消灭 3 波敌人
- 技巧：防御反击、连招、优先击杀远程敌人
- Boss：精英敌人

**平台跳跃**：
- 目标：到达最顶部的宝箱
- 技巧：精确跳跃、利用弹跳垫、注意移动平台
- 失败条件：掉落深渊

**Boss 战**：
- 目标：击败机械守卫
- 技巧：躲避冲撞、远离砸地范围、攻击 Boss 背部
- 阶段：3 个阶段，血量越低越难

---

## 🛠️ 常见问题

### Q1: Godot 导出文件太大（>20MB）

**解决方案**：
- 使用纹理压缩（WebP）
- 减少音频文件数量和质量
- 启用 LTO（链接时优化）
- 移除未使用的资源

### Q2: Phaser 和 Godot 通信失败

**检查清单**：
- ✅ iframe 是否正确显示
- ✅ `postMessage` 格式是否正确
- ✅ Godot 是否轮询消息队列
- ✅ 跨域问题（如果是本地文件，使用 `file://` 协议可能受限）

### Q3: Godot WebAssembly 加载慢

**优化方案**：
- 启用 Gzip/Brotli 压缩（服务器端）
- 使用 CDN 托管 WASM 文件
- 显示加载进度条
- 预加载到浏览器缓存

### Q4: 性能问题（帧率低）

**优化建议**：
- 减少同屏敌人数量
- 使用对象池管理子弹
- 优化碰撞检测（使用碰撞层和掩码）
- 简化粒子效果

---

## 📚 学习资源

### Godot 官方文档
- [Godot 4 文档](https://docs.godotengine.org/zh_CN/stable/)
- [2D 平台跳跃教程](https://docs.godotengine.org/zh_CN/stable/getting_started/first_2d_game/01.html)

### 推荐教程
- [GDScript 入门](https://docs.godotengine.org/zh_CN/stable/getting_started/scripting/gdscript/)
- [2D 物理系统](https://docs.godotengine.org/zh_CN/stable/tutorials/physics/physics_introduction.html)
- [动画系统](https://docs.godotengine.org/zh_CN/stable/tutorials/animation/2d_animation.html)

### 示例项目
- [Godot 2D 平台跳跃示例](https://github.com/godotengine/godot-demo-projects/tree/master/2d/platformer)
- [动作游戏模板](https://github.com/godotengine/tps-demo)

---

## 🎯 后续开发建议

### 短期（1-2 周）
1. ✅ 在 Godot 编辑器中布置 4 个关卡场景
2. ✅ 导出 Web 版本
3. ✅ 测试单个关卡运行
4. ⏳ 集成到 Phaser 项目
5. ⏳ 端到端测试

### 中期（1 个月）
1. 添加更多敌人类型
2. 实现 Boss 多阶段技能
3. 添加道具系统（血量包、攻击力提升）
4. 实现连招系统
5. 添加音效和背景音乐

### 长期（2-3 个月）
1. 添加更多关卡类型（解谜、塔防等）
2. 实现多人联机（WebSocket）
3. 移动端适配（触摸控制）
4. 关卡编辑器（玩家自定义关卡）
5. 排行榜系统

---

## 📞 联系方式

如有问题，请查看：
- `LEVEL_DESIGN.md` - 关卡设计详情
- `INTEGRATION.md` - Phaser 集成方案
- Godot 官方文档

**祝开发愉快！** 🎮✨
