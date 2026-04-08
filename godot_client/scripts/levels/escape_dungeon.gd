extends "res://scripts/base_dungeon.gd"

# 逃亡关卡配置
var escape_config = {
	"type": "escape",
	"difficulty": 4,
	"escape_type": "ancient_city",
	"time_limit": 180.0,
	"distance_to_escape": 1000,
	"pursuer_speed": 150.0
}

# 逃亡数据
var escape_data = {
	"current_distance": 0,
	"pursuer_distance": 0,
	"obstacles_passed": 0,
	"powerups_collected": 0,
	"collisions": 0
}

# 信号
signal distance_changed(current: int, total: int)
signal pursuer_distance_changed(distance: int)
signal escape_complete(success: bool)

func _ready():
	super._ready()
	setup_escape_level()

# 设置逃亡关卡
func setup_escape_level():
	var level_name = get_level_name()
	match level_name:
		"三星堆古城逃亡":
			init_ancient_city_escape()
		"昆仑天界逃亡":
			init_heaven_escape()
		"秦陵逃亡":
			init_tomb_escape()
		_:
			init_generic_escape()

# 初始化古城逃亡
func init_ancient_city_escape():
	escape_config["escape_type"] = "ancient_city"
	escape_config["difficulty"] = 5
	escape_config["time_limit"] = 180.0
	escape_config["pursuer_speed"] = 140.0
	
	setup_ancient_city_scene()
	start_escape()

# 初始化天界逃亡
func init_heaven_escape():
	escape_config["escape_type"] = "heaven"
	escape_config["difficulty"] = 6
	escape_config["time_limit"] = 200.0
	escape_config["pursuer_speed"] = 160.0
	
	setup_heaven_scene()
	start_escape()

# 初始化陵墓逃亡
func init_tomb_escape():
	escape_config["escape_type"] = "tomb"
	escape_config["difficulty"] = 4
	escape_config["time_limit"] = 150.0
	escape_config["pursuer_speed"] = 130.0
	
	setup_tomb_scene()
	start_escape()

# 初始化通用逃亡
func init_generic_escape():
	escape_config["escape_type"] = "generic"
	escape_config["time_limit"] = 180.0
	setup_generic_scene()
	start_escape()

# 设置古城场景
func setup_ancient_city_scene():
	# 设置背景
	var bg = get_node_or_null("Background")
	if bg:
		bg.color = Color(0.6, 0.5, 0.4)  # 古城土黄色
	
	# 创建古城建筑、城墙等障碍物
	create_ancient_city_obstacles()

# 设置天界场景
func setup_heaven_scene():
	var bg = get_node_or_null("Background")
	if bg:
		bg.color = Color(0.7, 0.8, 1.0)  # 天界淡蓝色
	
	create_heaven_obstacles()

# 设置陵墓场景
func setup_tomb_scene():
	var bg = get_node_or_null("Background")
	if bg:
		bg.color = Color(0.3, 0.3, 0.3)  # 陵墓深灰色
	
	create_tomb_obstacles()

# 设置通用场景
func setup_generic_scene():
	pass

# 创建古城障碍物
func create_ancient_city_obstacles():
	# 创建城墙、石柱、青铜器等
	var obstacle_types = ["wall", "pillar", "bronze_vessel", "stone_statue"]
	for i in range(30):
		var type = obstacle_types[randi() % obstacle_types.size()]
		var obstacle = create_obstacle(type)
		obstacle.position = Vector2(200 + i * 60, randf_range(400, 700))

# 创建天界障碍物
func create_heaven_obstacles():
	# 创建云朵、仙山、天宫建筑
	var obstacle_types = ["cloud", "fairy_mountain", "heaven_palace"]
	for i in range(35):
		var type = obstacle_types[randi() % obstacle_types.size()]
		var obstacle = create_obstacle(type)
		obstacle.position = Vector2(200 + i * 55, randf_range(300, 800))

# 创建陵墓障碍物
func create_tomb_obstacles():
	# 创建兵马俑、机关、墓室门
	var obstacle_types = ["terracotta", "trap", "tomb_door", "coffin"]
	for i in range(40):
		var type = obstacle_types[randi() % obstacle_types.size()]
		var obstacle = create_obstacle(type)
		obstacle.position = Vector2(200 + i * 50, randf_range(400, 700))

