extends BaseDungeon

## 关卡 4:Boss 战
## 目标：击败机械守卫 Boss

var boss: Node2D = null
var boss_max_health: int = 200
var current_phase: int = 1
var is_boss_active: bool = false

# Boss 技能冷却
var dash_cooldown: float = 0.0
var slam_cooldown: float = 0.0
var laser_cooldown: float = 0.0
var missile_cooldown: float = 0.0

func init_level() -> void:
	level_type = "boss_battle"
	show_message("Boss 战 - 击败机械守卫！", 3.0)
	
	if player:
		player.global_position = Vector2(300, 500)
		player.health_changed.connect(_on_player_health_changed)

func start_dungeon() -> void:
	super.start_dungeon()
	spawn_boss()
	show_message("机械守卫出现了！", 2.0)

func spawn_boss() -> void:
	"""生成 Boss"""
	# 实际应该在场景中预置 Boss 或使用资源生成
	boss = preload("res://scenes/bosses/mech_guardian.tscn").instantiate() if boss else null
	if boss:
		add_child(boss)
		boss.global_position = Vector2(900, 500)
		boss.health_changed.connect(_on_boss_health_changed)
		is_boss_active = true

func check_victory() -> bool:
	# Boss 被打败
	return boss == null or not is_instance_valid(boss) or boss.health <= 0

func check_defeat() -> bool:
	# 玩家死亡
	if player and player.health <= 0:
		return true
	return false

func _on_boss_health_changed(new_health: int) -> void:
	"""Boss 血量变化"""
	var health_percent = float(new_health) / float(boss_max_health)
	
	# 阶段转换
	if health_percent <= 0.3 and current_phase == 2:
		current_phase = 3
		show_message("Boss 进入狂暴状态！", 2.0)
		enable_phase_3()
	elif health_percent <= 0.7 and current_phase == 1:
		current_phase = 2
		show_message("Boss 第二阶段！", 2.0)
		enable_phase_2()

func enable_phase_2() -> void:
	"""启用第二阶段技能"""
	# Boss 脚本中实现新技能

func enable_phase_3() -> void:
	"""启用第三阶段技能"""
	# Boss 脚本中实现狂暴模式

func _process(delta: float) -> void:
	if is_dungeon_active and boss and is_boss_active:
		# 更新 Boss 技能冷却
		update_boss_skills(delta)
	
	super._process(delta)

func update_boss_skills(delta: float) -> void:
	"""更新 Boss 技能冷却"""
	dash_cooldown = max(0, dash_cooldown - delta)
	slam_cooldown = max(0, slam_cooldown - delta)
	
	if current_phase >= 2:
		laser_cooldown = max(0, laser_cooldown - delta)
		missile_cooldown = max(0, missile_cooldown - delta)
	
	# Boss AI 会在自己的脚本中根据冷却时间释放技能

func _on_player_health_changed(new_health: int) -> void:
	update_health_bar(new_health, player.max_health)

# Boss 技能说明（在 Boss 脚本中实现）
# 阶段 1:
# - 冲撞：直线冲锋，冷却 3 秒
# - 砸地：范围攻击，冷却 4 秒
# - 召唤：召唤 2 个小怪，冷却 8 秒
#
# 阶段 2 新增:
# - 激光扫射：从下往上扫，冷却 6 秒
# - 导弹齐射：追踪导弹，冷却 5 秒
#
# 阶段 3:
# - 所有冷却减半
# - 移动速度 +50%
# - 攻击欲望提升
