# 华夏游录 - 快速测试指南

## 🚀 启动方式

### 方式一：一键启动（推荐）

双击运行：
```powershell
.\start_all.ps1
```

这会自动启动后端服务和 Godot 编辑器。

---

### 方式二：手动分别启动

#### 1️⃣ 启动后端服务

```powershell
.\start_backend.ps1
```

或手动执行：
```powershell
cd backend
python main.py
```

✅ 后端将在 **http://localhost:8001** 启动

---

#### 2️⃣ 启动 Godot 客户端

```powershell
.\start_godot.ps1
```

或双击 `godot_client/project.godot` 打开 Godot 编辑器

✅ Godot 编辑器将打开项目

---

## 🎮 测试流程

### 步骤 1：启动后端服务

确保后端服务运行在 **http://localhost:8001**

### 步骤 2：查看 API 文档

访问：**http://localhost:8001/docs** 查看 Swagger API 文档

### 步骤 3：健康检查

访问：**http://localhost:8001/api/health** 检查服务状态

### 步骤 4：运行 Godot 游戏

1. 双击 `godot_client/project.godot` 打开 Godot
2. 按 **F5** 运行游戏
3. 或在 Godot 编辑器中点击运行按钮

---

## 📋 测试清单

### ✅ 后端测试

- [ ] 后端服务启动成功
- [ ] 访问 http://localhost:8001/api/health 返回正常
- [ ] 查看 API 文档 http://localhost:8001/docs

### ✅ 前端测试

- [ ] 前端服务启动成功
- [ ] 访问 http://localhost:5173 显示游戏界面
- [ ] 游戏加载无错误

### ✅ 功能测试

- [ ] 主菜单显示正常
- [ ] 进入地图场景
- [ ] 选择起点城市（北京/上海/广州/成都/西安）
- [ ] 掷骰子移动
- [ ] 触发格子事件
- [ ] 进入副本挑战
- [ ] 副本完成后返回地图

---

## 🗺️ 地图测试

### 可用地图配置

**终极地图**：`china_map_ultimate.json`
- 65 个城市
- 195 个关卡
- 33 个省级行政区
- 难度分布：2-5 星正态分布

### 起点城市（5 个）

1. **北京** - 难度 5 星
2. **上海** - 难度 4 星
3. **广州** - 难度 3 星
4. **成都** - 难度 4 星
5. **西安** - 难度 4 星

---

## 🐛 故障排查

### 后端启动失败

**错误：端口 8001 已被占用**

解决：
```powershell
# 查找占用端口的进程
netstat -ano | findstr :8001

# 杀死进程（替换 PID）
taskkill /F /PID <PID>
```

**错误：缺少依赖**

解决：
```powershell
cd backend
pip install -r requirements.txt
```

---

### 前端启动失败

**错误：npm 未安装**

解决：安装 Node.js (https://nodejs.org/)

**错误：端口 5173 已被占用**

解决：
```powershell
# 修改 vite.config.js 中的端口
server: { port: 5174 }
```

**错误：缺少依赖**

解决：
```powershell
cd frontend
npm install
```

---

## 🔧 调试技巧

### 后端调试

1. 访问 Swagger UI: http://localhost:8001/docs
2. 查看请求/响应数据
3. 直接测试 API 接口

### 前端调试

1. 打开浏览器 DevTools (F12)
2. 查看 Console 日志
3. 使用 Network 面板监控 API 请求
4. 使用 Performance 分析性能

---

## 📊 性能监控

### 后端性能

- CPU 使用率
- 内存使用
- API 响应时间

### 前端性能

- FPS（目标 60）
- 资源加载时间
- 网络请求延迟

---

## 🎯 测试重点

### 核心功能

1. **地图系统**
   - 城市解锁机制
   - 路径规划
   - 格子事件触发

2. **副本系统**
   - 9 种副本类型
   - 副本入口/出口
   - 状态保持

3. **存档系统**
   - 存档保存
   - 存档读取
   - 数据完整性

### 边界测试

- [ ] 网络断开重连
- [ ] 快速切换场景
- [ ] 多次存档/读档
- [ ] 异常输入处理

---

## 📝 测试报告模板

```markdown
## 测试报告

**测试日期**: 2026-04-07
**测试版本**: v0.2.0

### 测试结果

✅ 后端服务：正常
✅ 前端服务：正常
✅ 地图系统：正常
✅ 副本系统：正常
❌ 发现问题：[描述]

### 性能数据

- 后端响应时间：< 100ms
- 前端 FPS: 60
- 资源加载时间：< 2s

### 问题清单

1. [问题描述]
2. [问题描述]

### 建议

- [改进建议]
```

---

## 🌐 浏览器兼容性

### 推荐浏览器

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+

### 不支持

- ❌ Internet Explorer

---

## 📞 技术支持

如遇问题，请检查：
1. 后端日志（backend 目录）
2. 前端 Console 错误
3. Network 请求状态
4. API 文档接口定义

---

**祝测试顺利！** 🎮✨
