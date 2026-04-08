extends CharacterBody2D

## 玩家基础属性
@export var speed: float = 200.0
@export var jump_velocity: float = -400.0
@export var gravity: float = 980.0

## 战斗属性
@export var max_health: int = 100
@export var attack_damage: int = 10
@export var defend_reduction: float = 0.5  # 防御时伤害减免

## 玩家状态
var health: int = 100
var is_attacking: bool = false
var is_defending: bool = false
var is_on_ground: bool = false

## 动画
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var sprite: Sprite2D = $Sprite2D

## 攻击检测
@onready var attack_hitbox: Area2D = $AttackHitbox
@onready var hurtbox: Area2D = $Hurtbox

## 信号
signal health_changed(new_health: int)
signal died
signal attack_performed
signal skill_used

func _ready() -> void:
	health = max_health
	if attack_hitbox:
		attack_hitbox.body_entered.connect(_on_attack_hitbox_body_entered)
	if hurtbox:
		hurtbox.body_entered.connect(_on_hurtbox_body_entered)

func _physics_process(delta: float) -> void:
	# 应用重力
	if not is_on_floor():
		velocity.y += gravity * delta
	
	# 处理跳跃
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = jump_velocity
		is_on_ground = false
		if animation_player:
			animation_player.play("jump")
	
	# 处理移动
	var direction := Input.get_axis("move_left", "move_right")
	if direction:
		velocity.x = direction * speed
		# 翻转精灵
		if sprite:
			sprite.flip_h = direction < 0
	else:
		velocity.x = move_toward(velocity.x, 0, speed * 0.2)
	
	# 处理攻击
	if Input.is_action_just_pressed("attack") and not is_attacking:
		perform_attack()
	
	# 处理防御
	if Input.is_action_pressed("defend"):
		start_defending()
	else:
		stop_defending()
	
	# 处理技能
	if Input.is_action_just_pressed("skill"):
		use_skill()
	
	# 更新动画状态
	update_animation(direction)
	
	move_and_slide()
	
	# 检查是否在地面
	is_on_ground = is_on_floor()

func perform_attack() -> void:
	is_attacking = true
	if animation_player:
		animation_player.play("attack")
	
	# 激活攻击判定框
	if attack_hitbox:
		attack_hitbox.monitoring = true
	
	# 攻击持续时间后关闭判定框
	await get_tree().create_timer(0.3).timeout
	is_attacking = false
	if attack_hitbox:
		attack_hitbox.monitoring = false

func start_defending() -> void:
	is_defending = true
	velocity.x = 0  # 防御时不能移动
	if animation_player:
		animation_player.play("defend")

func stop_defending() -> void:
	is_defending = false
	if animation_player:
		animation_player.play("idle")

func use_skill() -> void:
	# 技能逻辑，子类可以重写
	skill_used.emit()

func take_damage(amount: int) -> void:
	if is_defending:
		amount = int(amount * (1.0 - defend_reduction))
	
	health = max(0, health - amount)
	health_changed.emit(health)
	
	if animation_player and not is_defending:
		animation_player.play("hurt")
	
	if health <= 0:
		died.emit()

func update_animation(direction: float) -> void:
	if not animation_player:
		return
	
	if is_attacking:
		return  # 攻击动画优先
	
	if is_defending:
		return  # 防御动画优先
	
	if not is_on_floor():
		animation_player.play("jump")
	elif abs(direction) > 0.1:
		animation_player.play("run")
	else:
		animation_player.play("idle")

func _on_attack_hitbox_body_entered(body: Node2D) -> void:
	# 攻击到敌人
	if body.is_in_group("enemies"):
		if body.has_method("take_damage"):
			body.take_damage(attack_damage)

func _on_hurtbox_body_entered(body: Node2D) -> void:
	# 受到敌人攻击
	if body.is_in_group("enemies") and body.has_method("get_attack_damage"):
		take_damage(body.get_attack_damage())
