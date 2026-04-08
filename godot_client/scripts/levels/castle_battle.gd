extends BaseDungeon

## 关卡 2：城堡战斗
## 目标：击败所有敌人

var enemies_to_defeat: int = 0
var current_wave: int = 0
var total_waves: int = 3

@export var wave_enemies: Array = [
	[2, 0, 0],  # 第 1 波：2 个普通敌人
	[3, 1, 0],  # 第 2 波：3 个普通 + 1 个远程
	[1, 2, 1],  # 第 3 波：1 个精英 + 2 个普通
]

func init_level() -> void:
	level_type = "castle_battle"
	show_message("城堡战斗 - 消灭所有敌人！", 3.0)
	
	if player:
		player.global_position = Vector2(200, 500)
		player.health_changed.connect(_on_player_health_changed)

func start_dungeon() -> void:
	super.start_dungeon()
	start_wave(0)

func start_wave(wave_index: int) -> void:
	"""开始一波敌人"""
	if wave_index >= wave_enemies.size():
		# 所有波次完成
		complete_dungeon()
		return
	
	current_wave = wave_index
	var wave_config = wave_enemies[wave_index]
	
	# 生成敌人（需要在场景中预置敌人节点或使用资源生成）
	spawn_enemies(wave_config[0], "normal")  # 普通敌人
	spawn_enemies(wave_config[1], "ranged")  # 远程敌人
	spawn_enemies(wave_config[2], "elite")   # 精英敌人
	
	show_message("第 %d 波敌人！" % (wave_index + 1), 2.0)

func spawn_enemies(count: int, enemy_type: String) -> void:
	"""生成敌人（简化版，实际需要在场景中布置）"""
	# 这里仅做示例，实际应该在场景中预置敌人节点
	for i in range(count):
		var enemy = preload("res://scenes/enemies/basic_enemy.tscn").instantiate() if enemy_type == "normal" else null
		if enemy:
			add_child(enemy)
			enemy.global_position = Vector2(800 + i * 100, 500)
			enemy.died.connect(_on_enemy_died)
			enemies_to_defeat += 1

func check_victory() -> bool:
	# 所有敌人都被打败
	return enemies_to_defeat <= 0 and current_wave >= total_waves - 1

func check_defeat() -> bool:
	# 玩家死亡
	if player and player.health <= 0:
		return true
	return false

func _on_enemy_died() -> void:
	"""敌人死亡处理"""
	enemies_to_defeat -= 1
	
	if enemies_to_defeat <= 0:
		# 当前波次完成，开始下一波
		await get_tree().create_timer(1.0).timeout
		start_wave(current_wave + 1)

func _on_player_health_changed(new_health: int) -> void:
	update_health_bar(new_health, player.max_health)