# 创建障碍物
func create_obstacle(type: String) -> Node2D:
	var obstacle = Node2D.new()
	var sprite = Sprite2D.new()
	
	match type:
		"wall":
			sprite.texture = load("res://assets/obstacles/ancient_wall.png")
		"pillar":
			sprite.texture = load("res://assets/obstacles/stone_pillar.png")
		"bronze_vessel":
			sprite.texture = load("res://assets/obstacles/bronze_vessel.png")
		"stone_statue":
			sprite.texture = load("res://assets/obstacles/stone_statue.png")
		"cloud":
			sprite.texture = load("res://assets/obstacles/cloud.png")
		"fairy_mountain":
			sprite.texture = load("res://assets/obstacles/fairy_mountain.png")
		"heaven_palace":
			sprite.texture = load("res://assets/obstacles/heaven_palace.png")
		"terracotta":
			sprite.texture = load("res://assets/obstacles/terracotta.png")
		"trap":
			sprite.texture = load("res://assets/obstacles/trap.png")
		"tomb_door":
			sprite.texture = load("res://assets/obstacles/tomb_door.png")
		"coffin":
			sprite.texture = load("res://assets/obstacles/coffin.png")
	
	obstacle.add_child(sprite)
	obstacle.set_meta("type", type)
	add_child(obstacle)
	return obstacle

# 开始逃亡
func start_escape():
	# 创建 UI
	create_escape_ui()
	
	# 创建玩家
	create_player()
	
	# 创建追逐者
	create_pursuer()
	
	# 开始倒计时
	await get_tree().create_timer(2.0).timeout
	
	# 开始自动奔跑
	start_auto_run()

# 创建逃亡 UI
func create_escape_ui():
	# 创建主面板
	var escape_panel = Control.new()
	escape_panel.name = "EscapePanel"
	escape_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	escape_panel.add_to_group("ui_layer")
	
	# 距离显示
	var distance_label = Label.new()
	distance_label.name = "DistanceLabel"
	distance_label.text = "距离：%d / %d" % [0, escape_config["distance_to_escape"]]
	distance_label.add_theme_font_size_override("font_size", 28)
	distance_label.position = Vector2(50, 50)
	escape_panel.add_child(distance_label)
	
	# 追逐者距离显示
	var pursuer_label = Label.new()
	pursuer_label.name = "PursuerLabel"
	pursuer_label.text = "追兵距离：%dm" % escape_data["pursuer_distance"]
	pursuer_label.add_theme_font_size_override("font_size", 24)
	pursuer_label.position = Vector2(50, 90)
	escape_panel.add_child(pursuer_label)
	
	# 计时器
	var timer_label = Label.new()
	timer_label.name = "TimerLabel"
	timer_label.text = "时间：%.1f" % escape_config["time_limit"]
	timer_label.add_theme_font_size_override("font_size", 24)
	timer_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	timer_label.offset_top = 50
	timer_label.offset_right = -20
	escape_panel.add_child(timer_label)
	
	# 障碍物计数
	var obstacle_label = Label.new()
	obstacle_label.name = "ObstacleLabel"
	obstacle_label.text = "通过障碍：%d" % escape_data["obstacles_passed"]
	obstacle_label.add_theme_font_size_override("font_size", 20)
	obstacle_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	obstacle_label.offset_top = 90
	obstacle_label.offset_right = -20
	escape_panel.add_child(obstacle_label)
	
	get_tree().current_scene.add_child(escape_panel)

# 创建玩家
func create_player():
	var player = CharacterBody2D.new()
	player.name = "Player"
	player.position = Vector2(200, 540)
	
	# 添加碰撞体
	var collision = CollisionShape2D.new()
	var shape = RectangleShape2D.new()
	shape.size = Vector2(40, 60)
	collision.shape = shape
	player.add_child(collision)
	
	# 添加精灵
	var sprite = Sprite2D.new()
	sprite.texture = load("res://assets/characters/player_run.png")
	player.add_child(sprite)
	
	add_child(player)

