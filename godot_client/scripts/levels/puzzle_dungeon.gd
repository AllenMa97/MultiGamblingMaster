extends "res://scripts/base_dungeon.gd"

# 解谜关卡配置
var puzzle_config = {
	"type": "puzzle",
	"difficulty": 1,
	"time_limit": 300.0,
	"hint_count": 3,
	"max_attempts": 5
}

# 谜题数据
var puzzle_data = {
	"current_puzzle": "",
	"answer": "",
	"player_input": "",
	"hints_used": 0,
	"attempts": 0
}

# 谜题类型枚举
enum PuzzleType {
	BRONZE_TREE,      # 青铜神树
	INSCRIPTION,      # 青铜铭文
	BRONZE_DING,      # 青铜鼎
	TANGKA,          # 唐卡
	CLASSIC_TEXT,    # 古籍
	PICTORIAL,       # 象形文字
	ASTRONOMY,       # 天文星象
	MUSIC_CODE       # 音乐密码
}

# 信号
signal puzzle_solved(success: bool)
signal hint_requested(hint_text: String)
signal attempt_made(remaining: int)

func _ready():
	super._ready()
	setup_puzzle_level()

# 设置谜题关卡
func setup_puzzle_level():
	var level_name = get_level_name()
	match level_name:
		"苏绣之谜":
			init_pictorial_puzzle()
		"迎客松之谜":
			init_pictorial_puzzle()
		"灵山大佛":
			init_pictorial_puzzle()
		"早茶之谜":
			init_pictorial_puzzle()
		"三国密码":
			init_astronomy_puzzle()
		"火锅之谜":
			init_pictorial_puzzle()
		"热干面之谜":
			init_pictorial_puzzle()
		"臭豆腐之谜":
			init_pictorial_puzzle()
		"青铜鼎之谜":
			init_inscription_puzzle()
		"青铜神树之谜":
			init_astronomy_puzzle()
		"藏经洞密码":
			init_classic_text_puzzle()
		"晋商票号":
			init_music_code_puzzle()
		"泰山石刻":
			init_inscription_puzzle()
		"冰灯之谜":
			init_pictorial_puzzle()
		"土楼之谜":
			init_pictorial_puzzle()
		"瑶池仙草":
			init_astronomy_puzzle()
		"狐火之谜":
			init_astronomy_puzzle()
		_:
			init_generic_puzzle()

# 初始化象形谜题
func init_pictorial_puzzle():
	puzzle_config["type"] = "pictorial"
	puzzle_config["difficulty"] = get_city_difficulty()
	puzzle_data["current_puzzle"] = "pictorial"
	
	# 创建谜题 UI
	create_puzzle_ui()
	load_pictorial_puzzle()

# 初始化铭文谜题
func init_inscription_puzzle():
	puzzle_config["type"] = "inscription"
	puzzle_data["current_puzzle"] = "inscription"
	create_puzzle_ui()
	load_inscription_puzzle()

# 初始化天文谜题
func init_astronomy_puzzle():
	puzzle_config["type"] = "astronomy"
	puzzle_data["current_puzzle"] = "astronomy"
	create_puzzle_ui()
	load_astronomy_puzzle()

# 初始化古籍谜题
func init_classic_text_puzzle():
	puzzle_config["type"] = "classic_text"
	puzzle_data["current_puzzle"] = "classic_text"
	create_puzzle_ui()
	load_classic_text_puzzle()

# 初始化音乐密码谜题
func init_music_code_puzzle():
	puzzle_config["type"] = "music_code"
	puzzle_data["current_puzzle"] = "music_code"
	create_puzzle_ui()
	load_music_code_puzzle()

# 初始化通用谜题
func init_generic_puzzle():
	puzzle_config["type"] = "generic"
	puzzle_data["current_puzzle"] = "generic"
	create_puzzle_ui()

