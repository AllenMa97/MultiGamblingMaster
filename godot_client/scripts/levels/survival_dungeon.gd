extends "res://scripts/base_dungeon.gd"

# 生存关卡配置
var survival_config = {
	"type": "survival",
	"difficulty": 3,
	"survival_type": "desert",
	"wave_count": 10,
	"enemy_spawn_rate": 3.0,
	"time_limit": 600.0,
	"player_health": 100
}

# 生存数据
var survival_data = {
	"wave": 0,
	"enemies_defeated": 0,
	"current_health": 100,
	"survival_time": 0.0,
	"powerups_collected": 0
}

# 信号
signal wave_started(wave_number: int)
signal wave_cleared(wave_number: int)
signal player_health_changed(health: int)
signal survival_complete(success: bool)

func _ready():
	super._ready()
	setup_survival_level()

# 设置生存关卡
func setup_survival_level():
	var level_name = get_level_name()
	match level_name:
		"沙漠求生":
			init_desert_survival()
		"林海雪原":
			init_snow_survival()
		"海岛求生":
			init_island_survival()
		"秘境求生":
			init_mystic_survival()
		_:
			init_generic_survival()

# 初始化沙漠生存
func init_desert_survival():
	survival_config["survival_type"] = "desert"
	survival_config["difficulty"] = 4
	survival_config["wave_count"] = 10
	survival_config["enemy_spawn_rate"] = 2.5
	
	# 设置场景
	setup_desert_scene()
	spawn_enemy_loop()

# 初始化雪地生存
func init_snow_survival():
	survival_config["survival_type"] = "snow"
	survival_config["difficulty"] = 5
	survival_config["wave_count"] = 12
	survival_config["enemy_spawn_rate"] = 2.0
	
	setup_snow_scene()
	spawn_enemy_loop()

# 初始化海岛生存
func init_island_survival():
	survival_config["survival_type"] = "island"
	survival_config["difficulty"] = 3
	survival_config["wave_count"] = 8
	survival_config["enemy_spawn_rate"] = 3.5
	
	setup_island_scene()
	spawn_enemy_loop()

# 初始化秘境生存
func init_mystic_survival():
	survival_config["survival_type"] = "mystic"
	survival_config["difficulty"] = 5
	survival_config["wave_count"] = 15
	survival_config["enemy_spawn_rate"] = 1.5
	
	setup_mystic_scene()
	spawn_enemy_loop()

# 初始化通用生存
func init_generic_survival():
	survival_config["survival_type"] = "generic"
	survival_config["wave_count"] = 10
	setup_generic_scene()
	spawn_enemy_loop()

# 设置沙漠场景
func setup_desert_scene():
	# 设置背景
	var bg = get_node_or_null("Background")
	if bg:
		bg.color = Color(0.9, 0.7, 0.4)  # 沙漠黄色
	
	# 创建沙丘障碍物
	create_desert_obstacles()

# 设置雪地场景
func setup_snow_scene():
	var bg = get_node_or_null("Background")
	if bg:
		bg.color = Color(0.8, 0.9, 1.0)  # 雪地白色
	
	create_snow_obstacles()

# 设置海岛场景
func setup_island_scene():
	var bg = get_node_or_null("Background")
	if bg:
		bg.color = Color(0.4, 0.7, 1.0)  # 海洋蓝色
	
	create_island_obstacles()

# 设置秘境场景
func setup_mystic_scene():
	var bg = get_node_or_null("Background")
	if bg:
		bg.color = Color(0.3, 0.2, 0.5)  # 神秘紫色
	
	create_mystic_obstacles()

# 设置通用场景
func setup_generic_scene():
	pass

# 创建沙漠障碍物
func create_desert_obstacles():
	# 创建仙人掌、岩石等
	for i in range(10):
		var obstacle = create_obstacle("cactus")
		obstacle.position = Vector2(randf_range(100, 1800), randf_range(200, 800))

# 创建雪地障碍物
func create_snow_obstacles():
	# 创建冰山、雪堆
	for i in range(12):
		var obstacle = create_obstacle("iceberg")
		obstacle.position = Vector2(randf_range(100, 1800), randf_range(200, 800))

# 创建海岛障碍物
func create_island_obstacles():
	# 创建棕榈树、礁石
	for i in range(8):
		var obstacle = create_obstacle("palm_tree")
		obstacle.position = Vector2(randf_range(100, 1800), randf_range(200, 800))

# 创建秘境障碍物
func create_mystic_obstacles():
	# 创建神秘石柱、水晶
	for i in range(15):
		var obstacle = create_obstacle("mystic_crystal")
		obstacle.position = Vector2(randf_range(100, 1800), randf_range(200, 800))

