extends "res://scripts/base_dungeon.gd"

# 节奏关卡配置
var rhythm_config = {
	"type": "rhythm",
	"difficulty": 2,
	"music_type": "traditional",
	"note_count": 20,
	"accuracy_threshold": 0.6,
	"speed_multiplier": 1.0
}

# 节奏数据
var rhythm_data = {
	"note_sequence": [],
	"player_input_sequence": [],
	"current_note_index": 0,
	"hit_count": 0,
	"miss_count": 0,
	"accuracy": 0.0,
	"score": 0
}

# 音符类型
enum NoteType {
	SINGLE,      # 单点
	HOLD,        # 长按
	SLIDE,       # 滑动
	DOUBLE       # 双点
}

# 轨道配置
var track_config = {
	"track_count": 4,
	"note_speed": 300.0,
	"hit_position_y": 100,
	"spawn_position_y": -600
}

# 信号
signal note_hit(perfect: bool)
signal note_miss()
signal combo_changed(count: int)
signal rhythm_complete(success: bool, score: int)

func _ready():
	super._ready()
	setup_rhythm_level()

# 设置节奏关卡
func setup_rhythm_level():
	var level_name = get_level_name()
	match level_name:
		"刘三姐对歌":
			init_folk_song_rhythm()
		"铜鼓舞":
			init_dance_rhythm()
		"麦西来甫":
			init_uyghur_dance()
		_:
			init_generic_rhythm()

# 初始化民歌对唱
func init_folk_song_rhythm():
	rhythm_config["music_type"] = "folk_song"
	rhythm_config["difficulty"] = 2
	rhythm_config["note_count"] = 20
	rhythm_config["speed_multiplier"] = 1.0
	
	# 生成民歌节奏序列
	generate_folk_song_sequence()
	create_rhythm_ui()
	start_music()

# 初始化舞蹈节奏
func init_dance_rhythm():
	rhythm_config["music_type"] = "dance"
	rhythm_config["difficulty"] = 2
	rhythm_config["note_count"] = 25
	rhythm_config["speed_multiplier"] = 1.2
	
	generate_dance_sequence()
	create_rhythm_ui()
	start_music()

# 初始化维吾尔族舞蹈
func init_uyghur_dance():
	rhythm_config["music_type"] = "uyghur_dance"
	rhythm_config["difficulty"] = 3
	rhythm_config["note_count"] = 30
	rhythm_config["speed_multiplier"] = 1.5
	
	generate_uyghur_sequence()
	create_rhythm_ui()
	start_music()

# 初始化通用节奏
func init_generic_rhythm():
	rhythm_config["music_type"] = "generic"
	generate_generic_sequence()
	create_rhythm_ui()
	start_music()

# 生成民歌节奏序列
func generate_folk_song_sequence():
	# 刘三姐山歌节奏模式
	var pattern = [
		NoteType.SINGLE, NoteType.SINGLE, NoteType.HOLD,
		NoteType.SINGLE, NoteType.SLIDE, NoteType.SINGLE,
		NoteType.HOLD, NoteType.SINGLE, NoteType.DOUBLE,
		NoteType.SINGLE, NoteType.SINGLE, NoteType.HOLD
	]
	
	for i in range(rhythm_config["note_count"]):
		var note_type = pattern[i % pattern.size()]
		var track = randi() % track_config["track_count"]
		var time = i * 0.8  # 音符间隔
		
		rhythm_data["note_sequence"].append({
			"type": note_type,
			"track": track,
			"time": time,
			"hit_window": 0.15
		})

# 生成舞蹈节奏序列
func generate_dance_sequence():
	var pattern = [
		NoteType.SINGLE, NoteType.DOUBLE, NoteType.SINGLE,
		NoteType.HOLD, NoteType.SLIDE, NoteType.SINGLE,
		NoteType.DOUBLE, NoteType.SINGLE, NoteType.HOLD
	]
	
	for i in range(rhythm_config["note_count"]):
		var note_type = pattern[i % pattern.size()]
		var track = randi() % track_config["track_count"]
		var time = i * 0.6
		
		rhythm_data["note_sequence"].append({
			"type": note_type,
			"track": track,
			"time": time,
			"hit_window": 0.12
		})

# 生成维吾尔族节奏序列
func generate_uyghur_sequence():
	var pattern = [
		NoteType.SINGLE, NoteType.SLIDE, NoteType.DOUBLE,
		NoteType.HOLD, NoteType.SINGLE, NoteType.DOUBLE,
		NoteType.SLIDE, NoteType.HOLD, NoteType.SINGLE
	]
	
	for i in range(rhythm_config["note_count"]):
		var note_type = pattern[i % pattern.size()]
		var track = randi() % track_config["track_count"]
		var time = i * 0.5
		
		rhythm_data["note_sequence"].append({
			"type": note_type,
			"track": track,
			"time": time,
			"hit_window": 0.10
		})

