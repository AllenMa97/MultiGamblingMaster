extends "res://scripts/base_dungeon.gd"

# 恋爱关卡配置
var dating_config = {
	"type": "dating",
	"difficulty": 2,
	"romance_type": "traditional",
	"dialogue_tree": {},
	"affection_threshold": 50,
	"time_limit": 600.0
}

# 恋爱数据
var dating_data = {
	"current_dialogue": "",
	"affection_level": 0,
	"choices_made": [],
	"gifts_given": [],
	"events_triggered": [],
	"ending_type": ""
}

# 角色好感度
var character_affection = {
	"bai_niangzi": 0,  # 白娘子
	"fox_spirit": 0,   # 狐仙
	"girl_liu": 0      # 刘三姐
}

# 信号
signal affection_changed(amount: int)
signal dialogue_chosen(choice_id: String)
signal ending_reached(ending_type: String)

func _ready():
	super._ready()
	setup_dating_level()

# 设置恋爱关卡
func setup_dating_level():
	var level_name = get_level_name()
	match level_name:
		"断桥邂逅":
			init_white_snake_dating()
		"狐仙情缘":
			init_fox_spirit_dating()
		"对歌传情":
			init_folk_song_dating()
		_:
			init_generic_dating()

# 初始化白娘子剧情
func init_white_snake_dating():
	dating_config["romance_type"] = "white_snake"
	dating_config["difficulty"] = 2
	dating_config["affection_threshold"] = 50
	
	# 创建对话树
	dating_config["dialogue_tree"] = {
		"start": {
			"text": "这位公子，雨下得这么大，可在断桥避雨？",
			"speaker": "bai_niangzi",
			"choices": {
				"a": {
					"text": "正是，多谢姑娘关心",
					"affection": 10,
					"next": "talk_1"
				},
				"b": {
					"text": "是啊，这雨来得真突然",
					"affection": 5,
					"next": "talk_1"
				},
				"c": {
					"text": "（微笑点头）",
					"affection": 8,
					"next": "talk_1"
				}
			}
		},
		"talk_1": {
			"text": "小女子白素贞，在此遇见公子，也是缘分。",
			"speaker": "bai_niangzi",
			"choices": {
				"a": {
					"text": "原来是白姑娘，幸会幸会",
					"affection": 10,
					"next": "gift_offer"
				},
				"b": {
					"text": "白姑娘名字真好听",
					"affection": 15,
					"next": "gift_offer"
				},
				"c": {
					"text": "不知白姑娘家住何处？",
					"affection": 5,
					"next": "gift_offer"
				}
			}
		},
		"gift_offer": {
			"text": "公子若不嫌弃，这把伞借与你遮雨。",
			"speaker": "bai_niangzi",
			"choices": {
				"a": {
					"text": "那怎么好意思，姑娘自己用吧",
					"affection": 10,
					"next": "ending_good"
				},
				"b": {
					"text": "多谢姑娘，改日定当归还",
					"affection": 15,
					"next": "ending_good"
				},
				"c": {
					"text": "不如我们一起走吧",
					"affection": 20,
					"next": "ending_best"
				}
			}
		},
		"ending_good": {
			"text": "公子慢走，后会有期。",
			"speaker": "bai_niangzi",
			"ending": "good"
		},
		"ending_best": {
			"text": "（白素贞含羞与你同行，一段佳话由此开始）",
			"speaker": "narrator",
			"ending": "best"
		}
	}
	
	create_dating_ui()
	start_dialogue("start")

# 初始化狐仙剧情
func init_fox_spirit_dating():
	dating_config["romance_type"] = "fox_spirit"
	dating_config["difficulty"] = 4
	dating_config["affection_threshold"] = 60
	
	dating_config["dialogue_tree"] = {
		"start": {
			"text": "公子，你迷路了吗？这青丘可不是凡人该来的地方。",
			"speaker": "fox_spirit",
			"choices": {
				"a": {
					"text": "我...我是无意中闯进来的",
					"affection": 5,
					"next": "fox_talk_1"
				},
				"b": {
					"text": "听说这里有仙人居住，特来拜访",
					"affection": 10,
					"next": "fox_talk_1"
				},
				"c": {
					"text": "（被对方的美貌惊艳）你...你是？",
					"affection": 15,
					"next": "fox_talk_1"
				}
			}
		},
		"fox_talk_1": {
			"text": "（轻笑）我是青丘狐仙，在此修炼千年。凡人，你不怕我吗？",
			"speaker": "fox_spirit",
			"choices": {
				"a": {
					"text": "仙人怎会害人？",
					"affection": 10,
					"next": "fox_gift"
				},
				"b": {
					"text": "说实话，有点怕...但还是想见你",
					"affection": 20,
					"next": "fox_gift"
				},
				"c": {
					"text": "（真诚）我相信自己的直觉",
					"affection": 15,
					"next": "fox_gift"
				}
			}
		},
		"fox_gift": {
			"text": "（取出一个香囊）这个送给你，能保你平安。",
			"speaker": "fox_spirit",
			"choices": {
				"a": {
					"text": "太珍贵了，我不能收",
					"affection": 5,
					"next": "fox_ending_normal"
				},
				"b": {
					"text": "（小心接过）多谢仙人厚爱",
					"affection": 15,
					"next": "fox_ending_good"
				},
				"c": {
					"text": "（握住她的手）能再见到你吗？",
					"affection": 25,
					"next": "fox_ending_best"
				}
			}
		},
		"fox_ending_normal": {
			"text": "公子慢走，有缘再见。",
			"speaker": "fox_spirit",
			"ending": "normal"
		},
		"fox_ending_good": {
			"text": "（狐仙目送你的身影，嘴角含笑）",
			"speaker": "narrator",
			"ending": "good"
		},
		"fox_ending_best": {
			"text": "（狐仙脸颊微红，轻声道）若你愿意，随时可来青丘寻我。",
			"speaker": "fox_spirit",
			"ending": "best"
		}
	}
	
	create_dating_ui()
	start_dialogue("start")

