# 🚀 下一步行动指南

## ✅ 已完成的工作

### 1. Godot 自动化脚本（5 个）
- ✅ `run_godot.bat` - 快速启动 Godot 编辑器
- ✅ `run_godot_test.bat` - 运行指定场景测试
- ✅ `export_godot_web.bat` - 导出 Web 版本
- ✅ `quick_test_godot.bat` - 一键完整测试流程
- ✅ `modify_and_test.ps1` - 修改后快速测试（PowerShell）
- ✅ `GODOT_SCRIPTS_GUIDE.md` - 详细使用说明

### 2. 中国风地图配置
- ✅ 更新了 `backend/data/maps/map_01.json`
- ✅ 5 个地区 → 扩展到全国
- ✅ 只保留横版动作关卡（Godot）

### 3. Godot 项目框架
- ✅ 项目配置文件 (`project.godot`)
- ✅ 导出预设 (`export_presets.cfg`)
- ✅ 玩家控制脚本 (`player.gd`)
- ✅ 敌人 AI 脚本 (`enemy.gd`)
- ✅ 4 个关卡脚本 (`levels/*.gd`)
- ✅ API 客户端 (`api_client.gd`)
- ✅ 关卡基类 (`base_dungeon.gd`)

---

## 🎯 接下来要做什么

### 阶段 1：在 Godot 中创建场景（1-2 小时）

**当前状态**: 脚本已完成，但场景未创建

**步骤**:

#### 1.1 启动 Godot 编辑器
```bash
# 双击运行
.\run_godot.bat
```

**首次启动**:
- Godot 会提示导入项目
- 选择 `godot_client/project.godot`
- 点击"导入并编辑"

#### 1.2 创建玩家场景

**在 Godot 编辑器中**:
```
1. 场景面板 → 右键 → 新建场景
2. 选择 CharacterBody2D
3. 命名为 "Player"
4. 添加子节点:
   - Sprite2D
   - CollisionShape2D
   - AnimationPlayer
   - AttackHitbox (Area2D)
   - Hurtbox (Area2D)
5. 附加脚本：scripts/player.gd
6. 保存：scenes/player.tscn
```

#### 1.3 创建敌人场景

```
1. 新建场景 → CharacterBody2D
2. 命名为 "BasicEnemy"
3. 添加子节点:
   - Sprite2D
   - CollisionShape2D
   - AnimationPlayer
   - AttackHitbox (Area2D)
4. 附加脚本：scripts/enemy.gd
5. 保存：scenes/enemies/basic_enemy.tscn
```

#### 1.4 创建 4 个关卡场景

**关卡 1: 园林跑酷 (speed_run.tscn)**
```
1. 新建场景 → Node2D
2. 命名为 "speed_run"
3. 添加内容:
   - Player（实例化 player.tscn）
   - Camera2D（跟随玩家）
   - 平台（StaticBody2D + CollisionShape2D）× 10
   - 陷阱（Area2D + Sprite）× 5
   - 终点旗杆（Area2D）
   - 背景（Sprite2D，中国园林图片）
4. 附加脚本：scripts/levels/speed_run.gd
5. 保存场景
6. 按 F5 测试
```

**关卡 2: 古塔战斗 (castle_battle.tscn)**
```
1. 新建场景 → Node2D
2. 命名为 "castle_battle"
3. 添加内容:
   - Player
   - Camera2D
   - 敌人（basic_enemy.tscn）× 6
   - 场地边界（StaticBody2D）
4. 附加脚本：scripts/levels/castle_battle.gd
5. 保存并测试
```

**关卡 3: 登山攀岩 (platform_challenge.tscn)**
```
1. 新建场景 → Node2D
2. 命名为 "platform_challenge"
3. 添加内容:
   - Player（底部起始点）
   - Camera2D（垂直跟随）
   - 平台（各种类型）× 20
   - 终点宝箱（顶部）
4. 附加脚本：scripts/levels/platform_challenge.gd
5. 保存并测试
```

**关卡 4: Boss 战 (boss_battle.tscn)**
```
1. 新建场景 → Node2D
2. 命名为 "boss_battle"
3. 添加内容:
   - Player
   - Boss（需要先创建 Boss 场景）
   - Camera2D
   - 场地（1280x720）
4. 附加脚本：scripts/levels/boss_battle.gd
5. 保存并测试
```

---

### 阶段 2：导出和集成（30 分钟）

#### 2.1 配置 Web 导出

**在 Godot 编辑器中**:
```
1. 菜单：项目 → 导出
2. 点击"添加..." → 选择"Web"
3. 导出路径：exports/web/index.html
4. 保存项目
```

#### 2.2 一键测试集成

```bash
# 自动完成所有步骤
.\quick_test_godot.bat
```

**这个脚本会**:
1. ✅ 导出 Godot Web 版本
2. ✅ 复制到 `frontend/public/godot_client/`
3. ✅ 启动前端开发服务器

**访问**: http://localhost:5173

---

### 阶段 3：修改和迭代（持续）

#### 日常开发流程

```bash
# 1. 打开编辑器
.\run_godot.bat

# 2. 在 Godot 中修改场景

# 3. F5 测试

# 4. 满意后导出测试
.\quick_test_godot.bat

# 5. 在浏览器中测试集成效果

# 6. 发现问题 → 返回步骤 1
```

#### 快速测试单个场景

```bash
# 修改了跑酷关卡
.\modify_and_test.ps1 -S "speed_run" -D "调整了第三关难度"

# 修改了战斗关卡
.\modify_and_test.ps1 -S "castle_battle" -D "增加了敌人 AI"
```