# 生成通用节奏序列
func generate_generic_sequence():
	for i in range(rhythm_config["note_count"]):
		var note_type = NoteType.SINGLE
		if i % 3 == 0:
			note_type = NoteType.HOLD
		elif i % 5 == 0:
			note_type = NoteType.DOUBLE
		
		var track = randi() % track_config["track_count"]
		var time = i * 0.7
		
		rhythm_data["note_sequence"].append({
			"type": note_type,
			"track": track,
			"time": time,
			"hit_window": 0.15
		})

# 创建节奏 UI
func create_rhythm_ui():
	# 创建主面板
	var rhythm_panel = Control.new()
	rhythm_panel.name = "RhythmPanel"
	rhythm_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	rhythm_panel.add_to_group("ui_layer")
	
	# 背景
	var bg = ColorRect.new()
	bg.color = Color(0.1, 0.1, 0.3, 0.9)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	rhythm_panel.add_child(bg)
	
	# 创建 4 个轨道
	for i in range(track_config["track_count"]):
		var track = ColorRect.new()
		track.name = "Track%d" % i
		track.color = Color(0.3, 0.3, 0.5, 0.5)
		track.position = Vector2(200 + i * 200, -600)
		track.size = Vector2(180, 800)
		rhythm_panel.add_child(track)
		
		# 判定线
		var hit_line = ColorRect.new()
		hit_line.color = Color(1, 1, 0, 0.8)
		hit_line.position = Vector2(200 + i * 200, track_config["hit_position_y"])
		hit_line.size = Vector2(180, 5)
		rhythm_panel.add_child(hit_line)
	
	# 音符容器
	var note_container = Node2D.new()
	note_container.name = "NoteContainer"
	rhythm_panel.add_child(note_container)
	
	# 分数显示
	var score_label = Label.new()
	score_label.name = "ScoreLabel"
	score_label.text = "分数：0"
	score_label.add_theme_font_size_override("font_size", 28)
	score_label.position = Vector2(50, 50)
	rhythm_panel.add_child(score_label)
	
	# 连击显示
	var combo_label = Label.new()
	combo_label.name = "ComboLabel"
	combo_label.text = "连击：0"
	combo_label.add_theme_font_size_override("font_size", 32)
	combo_label.position = Vector2(50, 90)
	rhythm_panel.add_child(combo_label)
	
	# 准确率显示
	var accuracy_label = Label.new()
	accuracy_label.name = "AccuracyLabel"
	accuracy_label.text = "准确率：100%"
	accuracy_label.add_theme_font_size_override("font_size", 24)
	accuracy_label.position = Vector2(50, 130)
	rhythm_panel.add_child(accuracy_label)
	
	# 按键提示
	var key_hint = Label.new()
	key_hint.text = "按键：D F J K (或方向键)"
	key_hint.add_theme_font_size_override("font_size", 20)
	key_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	key_hint.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_CENTER)
	key_hint.offset_top = -50
	rhythm_panel.add_child(key_hint)
	
	get_tree().current_scene.add_child(rhythm_panel)
	
	# 开始生成音符
	start_spawning_notes()

# 开始生成音符
func start_spawning_notes():
	var time = 0.0
	for note_data in rhythm_data["note_sequence"]:
		await get_tree().create_timer(note_data["time"] - time).timeout
		spawn_note(note_data)
		time = note_data["time"]
	
	# 所有音符生成完毕
	await get_tree().create_timer(3.0).timeout
	check_level_complete()

# 生成单个音符
func spawn_note(note_data: Dictionary):
	var note_container = get_node_or_null("RhythmPanel/NoteContainer")
	if not note_container:
		return
	
	var note = ColorRect.new()
	
	# 根据音符类型设置颜色
	match note_data["type"]:
		NoteType.SINGLE:
			note.color = Color(1, 0, 0, 1)  # 红色
		NoteType.HOLD:
			note.color = Color(0, 1, 0, 1)  # 绿色
		NoteType.SLIDE:
			note.color = Color(0, 0, 1, 1)  # 蓝色
		NoteType.DOUBLE:
			note.color = Color(1, 1, 0, 1)  # 黄色
	
	var track_x = 200 + note_data["track"] * 200
	note.position = Vector2(track_x, track_config["spawn_position_y"])
	note.size = Vector2(180, 40)
	
	if note_data["type"] == NoteType.HOLD:
		note.size.y = 80
	
	note.name = "Note"
	note.set_meta("track", note_data["track"])
	note.set_meta("type", note_data["type"])
	note.set_meta("hit_window", note_data["hit_window"])
	
	note_container.add_child(note)
	
	# 音符下落动画
	var tween = create_tween()
	tween.tween_property(note, "position:y", track_config["hit_position_y"] + 200, note_data["time"])
	tween.tween_callback(_on_note_timeout.bind(note))

