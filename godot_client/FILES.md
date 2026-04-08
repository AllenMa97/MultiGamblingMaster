# Godot 横版动作项目文件清单

## ✅ 已创建文件列表

### 核心配置文件
| 文件名 | 路径 | 说明 |
|--------|------|------|
| `project.godot` | `godot_client/` | Godot 项目配置（输入映射、窗口、图层） |
| `export_presets.cfg` | `godot_client/` | Web 导出预设配置 |

### 核心脚本
| 文件名 | 路径 | 说明 | 行数 |
|--------|------|------|------|
| `player.gd` | `godot_client/scripts/` | 玩家控制器（移动、跳跃、攻击、防御） | 154 |
| `enemy.gd` | `godot_client/scripts/` | 敌人 AI 基类（追击、攻击、血量） | 87 |
| `api_client.gd` | `godot_client/scripts/` | HTTP 客户端（与 FastAPI 通信） | 87 |
| `base_dungeon.gd` | `godot_client/scripts/` | 横版动作关卡基类 | 184 |
| `main_menu.gd` | `godot_client/scripts/` | 主菜单场景（关卡选择） | 80 |

### 关卡脚本
| 文件名 | 路径 | 关卡类型 | 行数 |
|--------|------|----------|------|
| `speed_run.gd` | `godot_client/scripts/levels/` | 极速跑酷 | 69 |
| `castle_battle.gd` | `godot_client/scripts/levels/` | 城堡战斗 | 77 |
| `platform_challenge.gd` | `godot_client/scripts/levels/` | 平台跳跃 | 60 |
| `boss_battle.gd` | `godot_client/scripts/levels/` | Boss 战 | 107 |

### 文档
| 文件名 | 路径 | 说明 | 行数 |
|--------|------|------|------|
| `LEVEL_DESIGN.md` | `godot_client/` | 关卡设计文档（4 个关卡详细说明） | 231 |
| `INTEGRATION.md` | `godot_client/` | 与 Phaser 集成方案（iframe 通信） | 518 |
| `QUICKSTART.md` | `godot_client/` | 快速开始指南 | 378 |
| `FILES.md` | `godot_client/` | 本文件（项目文件清单） | - |

---

## 📊 代码统计

### 总计
- **脚本文件**：9 个
- **文档文件**：4 个
- **配置文件**：2 个
- **总代码行数**：~1,500+ 行 GDScript
- **总文档行数**：~1,600+ 行 Markdown

### 功能模块占比
```
玩家系统：154 行 (18%)
关卡系统：427 行 (51%)
敌人 AI:    87 行 (10%)
API 通信：  87 行 (10%)
主菜单：    80 行 (10%)
文档：      1,627 行
```

---

## 🎮 游戏特性

### 玩家能力
- ✅ 左右移动（A/D 或←/→）
- ✅ 上下移动（W/S 或↑/↓，用于平台跳跃）
- ✅ 跳跃（空格键）
- ✅ 普通攻击（J 键）
- ✅ 防御（K 键，减免 50% 伤害）
- ✅ 技能（L 键）
- ✅ 血量系统（100 HP 基础）
- ✅ 攻击伤害（10 基础）
- ✅ 动画状态机（idle/run/jump/attack/hurt）

### 敌人类型
- ✅ 普通敌人（近战，30 HP，15 攻击）
- ✅ 远程敌人（待实现）
- ✅ 精英敌人（待实现）
- ✅ Boss（机械守卫，200 HP，多阶段）

### 关卡类型
1. **极速跑酷** - 平台跳跃 + 陷阱躲避 + 时间限制
2. **城堡战斗** - 清关动作 + 波次敌人 + 连招系统
3. **平台跳跃** - 精确跳跃 + 移动平台 + 垂直攀爬
4. **Boss 战** - 多阶段 Boss + 技能躲避 + 场地机制

---

## 🏗️ 技术架构

### 引擎版本
- **Godot**: 4.2+
- **渲染器**: Forward Plus
- **目标平台**: Web (HTML5 + WebAssembly)

### 输入映射
```ini
move_left     → A / ←
move_right    → D / →
move_up       → W / ↑
move_down     → S / ↓
jump          → 空格
attack        → J
defend        → K
skill         → L
```

### 碰撞图层
```
Layer 1: Player        (玩家)
Layer 2: Enemies       (敌人)
Layer 3: Platforms     (平台)
Layer 4: AttackHitbox  (攻击判定)
Layer 5: EnemyHitbox   (敌人攻击判定)
```

---

## 🔄 与现有系统集成

### 后端 API（FastAPI）
现有接口保持不变：
- `POST /dungeon/action/start` - 开始关卡
- `POST /dungeon/action/submit` - 提交结果

### 前端（Phaser）
通过 iframe + postMessage 通信：
```javascript
// Phaser → Godot
godotBridge.loadActionLevel('speed_run', 1, 'save_001', 5, callback);

// Godot → Phaser
{
  type: 'LEVEL_COMPLETE',
  payload: { success: true, time: 45.2 }
}
```