---

## 📋 具体任务清单

### 必须完成的任务 ⭐

- [ ] **创建玩家场景** (player.tscn)
- [ ] **创建敌人场景** (basic_enemy.tscn)
- [ ] **创建跑酷关卡** (speed_run.tscn)
  - [ ] 布置平台
  - [ ] 放置陷阱
  - [ ] 设置终点
- [ ] **创建战斗关卡** (castle_battle.tscn)
  - [ ] 放置 6 个敌人
  - [ ] 设置场地边界
- [ ] **创建攀岩关卡** (platform_challenge.tscn)
  - [ ] 布置 20 个平台
  - [ ] 设置垂直高度
- [ ] **创建 Boss 关卡** (boss_battle.tscn)
  - [ ] 创建 Boss 场景
  - [ ] 设置 Boss 技能
- [ ] **配置 Web 导出**
- [ ] **测试前端集成**

### 可选任务

- [ ] 添加中国风背景音乐
- [ ] 添加音效（跳跃、攻击、受伤）
- [ ] 美化 UI（血量条、计时器）
- [ ] 添加粒子特效
- [ ] 创建更多敌人类型
- [ ] 创建 Boss 场景（机械守卫、白蛇等）

---

## 🎮 测试检查清单

### Godot 场景测试

- [ ] 玩家可以移动（WASD）
- [ ] 玩家可以跳跃（空格）
- [ ] 玩家可以攻击（J）
- [ ] 敌人会追击玩家
- [ ] 攻击可以伤害敌人
- [ ] 陷阱可以伤害玩家
- [ ] 血量条正确显示
- [ ] 计时器正常工作
- [ ] 胜利条件触发
- [ ] 失败条件触发

### 前端集成测试

- [ ] Godot iframe 正确加载
- [ ] Phaser 可以调用 Godot
- [ ] Godot 可以返回 Phaser
- [ ] 数据正确传递
- [ ] 结果正确提交

---

## 💡 提示和技巧

### 1. 使用脚本节省时间

```bash
# 每次修改后都测试
.\modify_and_test.ps1 -S "speed_run" -D "今天的工作"

# 准备发布时
.\quick_test_godot.bat
```

### 2. 在 Godot 中高效开发

- **F5**: 运行当前场景
- **F6**: 运行指定场景
- **Ctrl+S**: 保存
- **Ctrl+Shift+S**: 另存为
- **F1**: 打开帮助文档

### 3. 调试技巧

**Godot 控制台**:
```gdscript
print("玩家位置：", player.global_position)
print("敌人数量：", get_tree().get_node_count_in_group("enemies"))
```

**浏览器控制台**:
```javascript
// 检查 Godot 是否加载
console.log('Godot loaded:', document.getElementById('godot-frame'));

// 测试通信
godotBridge.loadActionLevel('speed_run', 1, 'save_001', 5);
```

### 4. 常见问题快速解决

**问题**: Godot 场景运行后没反应
**解决**: 
- 检查是否附加了脚本
- 检查场景是否有 Camera2D
- 按 F12 查看错误信息

**问题**: 前端无法访问 Godot
**解决**:
```bash
# 重新导出
.\export_godot_web.bat

# 重新复制
xcopy /E /I /Y godot_client\exports\web\* frontend\public\godot_client\

# 重启前端
cd frontend
npm run dev
```

---

## 📚 参考文档

### 项目文档
- **脚本使用**: [GODOT_SCRIPTS_GUIDE.md](GODOT_SCRIPTS_GUIDE.md)
- **关卡设计**: [CHINA_LEVELS.md](CHINA_LEVELS.md)
- **快速测试**: [QUICK_TEST.md](QUICK_TEST.md)
- **架构设计**: [DNF_STYLE_DESIGN.md](DNF_STYLE_DESIGN.md)

### Godot 官方文档
- [Godot 4 中文文档](https://docs.godotengine.org/zh_CN/stable/)
- [2D 平台跳跃教程](https://docs.godotengine.org/zh_CN/stable/getting_started/first_2d_game/01.html)
- [GDScript 参考](https://docs.godotengine.org/zh_CN/stable/tutorials/scripting/gdscript/gdscript_basics.html)

### 示例项目
- [Godot 2D 平台跳跃示例](https://github.com/godotengine/godot-demo-projects/tree/master/2d/platformer)

---

## 🎯 今日目标

**建议按以下顺序完成**:

```
上午 (2 小时):
☐ 启动 Godot 编辑器
☐ 创建玩家场景
☐ 创建敌人场景
☐ 创建跑酷关卡（基础布局）

下午 (2 小时):
☐ 创建其他 3 个关卡
☐ 配置 Web 导出
☐ 测试前端集成

晚上 (1 小时):
☐ 修复发现的问题
☐ 优化游戏体验
☐ 准备明天的工作
```

---

## ✅ 完成标志

当你看到以下内容时，说明第一阶段完成了：

```
✅ Godot 编辑器可以正常运行
✅ 4 个关卡场景都已创建
✅ 每个关卡都可以 F5 运行
✅ 玩家可以移动、跳跃、攻击
✅ 敌人会追击和攻击
✅ 胜利/失败条件正常工作
```

当你完成这些后，运行：

```bash
.\quick_test_godot.bat
```

然后在浏览器中访问 http://localhost:5173，看到 Godot 关卡成功加载！

---

**加油！期待看到你制作的精美中国风横版动作游戏！** 🎮✨

有任何问题都可以随时问我！