# 创建障碍物
func create_obstacle(type: String) -> Node2D:
	var obstacle = Node2D.new()
	var sprite = Sprite2D.new()
	
	match type:
		"cactus":
			sprite.texture = load("res://assets/obstacles/cactus.png")
		"iceberg":
			sprite.texture = load("res://assets/obstacles/iceberg.png")
		"palm_tree":
			sprite.texture = load("res://assets/obstacles/palm_tree.png")
		"mystic_crystal":
			sprite.texture = load("res://assets/obstacles/mystic_crystal.png")
	
	obstacle.add_child(sprite)
	add_child(obstacle)
	return obstacle

# 生成敌人循环
func spawn_enemy_loop():
	while is_level_active and survival_data["wave"] < survival_config["wave_count"]:
		survival_data["wave"] += 1
		wave_started.emit(survival_data["wave"])
		
		# 每波生成多个敌人
		var enemy_count = survival_data["wave"] + 2
		for i in range(enemy_count):
			spawn_enemy()
			await get_tree().create_timer(survival_config["enemy_spawn_rate"]).timeout
		
		# 等待这波敌人被清理
		await check_wave_cleared()
		wave_cleared.emit(survival_data["wave"])
	
	# 所有波次完成
	if survival_data["enemies_defeated"] >= survival_config["wave_count"] * 3:
		survival_complete.emit(true)
		complete_level(true)
	else:
		survival_complete.emit(false)
		complete_level(false)

# 生成单个敌人
func spawn_enemy():
	var enemy = load("res://scenes/enemy.tscn").instantiate() if ResourceLoader.exists("res://scenes/enemy.tscn") else Node2D.new()
	
	# 根据生存类型设置敌人外观
	match survival_config["survival_type"]:
		"desert":
			enemy.set_meta("type", "desert_monster")
		"snow":
			enemy.set_meta("type", "snow_beast")
		"island":
			enemy.set_meta("type", "island_crab")
		"mystic":
			enemy.set_meta("type", "mystic_spirit")
		_:
			enemy.set_meta("type", "generic_enemy")
	
	# 随机生成位置
	var spawn_x = randf_range(100, 1800)
	enemy.position = Vector2(spawn_x, -50)
	
	add_child(enemy)
	
	# 敌人向玩家移动
	move_enemy_to_player(enemy)

# 敌人向玩家移动
func move_enemy_to_player(enemy: Node2D):
	var tween = create_tween()
	var player_pos = Vector2(960, 540)  # 假设玩家在屏幕中央
	tween.tween_property(enemy, "position:y", player_pos.y, 3.0)
	tween.tween_callback(_on_enemy_reached_player.bind(enemy))

# 敌人到达玩家位置
func _on_enemy_reached_player(enemy: Node2D):
	# 对玩家造成伤害
	survival_data["current_health"] -= 10
	player_health_changed.emit(survival_data["current_health"])
	
	if survival_data["current_health"] <= 0:
		complete_level(false)
	
	enemy.queue_free()

# 检查这波是否清理完成
func check_wave_cleared():
	while true:
		var enemy_count = 0
		for child in get_children():
			if child.name.contains("Enemy"):
				enemy_count += 1
		
		if enemy_count == 0:
			break
		
		await get_tree().create_timer(1.0).timeout

# 玩家攻击敌人
func player_attack_enemy(enemy: Node2D, damage: int):
	# 减少敌人血量
	var enemy_health = enemy.get_meta("health") if enemy.has_meta("health") else 30
	enemy_health -= damage
	enemy.set_meta("health", enemy_health)
	
	if enemy_health <= 0:
		survival_data["enemies_defeated"] += 1
		enemy.queue_free()

# 更新计时器
func _process(delta):
	if is_level_active:
		survival_data["survival_time"] += delta
		survival_config["time_limit"] -= delta
		
		if survival_config["time_limit"] <= 0:
			complete_level(false)

# 完成关卡
func complete_level(success: bool):
	is_level_active = false
	level_result["success"] = success
	level_result["wave_reached"] = survival_data["wave"]
	level_result["enemies_defeated"] = survival_data["enemies_defeated"]
	level_result["survival_time"] = survival_data["survival_time"]
	level_result["final_health"] = survival_data["current_health"]
	
	send_level_result_to_backend()
	show_result_ui(success)

# 显示结果 UI
func show_result_ui(success: bool):
	var result_panel = Control.new()
	result_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	
	var bg = ColorRect.new()
	bg.color = Color(0, 0, 0, 0.9)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	result_panel.add_child(bg)
	
	var label = Label.new()
	label.text = "生存成功！\n坚持了 %.1f 秒\n击败 %d 个敌人" % [survival_data["survival_time"], survival_data["enemies_defeated"]] if success else "生存失败"
	label.add_theme_font_size_override("font_size", 48)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	result_panel.add_child(label)
	
	get_tree().current_scene.add_child(result_panel)
	
	await get_tree().create_timer(3.0).timeout
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

# 发送结果到后端
func send_level_result_to_backend():
	pass

# 获取关卡名称
func get_level_name() -> String:
	var level_data = get_current_level_data()
	if level_data:
		return level_data.get("name", "")
	return ""

func get_current_level_data() -> Dictionary:
	return {}
