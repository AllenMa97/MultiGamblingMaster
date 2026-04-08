# 🚀 快速测试指南

## 📋 现在有哪些关卡？

### ✅ 已完成的关卡框架（4 种 Godot 动作 + 9 种传统策略）

#### Godot 横版动作类（需要布置场景）
1. **园林跑酷**（Speed Run）- 苏州园林
   - 框架：✅ 完成
   - 场景：⏳ 待布置
   - 玩法：60 秒内在亭台楼阁间穿梭

2. **古塔战斗**（Castle Battle）- 杭州雷峰塔/西安大雁塔
   - 框架：✅ 完成
   - 场景：⏳ 待布置
   - 玩法：5 波敌人清关战斗

3. **登山攀岩**（Platform Challenge）- 黄山
   - 框架：✅ 完成
   - 场景：⏳ 待布置
   - 玩法：垂直攀爬 2000 像素

4. **神兽 Boss 战**（Boss Battle）- 各地传说
   - 框架：✅ 完成
   - 场景：⏳ 待布置
   - 玩法：3 阶段 Boss 战（白蛇、麒麟、雪狮）

#### 传统策略类（已有框架）
5. **园林题诗**（Poetry）- 苏州 ✅ 可测试
6. **断桥邂逅**（Dating）- 杭州 ✅ 可测试
7. **长安诗会**（AI Debate）- 西安 ✅ 可测试
8. **徽州商帮**（Spy）- 安徽 ✅ 可测试
9. **大唐牌坊**（Card）- 西安 ✅ 可测试
10. **云海幻境**（Reverse）- 黄山 ✅ 可测试
11. **高原审问**（Interrogate）- 西藏 ✅ 可测试
12. **荒诞科举**（Absurd）- 北京 ✅ 可测试
13. **中医治病**（TCM）- 各地 ✅ 可测试
14. **丝绸之路**（Trade）- 长安→西域 ⏳ 待开发
15. **华山论剑**（Fighting）- 华山 ⏳ 待开发

---

## 🎮 如何测试

### 方式 1：测试传统回合制副本（最简单）

**条件**：
- ✅ 后端服务运行
- ✅ 前端服务运行
- ✅ API Key 配置

**步骤**：
```bash
# 1. 启动后端
cd backend
python main.py

# 2. 在新窗口启动前端
cd frontend
npm run dev

# 3. 打开浏览器
# 访问 http://localhost:5173
```

**可测试的副本**：
- 卡牌副本（比大小）
- AI 辩论
- 间谍卧底
- 约会模拟
- 诗歌创作
- 反转世界
- 荒诞科举
- 高原审问

---

### 方式 2：测试 Godot 横版动作关卡

**条件**：
- ⏳ 需要安装 Godot 4.2+
- ⏳ 需要在 Godot 编辑器中布置场景
- ⏳ 需要导出 Web 版本

**步骤**：

#### 2.1 安装 Godot
```
1. 访问 https://godotengine.org/download/
2. 下载 Godot 4.2 Standard（推荐）
3. 解压到任意位置
4. 运行 Godot_v4.x.exe
```

#### 2.2 导入项目
```
1. 打开 Godot 编辑器
2. 点击"导入"（Import）
3. 浏览并选择：godot_client/project.godot
4. 选择项目文件夹
5. 点击"导入并编辑"
```

#### 2.3 测试单个关卡
```
1. 在 Godot 编辑器左侧，展开 scenes/levels/
2. 双击要测试的场景（如 speed_run.tscn）
3. 按 F5 或点击编辑器右上角"运行"按钮
4. 测试基本操作：
   - WASD 移动
   - 空格跳跃
   - J 攻击
   - K 防御
   - L 技能
```

#### 2.4 创建测试场景（必须步骤）

**当前状态**：脚本已完成，但场景未创建

**需要创建的场景**：

**场景 1：speed_run.tscn（园林跑酷）**
```
1. 新建场景 → Node2D
2. 命名为"speed_run"
3. 添加子节点:
   - Player（玩家，实例化 player.tscn）
   - Camera2D（相机，跟随玩家）
   - 平台（StaticBody2D + CollisionShape2D）× 10
   - 陷阱（Area2D + Sprite）× 5
   - 终点旗杆（Area2D）
   - 背景（Sprite2D，中国园林图片）
4. 附加脚本：scripts/levels/speed_run.gd
5. 保存场景：scenes/levels/speed_run.tscn
```

**场景 2：castle_battle.tscn（古塔战斗）**
```
1. 新建场景 → Node2D
2. 命名为"castle_battle"
3. 添加子节点:
   - Player
   - Camera2D
   - 敌人（BasicEnemy 实例）× 6
   - 场地边界（StaticBody2D）
4. 附加脚本：scripts/levels/castle_battle.gd
5. 保存场景
```

**场景 3：platform_challenge.tscn（登山攀岩）**
```
1. 新建场景 → Node2D
2. 添加子节点:
   - Player（底部起始点）
   - Camera2D（垂直跟随）
   - 平台（各种类型）× 20
   - 终点宝箱（顶部）
3. 附加脚本：scripts/levels/platform_challenge.gd
```

