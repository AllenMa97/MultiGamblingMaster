# Godot 自动化脚本使用说明

## 📦 已创建的脚本

### 1. **run_godot.bat** - 快速启动 Godot 编辑器
**用途**: 打开 Godot 编辑器进行开发

**用法**:
```bash
# 双击运行或在命令行执行
.\run_godot.bat
```

**功能**:
- ✅ 自动检查 Godot 是否存在
- ✅ 自动检查项目是否存在
- ✅ 启动 Godot 并打开项目
- ✅ 显示下一步操作提示

---

### 2. **run_godot_test.bat** - 运行指定场景测试
**用途**: 直接运行单个场景，无需打开编辑器

**用法**:
```bash
# 显示帮助
.\run_godot_test.bat

# 运行指定场景
.\run_godot_test.bat godot_client/scenes/levels/speed_run.tscn
.\run_godot_test.bat godot_client/scenes/main_menu.tscn
```

**可用场景**:
- `main_menu.tscn` - 主菜单
- `speed_run.tscn` - 园林跑酷
- `castle_battle.tscn` - 古塔战斗
- `platform_challenge.tscn` - 登山攀岩
- `boss_battle.tscn` - Boss 战

---

### 3. **export_godot_web.bat** - 导出 Web 版本
**用途**: 将 Godot 项目导出为 HTML5 + WebAssembly

**用法**:
```bash
.\export_godot_web.bat
```

**功能**:
- ✅ 导出到 `godot_client/exports/web/`
- ✅ 生成 HTML、WASM、PCK 文件
- ✅ 提供下一步操作提示

**输出文件**:
```
godot_client/exports/web/
├── index.html      # HTML 壳
├── index.pck       # 资源包
├── index.wasm      # WebAssembly
└── godot.html      # JavaScript 引导
```

---

### 4. **quick_test_godot.bat** - 一键完整测试流程 ⭐ 推荐
**用途**: 自动完成导出 + 复制 + 启动前端测试

**用法**:
```bash
.\quick_test_godot.bat
```

**流程**:
```
步骤 1: 导出 Godot Web 版本
   ↓
步骤 2: 复制到 frontend/public/godot_client/
   ↓
步骤 3: 启动前端开发服务器
   ↓
完成！访问 http://localhost:5173
```

**优点**:
- ✅ 全自动，无需手动操作
- ✅ 包含错误检查
- ✅ 一键完成所有步骤

---

### 5. **modify_and_test.ps1** - 修改后快速测试
**用途**: 修改场景后快速测试（PowerShell 脚本）

**用法**:
```powershell
# 基本用法
.\modify_and_test.ps1 -SceneFile "speed_run"

# 带描述
.\modify_and_test.ps1 -SceneFile "speed_run" -Description "添加了新平台"

# 简写
.\modify_and_test.ps1 -S "castle_battle" -D "修改了敌人 AI"
```

**参数**:
- `-SceneFile` / `-S`: 场景文件名（不含路径）
- `-Description` / `-D`: 修改描述（可选）

**功能**:
- ✅ 自动查找场景文件
- ✅ 在 Godot 中打开测试
- ✅ 支持多种路径格式

**示例**:
```powershell
# 测试跑酷关卡
.\modify_and_test.ps1 -S "speed_run" -D "调整了跳跃高度"

# 测试战斗关卡
.\modify_and_test.ps1 -S "castle_battle" -D "增加了敌人数量"

# 测试 Boss 战
.\modify_and_test.ps1 -S "boss_battle" -D "修改 Boss 技能"
```

---

## 🚀 推荐工作流程

### 开发阶段（使用 Godot 编辑器）

```bash
# 1. 打开 Godot 编辑器
.\run_godot.bat

# 2. 在编辑器中：
#    - 双击场景文件
#    - 按 F5 运行测试
#    - 修改并保存
#    - 重复测试

# 3. 修改后快速测试（可选）
.\modify_and_test.ps1 -S "speed_run" -D "调整了关卡难度"
```

### 测试阶段（导出到前端）

```bash
# 一键完成所有测试
.\quick_test_godot.bat

# 访问浏览器 http://localhost:5173
# 测试 Godot 与 Phaser 的集成
```

### 发布阶段

```bash
# 导出最终 Web 版本
.\export_godot_web.bat

# 手动复制文件
xcopy /E /I /Y godot_client\exports\web\* frontend\public\godot_client\
```

---

## 📋 使用场景示例

### 场景 1：首次开发

```bash
# 1. 启动 Godot 编辑器
.\run_godot.bat

# 2. 在 Godot 中：
#    - 导入项目（首次）
#    - 创建场景
#    - 布置关卡
#    - F5 测试

# 3. 导出到前端
.\quick_test_godot.bat
```

### 场景 2：日常修改

```bash
# 1. 打开编辑器
.\run_godot.bat

# 2. 修改场景

# 3. 在编辑器中 F5 测试

# 4. 满意后导出
.\quick_test_godot.bat
```

### 场景 3：快速测试单个场景

```bash
# 不打开编辑器，直接测试
.\run_godot_test.bat godot_client/scenes/levels/speed_run.tscn
```

---

## ⚠️ 常见问题

### Q1: 脚本报错"未找到 Godot"
**解决**: 确认 `Godot_v4.6.2-stable_win64.exe` 在项目根目录

### Q2: PowerShell 脚本无法运行
**解决**: 执行以下命令允许脚本运行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Q3: 导出 Web 失败
**解决**: 
1. 在 Godot 编辑器中配置 Web 导出预设
2. 菜单：项目 → 导出 → 添加"Web"预设
3. 保存项目

### Q4: 前端无法访问 Godot 文件
**解决**: 
```bash
# 手动复制文件
xcopy /E /I /Y godot_client\exports\web\* frontend\public\godot_client\

# 重启前端服务器
cd frontend
npm run dev
```

---

## 💡 最佳实践

### 1. 使用版本控制
```bash
# 每次修改后提交
git add .
git commit -m "修改了园林跑酷关卡"
```

### 2. 命名规范
- 场景文件：`speed_run.tscn`（小写，下划线）
- 脚本文件：`speed_run.gd`
- 描述清晰：`-D "调整了第三关的跳跃难度"`

### 3. 测试顺序
```
1. Godot 编辑器内 F5 测试
2. 修改满意后，导出 Web
3. 前端集成测试
4. 发现问题 → 返回步骤 1
```

### 4. 备份导出文件
```bash
# 导出后备份
xcopy /E /I /Y godot_client\exports\web\* backup\godot_web\
```

---

## 📞 快捷命令速查

```bash
# 打开编辑器
.\run_godot.bat

# 测试场景
.\run_godot_test.bat [场景路径]

# 一键测试
.\quick_test_godot.bat

# 导出 Web
.\export_godot_web.bat

# 修改后测试（PowerShell）
.\modify_and_test.ps1 -S [场景名] -D [描述]
```

---

**祝你开发顺利！** 🎮✨

如有问题，请查看脚本输出的错误信息。
