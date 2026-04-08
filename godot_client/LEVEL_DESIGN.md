# 横版动作关卡设计文档

## 关卡总览

本项目包含 4 个不同风格的横版动作 demo 关卡，每个关卡展示不同的游戏机制：

### 关卡 1：极速跑酷 (Speed Run)
**类型**：平台跳跃 + 陷阱躲避  
**目标**：在限定时间内到达终点  
**核心机制**：
- 连续跳跃平台
- 移动平台
- 尖刺陷阱
- 加速带
- 收集品（可选）

**设计要点**：
- 地图长度：约 3000 像素
- 时间限制：60 秒
- 难度曲线：简单 → 中等 → 困难
- 检查点：3 个

**敌人配置**：无（纯跑酷）

**胜利条件**：到达终点旗杆  
**失败条件**：时间耗尽或掉入深渊

---

### 关卡 2：城堡战斗 (Castle Battle)
**类型**：横版清关动作  
**目标**：击败所有敌人  
**核心机制**：
- 近战攻击（J 键）
- 防御格挡（K 键）
- 连招系统
- 敌人波次

**设计要点**：
- 地图长度：约 1500 像素（单屏）
- 敌人波次：3 波
  - 第 1 波：2 个普通敌人
  - 第 2 波：3 个普通敌人 + 1 个远程敌人
  - 第 3 波：1 个精英敌人 + 2 个普通敌人

**敌人类型**：
1. **普通敌人**：近战，低血量
2. **远程敌人**：远程攻击，低血量
3. **精英敌人**：高血量，高伤害，会防御

**胜利条件**：消灭所有敌人  
**失败条件**：玩家血量归零

---

### 关卡 3：平台跳跃挑战 (Platform Challenge)
**类型**：精确平台跳跃  
**目标**：到达顶层  
**核心机制**：
- 移动平台
- 消失平台
- 弹跳垫
- 传送带
- 风扇（向上气流）

**设计要点**：
- 地图高度：约 2000 像素（垂直向上）
- 平台数量：15-20 个
- 平台类型分布：
  - 固定平台：40%
  - 移动平台：30%
  - 消失平台：20%
  - 弹跳垫：10%

**机关设计**：
1. **移动平台**：左右/上下移动
2. **消失平台**：踩踏后 1 秒消失
3. **弹跳垫**：大幅跳跃高度
4. **传送带**：改变移动方向
5. **风扇**：持续向上推力

**胜利条件**：到达顶层宝箱  
**失败条件**：掉落深渊

---

### 关卡 4：Boss 战 (Boss Battle)
**类型**：Boss 对战  
**目标**：击败 Boss  
**核心机制**：
- Boss 多阶段
- Boss 技能躲避
- 输出时机把握
- 场地机制

**Boss 设计 - 机械守卫**：

**阶段 1（100%-70% 血量）**：
- 技能 1：冲撞（直线冲锋，可跳跃躲避）
- 技能 2：砸地（范围攻击，远离 Boss）
- 技能 3：召唤小怪（2 个小怪）

**阶段 2（70%-30% 血量）**：
- 新增技能 4：激光扫射（从下往上扫，需跳跃）
- 新增技能 5：导弹齐射（追踪导弹，需绕圈）
- 冲撞速度提升
- 砸地范围扩大

**阶段 3（30%-0% 血量）**：
- 所有技能冷却减半
- 移动速度提升
- 攻击欲望增强
- 新增技能 6：全屏大招（需躲避到掩体后）

**场地设计**：
- 场地大小：1280x720（单屏）
- 场地元素：
  - 2 个掩体（可被破坏）
  - 地面平坦（无平台跳跃）

**胜利条件**：击败 Boss  
**失败条件**：玩家血量归零

---

## 技术实现

### 通用系统
1. **玩家控制器**：`player.gd`
   - 移动、跳跃、攻击、防御
   - 状态机管理
   - 动画系统

2. **敌人 AI**：`enemy.gd`
   - 巡逻、追击、攻击
   - 状态机
   - 伤害系统

3. **API 通信**：`api_client.gd`
   - 与 FastAPI 后端通信
   - 开始/提交关卡结果
   - 存档同步

### 关卡脚本
每个关卡都有独立的场景脚本，继承自基类 `BaseDungeon.gd`：

```gdscript
class_name BaseDungeon
extends Node2D

# 通用属性
var api_client: APIClient
var player: CharacterBody2D
var difficulty: int
var start_time: float
var is_dungeon_active: bool = false

# 虚方法（子类实现）
func start_dungeon() -> void:
    pass

func check_victory() -> bool:
    return false

func check_defeat() -> bool:
    return false

func submit_result() -> void:
    pass
```

### 与 Phaser 前端集成

**场景切换流程**：
1. Phaser 地图场景 → 点击动作关卡格子
2. 调用后端 `/dungeon/action/start` 获取关卡配置
3. 根据配置加载对应 Godot 场景（关卡 1-4）
4. Godot 场景通过 HTTP 与后端通信
5. 关卡结束后返回 Phaser 地图场景

**Web 导出集成**：
```html
<!-- 在 Phaser 项目中嵌入 Godot 导出文件 -->
<iframe id="godot-frame" src="godot_client/index.html" 
        style="display:none; position:absolute; top:0; left:0; 
               width:1280px; height:720px; border:none;">
</iframe>
```

---

## 关卡选择逻辑

根据地图格子 ID 或难度选择关卡：

```python
# 后端逻辑（action_dungeon.py）
def select_level_type(difficulty: int, node_id: int) -> str:
    """
    根据难度和格子 ID 选择关卡类型
    """
    level_types = ["speed_run", "castle_battle", "platform_challenge", "boss_battle"]
    
    # 简单难度：只出现跑酷和战斗
    if difficulty == 1:
        return random.choice(level_types[:2])
    
    # 中等难度：加入平台跳跃
    elif difficulty == 2:
        return random.choice(level_types[:3])
    
    # 困难难度：可能遇到 Boss
    else:
        if node_id % 5 == 0:  # 每 5 个格子可能遇到 Boss
            return "boss_battle"
        else:
            return random.choice(level_types)
```

---

## 下一步

1. ✅ 创建 Godot 项目配置
2. ✅ 创建玩家基础脚本
3. ✅ 创建敌人基础脚本
4. ✅ 创建 API 客户端
5. ⏳ 创建 4 个关卡场景
6. ⏳ 创建关卡具体实现
7. ⏳ Web 导出和集成测试