# 音符超时未击中
func _on_note_timeout(note: Node):
	if is_instance_valid(note):
		note.queue_free()
		rhythm_data["miss_count"] += 1
		note_miss.emit()
		update_combo(0)

# 处理输入
func _input(event):
	if not is_level_active:
		return
	
	if event is InputEventKey and event.pressed:
		var track = -1
		
		# 检测按键
		match event.keycode:
			KEY_D, KEY_LEFT:
				track = 0
			KEY_F, KEY_DOWN:
				track = 1
			KEY_J, KEY_UP:
				track = 2
			KEY_K, KEY_RIGHT:
				track = 3
		
		if track >= 0:
			check_note_hit(track)

# 检查音符击中
func check_note_hit(track: int):
	var note_container = get_node_or_null("RhythmPanel/NoteContainer")
	if not note_container:
		return
	
	var hit_position = track_config["hit_position_y"]
	var hit_window = 50.0  # 判定范围像素
	
	for note in note_container.get_children():
		if note.get_meta("track") != track:
			continue
		
		var note_y = note.position.y
		var distance = abs(note_y - hit_position)
		
		if distance <= hit_window:
			# 击中音符
			var hit_window_time = note.get_meta("hit_window")
			var timing = distance / hit_window
			var perfect = timing < 0.3
			
			note_hit.emit(perfect)
			
			if perfect:
				rhythm_data["hit_count"] += 2
				rhythm_data["score"] += 100
			else:
				rhythm_data["hit_count"] += 1
				rhythm_data["score"] += 50
			
			update_combo(rhythm_data["hit_count"])
			note.queue_free()
			break

# 更新连击
func update_combo(count: int):
	var combo_label = get_node_or_null("RhythmPanel/ComboLabel")
	if combo_label:
		combo_label.text = "连击：%d" % count

# 更新分数
func update_score():
	var score_label = get_node_or_null("RhythmPanel/ScoreLabel")
	if score_label:
		score_label.text = "分数：%d" % rhythm_data["score"]
	
	var accuracy_label = get_node_or_null("RhythmPanel/AccuracyLabel")
	if accuracy_label and rhythm_data["hit_count"] + rhythm_data["miss_count"] > 0:
		var total = rhythm_data["hit_count"] + rhythm_data["miss_count"]
		rhythm_data["accuracy"] = float(rhythm_data["hit_count"]) / total * 100
		accuracy_label.text = "准确率：%.1f%%" % rhythm_data["accuracy"]

# 检查关卡完成
func check_level_complete():
	var total_notes = rhythm_config["note_count"]
	var required_accuracy = rhythm_config["accuracy_threshold"]
	
	var success = rhythm_data["accuracy"] >= required_accuracy * 100
	
	rhythm_complete.emit(success, rhythm_data["score"])
	complete_level(success)

# 完成关卡
func complete_level(success: bool):
	is_level_active = false
	level_result["success"] = success
	level_result["score"] = rhythm_data["score"]
	level_result["accuracy"] = rhythm_data["accuracy"]
	level_result["hit_count"] = rhythm_data["hit_count"]
	level_result["miss_count"] = rhythm_data["miss_count"]
	
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
	label.text = "演奏成功！\n分数：%d\n准确率：%.1f%%" % [rhythm_data["score"], rhythm_data["accuracy"]] if success else "演奏失败"
	label.add_theme_font_size_override("font_size", 48)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	result_panel.add_child(label)
	
	get_tree().current_scene.add_child(result_panel)
	
	await get_tree().create_timer(3.0).timeout
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

# 开始音乐
func start_music():
	# 播放背景音乐
	var music_path = get_music_path()
	if ResourceLoader.exists(music_path):
		var music = load(music_path)
		var audio_player = AudioStreamPlayer.new()
		audio_player.stream = music
		add_child(audio_player)
		audio_player.play()

# 获取音乐路径
func get_music_path() -> String:
	match rhythm_config["music_type"]:
		"folk_song":
			return "res://assets/music/folk_song.ogg"
		"dance":
			return "res://assets/music/dance.ogg"
		"uyghur_dance":
			return "res://assets/music/uyghur_dance.ogg"
		_:
			return "res://assets/music/generic.ogg"

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
