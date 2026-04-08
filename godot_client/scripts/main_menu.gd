extends Control

## 主菜单场景 - 华夏游录
## 开始游戏后进入中国地图，通过掷骰子移动触发关卡

var api_client: APIClient

# 起点城市列表（5 个）
var start_cities = [
	{"city_id": "beijing", "name": "北京", "difficulty": 5},
	{"city_id": "shanghai", "name": "上海", "difficulty": 4},
	{"city_id": "guangzhou", "name": "广州", "difficulty": 3},
	{"city_id": "chengdu", "name": "成都", "difficulty": 4},
	{"city_id": "xian", "name": "西安", "difficulty": 4}
]

func _ready() -> void:
	# 创建 API 客户端
	api_client = APIClient.new()
	add_child(api_client)
	
	# 初始化起点城市选择按钮
	setup_city_buttons()
	
	# 连接按钮
	var start_button = $MarginContainer/VBoxContainer/StartButton
	if start_button:
		start_button.pressed.connect(_on_start_button_pressed)
	
	var quit_button = $MarginContainer/VBoxContainer/QuitButton
	if quit_button:
		quit_button.pressed.connect(_on_quit_button_pressed)

func setup_city_buttons() -> void:
	"""创建起点城市选择按钮"""
	var city_grid = $MarginContainer/VBoxContainer/CitySelectGrid
	if not city_grid:
		return
	
	# 清除现有按钮
	for child in city_grid.get_children():
		child.queue_free()
	
	# 创建城市按钮
	for city in start_cities:
		var button = Button.new()
		button.set_text(city["name"])
		button.set_custom_minimum_size(Vector2(150, 40))
		button.pressed.connect(_on_city_button_pressed.bind(city))
		city_grid.add_child(button)

func _on_start_button_pressed() -> void:
	"""开始游戏按钮 - 直接进入地图（默认北京为起点）"""
	print("开始游戏！默认起点：北京")
	
	# 设置 API 客户端参数
	var timestamp = str(int(Time.get_unix_time_from_system()))
	api_client.save_id = "save_" + timestamp
	api_client.node_id = 0  # 初始位置
	
	# 默认起点城市
	var default_city = {"city_id": "beijing", "name": "北京", "difficulty": 5}
	
	# 加载中国地图场景
	var map_scene = load("res://scenes/MapScene.tscn")
	if map_scene:
		var instance = map_scene.instantiate()
		instance.start_city = default_city
		get_tree().change_scene_to_packed(map_scene)

func _on_city_button_pressed(city: Dictionary) -> void:
	"""城市按钮点击 - 开始游戏"""
	print("选择起点城市：", city["name"], " 难度：", city["difficulty"])
	
	# 设置 API 客户端参数
	var timestamp = str(int(Time.get_unix_time_from_system()))
	api_client.save_id = "save_" + timestamp
	api_client.node_id = 0  # 初始位置
	
	# 传递起始城市给地图场景
	var map_scene = load("res://scenes/MapScene.tscn")
	if map_scene:
		var instance = map_scene.instantiate()
		instance.start_city = city
		get_tree().change_scene_to_packed(map_scene)

func _on_quit_button_pressed() -> void:
	"""退出游戏"""
	get_tree().quit()

func show_message(message: String) -> void:
	"""显示消息"""
	print("提示：", message)
	# TODO: 在 UI 上显示消息提示框
