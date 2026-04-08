extends Node2D

## 中国地图场景
## 玩家在此场景中掷骰子移动，触发城市关卡

var api_client: APIClient
var current_city_index: int = 0
var dice_rolled: bool = false
var start_city: Dictionary = {}  # 起始城市

# 从 JSON 文件加载城市坐标
var cities = []

func _load_cities() -> void:
	"""加载城市数据"""
	var file = FileAccess.open("res://data/china_map.json", FileAccess.READ)
	if file:
		var json_data = JSON.parse_string(file.get_as_text())
		if json_data and json_data.has("cities"):
			var map_width = json_data.get("width", 2400)
			var map_height = json_data.get("height", 2000)
			
			for city in json_data["cities"]:
				# 将经纬度转换为像素坐标
				var lon = city["lon"]
				var lat = city["lat"]
				
				# 中国地图范围：东经 73-135 度，北纬 18-54 度
				var x = (lon - 73) / (135 - 73) * map_width
				var y = (54 - lat) / (54 - 18) * map_height
				
				cities.append({
					"name": city["name"],
					"x": x,
					"y": y
				})
			print("成功加载 %d 个城市" % cities.size())
		file.close()

func _ready() -> void:
	# 加载城市数据
	_load_cities()
	
	# 获取 API 客户端（从主菜单传递过来）
	api_client = $Player.get_node_or_null("APIClient")
	if not api_client:
		api_client = APIClient.new()
		$Player.add_child(api_client)
	
	# 连接按钮
	var dice_button = $DiceButton
	if dice_button:
		dice_button.pressed.connect(_on_dice_button_pressed)
	
	# 如果有起始城市，设置为当前位置
	if start_city and start_city.has("city_id"):
		# 查找对应的城市索引
		for i in range(cities.size()):
			if cities[i]["name"] == start_city["name"]:
				current_city_index = i
				break
	
	# 初始化玩家位置
	update_player_position()
	update_info()

func _on_dice_button_pressed() -> void:
	"""掷骰子"""
	dice_rolled = true
	var dice_result = randi() % 6 + 1  # 1-6 随机数
	
	# 显示骰子结果
	$DiceResult.text = "骰子：" + str(dice_result)
	
	# 移动玩家
	move_player(dice_result)
	
	# 2 秒后检查是否触发关卡
	await get_tree().create_timer(2.0).timeout
	check_city_event()
	
	# 重置骰子状态，允许再次投掷
	dice_rolled = false

func move_player(steps: int) -> void:
	"""移动玩家"""
	current_city_index = (current_city_index + steps) % cities.size()
	update_player_position()
	update_info()

func update_player_position() -> void:
	"""更新玩家位置"""
	if current_city_index < cities.size():
		var target_city = cities[current_city_index]
		$Player.position = Vector2(target_city["x"], target_city["y"])

func update_info() -> void:
	"""更新玩家信息"""
	if current_city_index < cities.size():
		var city_name = cities[current_city_index]["name"]
		$PlayerInfo.text = "当前位置：" + city_name

func check_city_event() -> void:
	"""检查城市事件 - 进入关卡选择"""
	if current_city_index < cities.size():
		var city_name = cities[current_city_index]["name"]
		print("到达城市：" + city_name)
		
		show_message("到达 " + city_name + "！选择关卡类型：")
		
		# 显示关卡选择（3 秒后自动返回）
		await get_tree().create_timer(3.0).timeout
		
		# 临时实现：随机进入一个关卡类型
		var level_types = ["极速跑酷", "城堡战斗", "平台跳跃"]
		var random_type = level_types[randi() % level_types.size()]
		
		show_message("进入 " + city_name + " - " + random_type + " 关卡！")
		
		# 2 秒后显示关卡完成
		await get_tree().create_timer(2.0).timeout
		show_message("关卡完成！继续旅程")
		dice_rolled = false

func show_message(message: String) -> void:
	"""显示消息"""
	print("提示：", message)
	# TODO: 在 UI 上显示消息提示框