# 创建谜题 UI
func create_puzzle_ui():
	# 创建谜题面板
	var puzzle_panel = Control.new()
	puzzle_panel.name = "PuzzlePanel"
	puzzle_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	puzzle_panel.add_to_group("ui_layer")
	
	# 背景
	var bg = ColorRect.new()
	bg.color = Color(0, 0, 0, 0.85)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	puzzle_panel.add_child(bg)
	
	# 谜题标题
	var title = Label.new()
	title.text = "解谜挑战"
	title.add_theme_font_size_override("font_size", 32)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	title.offset_bottom = 60
	puzzle_panel.add_child(title)
	
	# 谜题图片/图案区域
	var puzzle_image = TextureRect.new()
	puzzle_image.name = "PuzzleImage"
	puzzle_image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	puzzle_image.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	puzzle_image.offset_top = -150
	puzzle_image.offset_bottom = 150
	puzzle_image.offset_left = -200
	puzzle_image.offset_right = 200
	puzzle_panel.add_child(puzzle_image)
	
	# 提示按钮
	var hint_btn = Button.new()
	hint_btn.text = "请求提示 (%d)" % (puzzle_config["hint_count"] - puzzle_data["hints_used"])
	hint_btn.name = "HintButton"
	hint_btn.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	hint_btn.offset_top = -80
	hint_btn.offset_bottom = -40
	hint_btn.offset_left = -150
	hint_btn.offset_right = 150
	hint_btn.pressed.connect(_on_hint_button_pressed)
	puzzle_panel.add_child(hint_btn)
	
	# 输入区域（如果需要）
	var input_box = LineEdit.new()
	input_box.name = "InputBox"
	input_box.placeholder_text = "输入你的答案"
	input_box.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	input_box.offset_top = -30
	input_box.offset_bottom = 10
	input_box.offset_left = -150
	input_box.offset_right = 150
	puzzle_panel.add_child(input_box)
	
	# 提交按钮
	var submit_btn = Button.new()
	submit_btn.text = "提交答案"
	submit_btn.name = "SubmitButton"
	submit_btn.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	submit_btn.offset_top = 20
	submit_btn.offset_bottom = 60
	submit_btn.offset_left = -150
	submit_btn.offset_right = 150
	submit_btn.pressed.connect(_on_submit_button_pressed)
	puzzle_panel.add_child(submit_btn)
	
	# 计时器
	var timer_label = Label.new()
	timer_label.name = "TimerLabel"
	timer_label.text = "时间：%.1f" % puzzle_config["time_limit"]
	timer_label.add_theme_font_size_override("font_size", 24)
	timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timer_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	timer_label.offset_top = 70
	timer_label.offset_right = -20
	puzzle_panel.add_child(timer_label)
	
	get_tree().current_scene.add_child(puzzle_panel)

# 加载象形谜题
func load_pictorial_puzzle():
	var puzzle_image = get_node_or_null("PuzzlePanel/PuzzleImage")
	if puzzle_image:
		# 根据城市加载不同的图案
		var city_id = get_city_id()
		match city_id:
			"suzhou":
				puzzle_image.texture = load("res://assets/puzzles/suzhou_embroidery.png")
				puzzle_data["answer"] = "凤凰"
			"huangshan":
				puzzle_image.texture = load("res://assets/puzzles/guest_greeting_pine.png")
				puzzle_data["answer"] = "迎客"
			"wuxi":
				puzzle_image.texture = load("res://assets/puzzles/lingshan_buddha.png")
				puzzle_data["answer"] = "佛"
			_:
				puzzle_image.texture = load("res://assets/puzzles/generic_pattern.png")
				puzzle_data["answer"] = "龙"

# 加载铭文谜题
func load_inscription_puzzle():
	var puzzle_image = get_node_or_null("PuzzlePanel/PuzzleImage")
	if puzzle_image:
		var city_id = get_city_id()
		match city_id:
			"xian":
				puzzle_image.texture = load("res://assets/puzzles/bronze_inscription.png")
				puzzle_data["answer"] = "王"
			"taishan":
				puzzle_image.texture = load("res://assets/puzzles/taishan_stele.png")
				puzzle_data["answer"] = "泰山"

# 加载天文谜题
func load_astronomy_puzzle():
	var puzzle_image = get_node_or_null("PuzzlePanel/PuzzleImage")
	if puzzle_image:
		var city_id = get_city_id()
		match city_id:
			"chengdu":
				puzzle_image.texture = load("res://assets/puzzles/bagua_array.png")
				puzzle_data["answer"] = "生门"
			"sanxingdui":
				puzzle_image.texture = load("res://assets/puzzles/bronze_tree_stars.png")
				puzzle_data["answer"] = "北斗"
			"kunlun":
				puzzle_image.texture = load("res://assets/puzzles/yaochi_stars.png")
				puzzle_data["answer"] = "瑶池"

# 加载古籍谜题
func load_classic_text_puzzle():
	var puzzle_image = get_node_or_null("PuzzlePanel/PuzzleImage")
	if puzzle_image:
		puzzle_image.texture = load("res://assets/puzzles/ancient_text.png")
		puzzle_data["answer"] = "道"

# 加载音乐密码谜题
func load_music_code_puzzle():
	var puzzle_image = get_node_or_null("PuzzlePanel/PuzzleImage")
	if puzzle_image:
		puzzle_image.texture = load("res://assets/puzzles/music_code.png")
		puzzle_data["answer"] = "宫商角徵羽"