# 创建追逐者
func create_pursuer():
	var pursuer = Node2D.new()
	pursuer.name = "Pursuer"
	pursuer.position = Vector2(100, 540)
	
	# 添加精灵
	var sprite = Sprite2D.new()
	sprite.texture = load("res://assets/enemies/pursuer.png")
	pursuer.add_child(sprite)
	
	add_child(pursuer)

# 开始自动奔跑
func start_auto_run():
	var player = get_node("Player")
	var pursuer = get_node("Pursuer")
	
	var run_speed = 200.0
	var camera_x = 0
	
	while is_level_active:
		# 玩家向前奔跑
		player.position.x += run_speed * get_process_delta_time()
		
		# 追逐者跟随
		if pursuer.position.x < player.position.x - escape_data["pursuer_distance"]:
			pursuer.position.x += escape_config["pursuer_speed"] * get_process_delta_time()
		
		# 更新摄像机位置
		camera_x = player.position.x - 400
		var camera = get_viewport().get_camera_2d()
		if camera:
			camera.position.x = camera_x
		
		# 更新已跑距离
		escape_data["current_distance"] = int(player.position.x - 200)
		distance_changed.emit(escape_data["current_distance"], escape_config["distance_to_escape"])
		
		# 更新追兵距离
		escape_data["pursuer_distance"] = int(player.position.x - pursuer.position.x)
		pursuer_distance_changed.emit(escape_data["pursuer_distance"])
		
		# 检查是否被追上
		if escape_data["pursuer_distance"] <= 0:
			escape_complete.emit(false)
			complete_level(false)
			return
		
		# 检查是否逃脱成功
		if escape_data["current_distance"] >= escape_config["distance_to_escape"]:
			escape_complete.emit(true)
			complete_level(true)
			return
		
		# 检测障碍物碰撞
		check_obstacle_collision(player)
		
		await get_tree().create_timer(0.016).timeout

# 检测障碍物碰撞
func check_obstacle_collision(player: CharacterBody2D):
	for child in get_children():
		if child.name.contains("Obstacle") or (child.has_meta("type") and child.get_meta("type") in ["wall", "pillar", "trap", "cloud"]):
			var player_rect = Rect2(player.position - Vector2(20, 30), Vector2(40, 60))
			var obstacle_rect = Rect2(child.position - Vector2(20, 30), Vector2(40, 60))
			
			if player_rect.intersects(obstacle_rect):
				# 撞到障碍物
				escape_data["collisions"] += 1
				escape_data["obstacles_passed"] += 1
				
				# 减速效果
				await get_tree().create_timer(0.5).timeout
				
				child.queue_free()
				break

# 更新计时器
func _process(delta):
	if is_level_active:
		escape_config["time_limit"] -= delta
		
		if escape_config["time_limit"] <= 0:
			# 时间到，检查是否被追上
			if escape_data["pursuer_distance"] <= 50:
				complete_level(false)
			else:
				# 给予额外时间
				escape_config["time_limit"] = 30.0
		
		# 更新 UI
		var timer_label = get_node_or_null("EscapePanel/TimerLabel")
		if timer_label:
			timer_label.text = "时间：%.1f" % escape_config["time_limit"]
		
		var distance_label = get_node_or_null("EscapePanel/DistanceLabel")
		if distance_label:
			distance_label.text = "距离：%d / %d" % [escape_data["current_distance"], escape_config["distance_to_escape"]]
		
		var pursuer_label = get_node_or_null("EscapePanel/PursuerLabel")
		if pursuer_label:
			pursuer_label.text = "追兵距离：%dm" % escape_data["pursuer_distance"]
		
		var obstacle_label = get_node_or_null("EscapePanel/ObstacleLabel")
		if obstacle_label:
			obstacle_label.text = "通过障碍：%d" % escape_data["obstacles_passed"]

# 完成关卡
func complete_level(success: bool):
	is_level_active = false
	level_result["success"] = success
	level_result["escape_time"] = escape_config["time_limit"]
	level_result["collisions"] = escape_data["collisions"]
	level_result["obstacles_passed"] = escape_data["obstacles_passed"]
	
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
	if success:
		label.text = "逃亡成功！\n通过障碍：%d\n碰撞次数：%d" % [escape_data["obstacles_passed"], escape_data["collisions"]]
	else:
		label.text = "逃亡失败\n被追兵抓住了！"
	
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
