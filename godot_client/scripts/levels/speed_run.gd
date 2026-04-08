extends BaseDungeon

## 关卡 1：极速跑酷
## 目标：在限定时间内到达终点，躲避陷阱

@export var time_limit: float = 60.0
@export var finish_line_position: float = 3000.0

var has_reached_finish: bool = false

func init_level() -> void:
	level_type = "speed_run"
	show_message("极速跑酷 - 到达终点！", 3.0)
	
	# 设置玩家起始位置
	if player:
		player.global_position = Vector2(100, 500)
		player.health_changed.connect(_on_player_health_changed)

func start_dungeon() -> void:
	super.start_dungeon()
	show_message("开始！到达终点旗杆", 2.0)

func check_victory() -> bool:
	# 检查玩家是否到达终点
	if player and player.global_position.x >= finish_line_position:
		has_reached_finish = true
		return true
	return false

func check_defeat() -> bool:
	# 检查时间是否耗尽
	var elapsed = (Time.get_ticks_msec() / 1000.0) - start_time
	if elapsed >= time_limit:
		return true
	
	# 检查玩家是否死亡
	if player and player.health <= 0:
		return true
	
	return false

func _process(delta: float) -> void:
	if is_dungeon_active:
		# 更新剩余时间显示
		var elapsed = (Time.get_ticks_msec() / 1000.0) - start_time
		var remaining = time_limit - elapsed
		if timer_label:
			timer_label.set_text("时间：%.1f / %.1f" % [remaining, time_limit])
			
			# 时间警告
			if remaining <= 10.0:
				timer_label.set("theme_override_colors/font_color", Color.RED)
			else:
				timer_label.set("theme_override_colors/font_color", Color.WHITE)
	
	super._process(delta)

func _on_player_health_changed(new_health: int) -> void:
	update_health_bar(new_health, player.max_health)

# 以下方法用于在 Godot 编辑器中手动布置关卡
# 实际使用时需要在场景中放置：
# 1. 玩家节点（Player.tscn）
# 2. 平台（StaticBody2D + CollisionShape2D）
# 3. 陷阱（Area2D + Sprite）
# 4. 终点旗杆（Area2D）
# 5. 移动平台（Path2D + PathFollow2D）