# 初始化民歌对唱
func init_folk_song_dating():
	dating_config["romance_type"] = "folk_song"
	dating_config["difficulty"] = 3
	
	dating_config["dialogue_tree"] = {
		"start": {
			"text": "（刘三姐唱）山歌好比春江水哎～",
			"speaker": "girl_liu",
			"choices": {
				"a": {
					"text": "（接唱）春江水暖鸭先知",
					"affection": 15,
					"next": "liu_talk_1"
				},
				"b": {
					"text": "（接唱）两岸猿声啼不住",
					"affection": 10,
					"next": "liu_talk_1"
				},
				"c": {
					"text": "（鼓掌）唱得真好！",
					"affection": 5,
					"next": "liu_talk_1"
				}
			}
		},
		"liu_talk_1": {
			"text": "（刘三姐笑）公子也会唱山歌？",
			"speaker": "girl_liu",
			"choices": {
				"a": {
					"text": "略懂一二，愿与姑娘对唱",
					"affection": 15,
					"next": "liu_ending"
				},
				"b": {
					"text": "不会唱，但愿听姑娘唱",
					"affection": 10,
					"next": "liu_ending"
				}
			}
		},
		"liu_ending": {
			"text": "（两人对唱山歌，情意绵绵）",
			"speaker": "narrator",
			"ending": "good"
		}
	}
	
	create_dating_ui()
	start_dialogue("start")

# 初始化通用恋爱
func init_generic_dating():
	dating_config["romance_type"] = "generic"
	dating_config["dialogue_tree"] = {
		"start": {
			"text": "你好，很高兴遇见你。",
			"speaker": "character",
			"choices": {
				"a": {
					"text": "你好，我也很高兴",
					"affection": 10,
					"next": "end"
				},
				"b": {
					"text": "今天天气真好",
					"affection": 5,
					"next": "end"
				}
			}
		},
		"end": {
			"text": "希望能再次相见。",
			"speaker": "character",
			"ending": "normal"
		}
	}
	
	create_dating_ui()
	start_dialogue("start")

# 创建恋爱 UI
func create_dating_ui():
	# 创建主面板
	var dating_panel = Control.new()
	dating_panel.name = "DatingPanel"
	dating_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	dating_panel.add_to_group("ui_layer")
	
	# 背景图
	var bg = TextureRect.new()
	bg.texture = load("res://assets/backgrounds/romance_bg.png")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	dating_panel.add_child(bg)
	
	# 角色立绘
	var character_sprite = TextureRect.new()
	character_sprite.name = "CharacterSprite"
	character_sprite.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	character_sprite.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	character_sprite.offset_left = 200
	character_sprite.offset_right = -600
	dating_panel.add_child(character_sprite)
	
	# 对话框
	var dialogue_box = ColorRect.new()
	dialogue_box.color = Color(0, 0, 0, 0.7)
	dialogue_box.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	dialogue_box.offset_top = -250
	dating_panel.add_child(dialogue_box)
	
	# 说话人名字
	var speaker_label = Label.new()
	speaker_label.name = "SpeakerLabel"
	speaker_label.add_theme_font_size_override("font_size", 24)
	speaker_label.position = Vector2(50, 20)
	dating_panel.add_child(speaker_label)
	
	# 对话内容
	var dialogue_label = RichTextLabel.new()
	dialogue_label.name = "DialogueLabel"
	dialogue_label.bbcode_enabled = true
	dialogue_label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	dialogue_label.offset_top = -200
	dialogue_label.offset_bottom = -80
	dialogue_panel.add_child(dialogue_label)
	
	# 选项容器
	var choices_container = VBoxContainer.new()
	choices_container.name = "ChoicesContainer"
	choices_container.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	choices_container.offset_top = -70
	choices_container.offset_bottom = -10
	choices_container.position = Vector2(50, 0)
	dating_panel.add_child(choices_container)
	
	# 好感度显示
	var affection_label = Label.new()
	affection_label.name = "AffectionLabel"
	affection_label.text = "好感度：0"
	affection_label.add_theme_font_size_override("font_size", 20)
	affection_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	affection_label.offset_top = 20
	affection_label.offset_right = -20
	dating_panel.add_child(affection_label)
	
	# 计时器
	var timer_label = Label.new()
	timer_label.name = "TimerLabel"
	timer_label.text = "时间：%.1f" % dating_config["time_limit"]
	timer_label.add_theme_font_size_override("font_size", 20)
	timer_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	timer_label.offset_top = 50
	timer_label.offset_right = -20
	dating_panel.add_child(timer_label)
	
	get_tree().current_scene.add_child(dating_panel)
	
	# 加载角色立绘
	load_character_sprite(dating_config["romance_type"])