# 请求提示
func _on_hint_button_pressed():
	if puzzle_data["hints_used"] < puzzle_config["hint_count"]:
		puzzle_data["hints_used"] += 1
		var hint_text = get_hint_for_puzzle(puzzle_data["hints_used"])
		hint_requested.emit(hint_text)
		
		# 更新按钮文本
		var hint_btn = get_node_or_null("PuzzlePanel/HintButton")
		if hint_btn:
			hint_btn.text = "请求提示 (%d)" % (puzzle_config["hint_count"] - puzzle_data["hints_used"])

# 提交答案
func _on_submit_button_pressed():
	var input_box = get_node_or_null("PuzzlePanel/InputBox")
	if input_box:
		puzzle_data["player_input"] = input_box.text
		puzzle_data["attempts"] += 1
		
		var success = check_answer()
		if success:
			puzzle_solved.emit(true)
			complete_level(true)
		else:
			var remaining = puzzle_config["max_attempts"] - puzzle_data["attempts"]
			attempt_made.emit(remaining)
			
			if remaining <= 0:
				complete_level(false)
			else:
				input_box.text = ""

# 检查答案
func check_answer() -> bool:
	var player_input = puzzle_data["player_input"].strip_edges()
	var correct_answer = puzzle_data["answer"]
	
	# 模糊匹配（允许一定误差）
	return player_answer_matches_correct(player_input, correct_answer)

# 答案匹配逻辑
func player_answer_matches_correct(player: String, correct: String) -> bool:
	# 完全匹配
	if player == correct:
		return true
	
	# 包含匹配
	if correct in player or player in correct:
		return true
	
	# 拼音匹配（简化版）
	if player.substr(0, 1) == correct.substr(0, 1):
		return true
	
	return false

# 获取提示
func get_hint_for_puzzle(hint_level: int) -> String:
	match puzzle_data["current_puzzle"]:
		"pictorial":
			match hint_level:
				1:
					return "观察图案的整体形状"
				2:
					return "注意图案中的关键元素"
				3:
					return "答案与传统文化有关"
		"inscription":
			match hint_level:
				1:
					return "这是古代的文字"
				2:
					return "字形像某种事物"
				3:
					return "答案是一个字"
		"astronomy":
			match hint_level:
				1:
					return "观察星宿的排列"
				2:
					return "与北斗七星有关"
				3:
					return "答案与方位有关"
		_:
			return "仔细思考，你可以的！"
	
	return "加油！"

# 更新计时器
func _process(delta):
	if is_level_active:
		puzzle_config["time_limit"] -= delta
		if puzzle_config["time_limit"] <= 0:
			complete_level(false)
		
		# 更新 UI
		var timer_label = get_node_or_null("PuzzlePanel/TimerLabel")
		if timer_label:
			timer_label.text = "时间：%.1f" % puzzle_config["time_limit"]

# 获取关卡名称
func get_level_name() -> String:
	var level_data = get_current_level_data()
	if level_data:
		return level_data.get("name", "")
	return ""

# 获取城市 ID
func get_city_id() -> String:
	var level_data = get_current_level_data()
	if level_data:
		return level_data.get("city_id", "unknown")
	return "unknown"

# 获取城市难度
func get_city_difficulty() -> int:
	var level_data = get_current_level_data()
	if level_data:
		return level_data.get("difficulty", 1)
	return 1

# 获取当前关卡数据
func get_current_level_data() -> Dictionary:
	# 从后端 API 获取当前关卡数据
	# 这里简化处理
	return {}

# 完成关卡
func complete_level(success: bool):
	is_level_active = false
	level_result["success"] = success
	level_result["time_used"] = puzzle_config["time_limit"]
	level_result["hints_used"] = puzzle_data["hints_used"]
	level_result["attempts"] = puzzle_data["attempts"]
	
	# 发送结果到后端
	send_level_result_to_backend()
	
	# 显示结果 UI
	show_result_ui(success)

# 显示结果 UI
func show_result_ui(success: bool):
	var result_panel = Control.new()
	result_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	result_panel.add_to_group("ui_layer")
	
	var bg = ColorRect.new()
	bg.color = Color(0, 0, 0, 0.9)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	result_panel.add_child(bg)
	
	var label = Label.new()
	label.text = "解谜成功！" if success else "解谜失败"
	label.add_theme_font_size_override("font_size", 48)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	result_panel.add_child(label)
	
	get_tree().current_scene.add_child(result_panel)
	
	# 3 秒后返回
	await get_tree().create_timer(3.0).timeout
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

# 发送结果到后端
func send_level_result_to_backend():
	# 实现 API 调用
	pass