**场景 4：boss_battle.tscn（Boss 战）**
```
1. 新建场景 → Node2D
2. 添加子节点:
   - Player
   - Boss（需要创建 Boss 场景）
   - Camera2D
   - 场地（1280x720）
3. 附加脚本：scripts/levels/boss_battle.gd
```

#### 2.5 导出 Web 版本
```
1. 菜单：项目 → 导出
2. 选择左侧"Web"预设
3. 点击"..."选择导出路径：
   exports/web/index.html
4. 点击"导出项目"
5. 等待导出完成
```

#### 2.6 集成到 Phaser
```bash
# 1. 复制 Godot 导出文件
cp -r godot_client/exports/web/* frontend/public/godot_client/

# 2. 启动前端
cd frontend
npm run dev

# 3. 测试集成
# 打开浏览器，访问 http://localhost:5173
# 从地图进入 Godot 关卡
```

---

## 🎯 推荐测试顺序

### 第 1 天：测试传统副本
```
1. 启动后端和前端
2. 测试卡牌副本（比大小）
3. 测试 AI 辩论（与李白对诗）
4. 测试约会模拟（断桥邂逅）
5. 确认所有传统副本可运行
```

### 第 2-3 天：创建 Godot 场景
```
1. 在 Godot 编辑器中创建 4 个关卡场景
2. 布置平台、敌人、陷阱
3. 测试每个场景的基本玩法
4. 调整难度和平衡性
```

### 第 4 天：导出和集成
```
1. 导出 Godot Web 版本
2. 复制到 Phaser 项目
3. 创建 godotBridge.js
4. 测试 Phaser → Godot 切换
```

### 第 5 天：完整测试
```
1. 从苏州园林地图进入
2. 选择"园林跑酷"关卡
3. Godot 加载并游玩
4. 完成后返回地图
5. 测试所有 4 个 Godot 关卡
```

---

## 🐛 常见问题

### Q1: 后端启动失败
**错误**: `ModuleNotFoundError: No module named 'fastapi'`

**解决**:
```bash
cd backend
pip install -r requirements.txt
```

### Q2: 前端启动失败
**错误**: `npm: command not found`

**解决**:
- 安装 Node.js: https://nodejs.org/
- 验证安装：`node --version` 和 `npm --version`

### Q3: API Key 错误
**错误**: `DashScope API key not configured`

**解决**:
```bash
# 1. 复制环境变量
cp .env.example .env

# 2. 编辑 .env 文件
# 填入你的 API Key:
DASHSCOPE_API_KEYS=sk-your_actual_key_here

# 3. 重启后端
```

### Q4: Godot 场景无法运行
**错误**: 场景为空，没有内容

**解决**:
- 脚本已完成，但需要在 Godot 编辑器中手动布置场景
- 参考上方"2.4 创建测试场景"步骤
- 或使用示例场景（Godot 官方示例）

### Q5: Godot iframe 不显示
**错误**: 前端运行时点击关卡没反应

**解决**:
```javascript
// 1. 检查 godot_client 文件夹是否存在
// frontend/public/godot_client/index.html 应该存在

// 2. 检查跨域问题
// 确保使用 http://localhost:5173 访问，不是 file://

// 3. 检查浏览器控制台
// 按 F12 查看是否有错误信息
```

---

## 📚 参考文档

- **中国风关卡设计**: [CHINA_LEVELS.md](CHINA_LEVELS.md)
- **Godot 快速开始**: [godot_client/QUICKSTART.md](godot_client/QUICKSTART.md)
- **Godot 集成方案**: [godot_client/INTEGRATION.md](godot_client/INTEGRATION.md)
- **DNF 风格架构**: [DNF_STYLE_DESIGN.md](DNF_STYLE_DESIGN.md)
- **项目主文档**: [README.md](README.md)

---

## 🎮 操作说明

### 传统回合制副本
- **操作**: 鼠标点击
- **界面**: UI 按钮、输入框、卡牌

### Godot 横版动作
- **移动**: WASD 或 ←↑↓→
- **跳跃**: 空格
- **攻击**: J
- **防御**: K
- **技能**: L

---

## ✅ 检查清单

测试前请确认：

- [ ] Python 3.8+ 已安装
- [ ] Node.js 16+ 已安装
- [ ] 后端依赖已安装（pip install -r requirements.txt）
- [ ] 前端依赖已安装（npm install）
- [ ] .env 文件已配置 API Key
- [ ] 后端服务已启动（http://localhost:8001）
- [ ] 前端服务已启动（http://localhost:5173）
- [ ] 浏览器可正常访问

测试 Godot 需要额外确认：

- [ ] Godot 4.2+ 已安装
- [ ] Godot 项目已导入
- [ ] 4 个关卡场景已创建
- [ ] Web 版本已导出
- [ ] 已复制到 frontend/public/godot_client/

---

**祝你测试愉快！** 🎉

如有问题，请查看浏览器控制台（F12）或后端日志。