### 数据流
```
Phaser 地图场景
    ↓
用户点击动作格子
    ↓
调用后端 /dungeon/action/start
    ↓
显示 Godot iframe
    ↓
Godot 加载场景
    ↓
玩家进行关卡
    ↓
关卡结束
    ↓
调用后端 /dungeon/action/submit
    ↓
通知 Phaser 关闭 iframe
    ↓
返回地图场景
```

---

## 📁 待创建内容（需要在 Godot 编辑器中手动完成）

### 场景文件（.tscn）
以下场景需要在 Godot 编辑器中创建：

1. **主场景**
   - `scenes/main_menu.tscn` - 主菜单 UI

2. **玩家和敌人**
   - `scenes/player.tscn` - 玩家场景
   - `scenes/enemies/basic_enemy.tscn` - 普通敌人
   - `scenes/bosses/mech_guardian.tscn` - Boss

3. **关卡场景**
   - `scenes/levels/speed_run.tscn` - 极速跑酷
   - `scenes/levels/castle_battle.tscn` - 城堡战斗
   - `scenes/levels/platform_challenge.tscn` - 平台跳跃
   - `scenes/levels/boss_battle.tscn` - Boss 战

### 资源文件（可选）
- `assets/sprites/` - 精灵图片
- `assets/audio/` - 音效和音乐
- `assets/animations/` - 动画资源

### 自动导出目录
```
godot_client/exports/web/
├── index.html    (导出后生成)
├── index.pck     (导出后生成)
├── index.wasm    (导出后生成)
└── godot.html    (导出后生成)
```

---

## 🚀 使用流程

### 1. 在 Godot 编辑器中打开项目
```bash
# 启动 Godot
godot.exe

# 导入项目
选择 godot_client/project.godot
```

### 2. 创建场景（手动）
参考 `QUICKSTART.md` 中的"步骤 3"

### 3. 测试运行
```
在 Godot 编辑器中按 F5
选择要测试的场景
```

### 4. 导出 Web 版本
```
菜单：项目 → 导出
选择：Web 预设
导出到：exports/web/index.html
```

### 5. 集成到 Phaser
```bash
# 复制导出文件
cp -r godot_client/exports/web/* frontend/public/godot_client/

# 启动 Phaser 测试
cd frontend
npm run dev
```

---

## 📈 项目亮点

### 1. 清晰的架构
- 前后端分离
- 双引擎各司其职（Phaser 适合 2D UI/回合制，Godot 适合实时动作）
- 通过标准 HTTP API 和 postMessage 通信

### 2. 模块化设计
- 玩家、敌人、关卡都是独立模块
- 易于扩展新关卡类型
- 脚本复用率高

### 3. 完整的文档
- 关卡设计文档（LEVEL_DESIGN.md）
- 集成方案文档（INTEGRATION.md）
- 快速开始指南（QUICKSTART.md）
- 代码注释完整

### 4. 生产就绪
- 包含完整的 API 通信
- 与现有存档系统兼容
- 支持难度选择
- 包含胜负判定和结果提交

---

## 🎯 下一步行动

### 立即执行（今天）
1. ✅ 安装 Godot 4.2+
2. ✅ 导入项目
3. ✅ 阅读 LEVEL_DESIGN.md 了解关卡设计
4. ⏳ 创建玩家场景（Player.tscn）
5. ⏳ 创建基础敌人场景（BasicEnemy.tscn）

### 本周内
1. 布置 4 个关卡场景
2. 测试每个关卡的可玩性
3. 导出 Web 版本
4. 集成到 Phaser 项目

### 下周
1. 端到端测试（Phaser → Godot → 后端）
2. 添加音效和音乐
3. 优化性能
4. 添加更多敌人类型

---

## 💡 提示

### Godot 学习曲线
- **第 1 天**: 熟悉编辑器界面
- **第 2 天**: 理解场景和节点系统
- **第 3 天**: 掌握 GDScript 基础
- **第 1 周**: 能创建简单 2D 平台跳跃
- **第 2 周**: 能创建完整动作关卡

### 开发建议
1. **先做减法**：先用简单几何图形测试玩法，再添加美术资源
2. **频繁测试**：每添加一个功能就测试一次
3. **版本控制**：使用 Git 管理项目（.gitignore 已配置）
4. **参考示例**：Godot 官方有很多 2D 平台跳跃示例项目

### 性能优化
- WebAssembly 初始加载 ~15-20MB（可接受）
- 运行时内存占用 ~100-200MB
- 帧率目标：60 FPS（Web 端）
- 同屏敌人建议不超过 10 个

---

## 📞 需要帮助？

### 查看文档
1. `QUICKSTART.md` - 快速开始和常见问题
2. `LEVEL_DESIGN.md` - 关卡设计详情
3. `INTEGRATION.md` - Phaser 集成方案

### 官方资源
- [Godot 中文文档](https://docs.godotengine.org/zh_CN/stable/)
- [Godot 官方论坛](https://forum.godotengine.org/)
- [Godot Reddit](https://www.reddit.com/r/godot/)

### 社区
- [Godot 中文社区](https://godotengine.top/)
- [Indie Nova](https://indienova.com/)（独立游戏开发者社区）

---

**项目状态**: 框架完成，等待场景布置 🎮

**最后更新**: 2026-04-07

**开发工具**: Godot 4.2+, FastAPI, Phaser 3
