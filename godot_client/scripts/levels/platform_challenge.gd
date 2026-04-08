extends BaseDungeon

## 关卡 3：平台跳跃挑战
## 目标：到达顶层

@export var finish_height: float = -1500.0  # 终点 Y 坐标（向上为负）
@export var player_start_position: Vector2 = Vector2(640, 600)

var has_reached_top: bool = false

func init_level() -> void:
	level_type = "platform_challenge"
	show_message("平台跳跃 - 到达顶层！", 3.0)
	
	if player:
		player.global_position = player_start_position
		player.health_changed.connect(_on_player_health_changed)

func start_dungeon() -> void:
	super.start_dungeon()
	show_message("使用所有技巧到达最高点！", 2.0)

func check_victory() -> bool:
	# 检查玩家是否到达指定高度
	if player and player.global_position.y <= finish_height:
		has_reached_top = true
		return true
	return false

func check_defeat() -> bool:
	# 玩家掉出地图（深渊）
	if player and player.global_position.y > 1000:
		return true
	
	# 玩家死亡
	if player and player.health <= 0:
		return true
	
	return false

func _on_player_health_changed(new_health: int) -> void:
	update_health_bar(new_health, player.max_health)

# 平台类型枚举（用于在编辑器中标记）
enum PlatformType {
	FIXED,        # 固定平台
	MOVING,       # 移动平台
	DISAPPEARING, # 消失平台
	BOUNCE,       # 弹跳垫
	CONVEYOR,     # 传送带
}

# 以下需要在 Godot 编辑器中布置：
# 1. 固定平台 - StaticBody2D
# 2. 移动平台 - Path2D + PathFollow2D + Platform2D
# 3. 消失平台 - 自定义脚本检测玩家站立
# 4. 弹跳垫 - Area2D + 施加冲量
# 5. 传送带 - Area2D + 施加水平力
# 6. 风扇 - Area2D + 施加向上力