# 加载角色立绘
func load_character_sprite(romance_type: String):
	var sprite = get_node_or_null("DatingPanel/CharacterSprite")
	if sprite:
		match romance_type:
			"white_snake":
				sprite.texture = load("res://assets/characters/bai_niangzi.png")
			"fox_spirit":
				sprite.texture = load("res://assets/characters/fox_spirit.png")
			"folk_song":
				sprite.texture = load("res://assets/characters/girl_liu.png")
			_:
				sprite.texture = load("res://assets/characters/generic_character.png")

# 开始对话
func start_dialogue(dialogue_id: String):
	var dialogue_tree = dating_config["dialogue_tree"]
	if dialogue_id not in dialogue_tree:
		ending_reached.emit("normal")
		complete_level(false)
		return
	
	var dialogue = dialogue_tree[dialogue_id]
	
	# 更新说话人
	var speaker_label = get_node_or_null("DatingPanel/SpeakerLabel")
	if speaker_label:
		speaker_label.text = dialogue.get("speaker", "")
	
	# 更新对话内容
	var dialogue_label = get_node_or_null("DatingPanel/DialogueLabel")
	if dialogue_label:
		dialogue_label.text = dialogue.get("text", "")
	
	# 检查是否是结局
	if "ending" in dialogue:
		dating_data["ending_type"] = dialogue["ending"]
		ending_reached.emit(dialogue["ending"])
		await get_tree().create_timer(2.0).timeout
		complete_level(dating_data["ending_type"] in ["good", "best"])
		return
	
	# 创建选项按钮
	create_choice_buttons(dialogue["choices"])

# 创建选项按钮
func create_choice_buttons(choices: Dictionary):
	var container = get_node_or_null("DatingPanel/ChoicesContainer")
	if container:
		# 清空现有按钮
		for child in container.get_children():
			child.queue_free()
		
		# 创建新按钮
		for choice_id in choices:
			var choice = choices[choice_id]
			var btn = Button.new()
			btn.text = choice["text"]
			btn.add_theme_font_size_override("font_size", 18)
			btn.custom_minimum_size = Vector2(300, 50)
			btn.pressed.connect(_on_choice_selected.bind(choice_id, choice))
			container.add_child(btn)

# 选项被选择
func _on_choice_selected(choice_id: String, choice_data: Dictionary):
	# 更新好感度
	var affection_change = choice_data.get("affection", 0)
	dating_data["affection_level"] += affection_change
	
	if affection_change > 0:
		affection_changed.emit(affection_change)
	
	# 记录选择
	dating_data["choices_made"].append(choice_id)
	
	# 更新 UI
	update_affection_ui()
	
	# 进入下一段对话
	var next_dialogue = choice_data.get("next", "")
	start_dialogue(next_dialogue)

# 更新好感度 UI
func update_affection_ui():
	var affection_label = get_node_or_null("DatingPanel/AffectionLabel")
	if affection_label:
		affection_label.text = "好感度：%d" % dating_data["affection_level"]

# 更新计时器
func _process(delta):
	if is_level_active:
		dating_config["time_limit"] -= delta
		if dating_config["time_limit"] <= 0:
			complete_level(false)
		
		var timer_label = get_node_or_null("DatingPanel/TimerLabel")
		if timer_label:
			timer_label.text = "时间：%.1f" % dating_config["time_limit"]

# 完成关卡
func complete_level(success: bool):
	is_level_active = false
	level_result["success"] = success
	level_result["ending_type"] = dating_data["ending_type"]
	level_result["affection_level"] = dating_data["affection_level"]
	level_result["choices_made"] = dating_data["choices_made"]
	
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
	var ending_text = get_ending_description(dating_data["ending_type"])
	label.text = "结局：%s\n好感度：%d" % [ending_text, dating_data["affection_level"]]
	label.add_theme_font_size_override("font_size", 40)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	result_panel.add_child(label)
	
	get_tree().current_scene.add_child(result_panel)
	
	await get_tree().create_timer(3.0).timeout
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

# 获取结局描述
func get_ending_description(ending_type: String) -> String:
	match ending_type:
		"best":
			return "完美结局"
		"good":
			return "美好结局"
		"normal":
			return "普通结局"
		_:
			return "未知结局"

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
