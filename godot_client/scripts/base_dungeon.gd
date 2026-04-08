extends Node2D
class_name BaseDungeon

## 横版动作关卡基类
## 所有动作关卡都继承自此类

@export var difficulty: int = 1
@export var level_type: String = "speed_run"  # speed_run, castle_battle, platform_challenge, boss_battle

var api_client: APIClient
var player: CharacterBody2D
var start_time: float = 0.0
var is_dungeon_active: bool = false
var is_dungeon_completed: bool = false
var session_id: String = ""
var save_id: String = ""
var node_id: int = 0

## UI 引用
var timer_label: Label
var health_bar: ProgressBar
var message_label: Label

signal dungeon_started
signal dungeon_completed(success: bool)
signal dungeon_failed(reason: String)

func _ready() -> void:
	# 查找 API 客户端（如果存在）
	api_client = get_node_or_null("/root/APIClient")
	
	# 查找玩家
	player = get_node_or_null("Player")
	if player:
		player.died.connect(_on_player_died)
	
	# 初始化 UI
	setup_ui()
	
	# 初始化关卡
	init_level()

func setup_ui() -> void:
	# 创建 UI（子类可以重写）
	var canvas_layer = CanvasLayer.new()
	add_child(canvas_layer)
	
	var margin = MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_TOP_LEFT)
	margin.offset_left = 20
	margin.offset_top = 20
	canvas_layer.add_child(margin)
	
	var vbox = VBoxContainer.new()
	margin.add_child(vbox)
	
	# 计时器
	var timer_hbox = HBoxContainer.new()
	vbox.add_child(timer_hbox)
	
	timer_hbox.add_child(Label.new().set_text("时间："))
	timer_label = Label.new()
	timer_label.set_name("TimerLabel")
	timer_label.set_text("0.0s")
	timer_hbox.add_child(timer_label)
	
	# 血量条
	var health_label = Label.new()
	health_label.set_text("生命:")
	vbox.add_child(health_label)
	
	health_bar = ProgressBar.new()
	health_bar.set_custom_minimum_size(Vector2(200, 20))
	health_bar.set_name("HealthBar")
	vbox.add_child(health_bar)
	
	# 消息标签
	message_label = Label.new()
	message_label.set_name("MessageLabel")
	message_label.set_text("")
	vbox.add_child(message_label)

func init_level() -> void:
	# 初始化关卡（子类实现）
	pass

func start_dungeon() -> void:
	"""开始关卡"""
	start_time = Time.get_ticks_msec() / 1000.0
	is_dungeon_active = true
	dungeon_started.emit()
	
	# 如果有关卡特定的启动逻辑，子类可以重写

func update_timer() -> void:
	"""更新计时器"""
	if is_dungeon_active and timer_label:
		var elapsed = (Time.get_ticks_msec() / 1000.0) - start_time
		timer_label.set_text("%.1fs" % elapsed)

func update_health_bar(current: int, max_health: int) -> void:
	"""更新血量条"""
	if health_bar:
		health_bar.set_max(max_health)
		health_bar.set_value(current)

func check_victory() -> bool:
	"""检查胜利条件（子类实现）"""
	return false

func check_defeat() -> bool:
	"""检查失败条件（子类实现）"""
	return false

func complete_dungeon() -> void:
	"""完成关卡"""
	if is_dungeon_completed:
		return
	
	is_dungeon_completed = true
	is_dungeon_active = false
	
	var time_used = (Time.get_ticks_msec() / 1000.0) - start_time
	show_message("关卡完成！用时：%.2f 秒" % time_used)
	
	# 提交结果到后端
	if api_client:
		await api_client.submit_action_result([], time_used)
	
	dungeon_completed.emit(true)
	
	# 延迟返回
	await get_tree().create_timer(3.0).timeout
	return_to_map(true)

func fail_dungeon(reason: String) -> void:
	"""失败关卡"""
	if is_dungeon_completed:
		return
	
	is_dungeon_completed = true
	is_dungeon_active = false
	
	show_message("关卡失败：%s" % reason)
	dungeon_failed.emit(reason)
	
	# 提交失败结果
	if api_client:
		var time_used = (Time.get_ticks_msec() / 1000.0) - start_time
		await api_client.submit_action_result([], time_used)
	
	# 延迟返回
	await get_tree().create_timer(3.0).timeout
	return_to_map(false)

func show_message(text: String, duration: float = 2.0) -> void:
	"""显示消息"""
	if message_label:
		message_label.set_text(text)
		if duration > 0:
			await get_tree().create_timer(duration).timeout
			message_label.set_text("")

func return_to_map(success: bool) -> void:
	"""返回地图（通过场景切换）"""
	# 这里通过信号通知 Phaser 场景返回
	# 实际实现取决于集成方式
	get_tree().change_scene_to_file("res://scenes/Main.tscn")

func _on_player_died() -> void:
	"""玩家死亡处理"""
	fail_dungeon("玩家死亡")

func _process(delta: float) -> void:
	"""每帧更新"""
	if is_dungeon_active:
		update_timer()
		
		# 检查胜利/失败条件
		if check_victory():
			complete_dungeon()
		elif check_defeat():
			fail_dungeon("失败条件达成")
