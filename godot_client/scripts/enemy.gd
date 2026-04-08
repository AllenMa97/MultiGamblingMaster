extends CharacterBody2D
class_name Enemy

## 敌人基础属性
@export var speed: float = 100.0
@export var max_health: int = 30
@export var attack_damage: int = 15
@export var detection_range: float = 200.0

## 状态
var health: int = 30
var is_alive: bool = true
var target: Node2D = null

## 动画
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var sprite: Sprite2D = $Sprite2D

## 信号
signal died
signal health_changed(new_health: int)

func _ready() -> void:
	health = max_health
	add_to_group("enemies")

func _physics_process(delta: float) -> void:
	if not is_alive:
		return
	
	# 寻找玩家
	if not target or not is_instance_valid(target):
		target = find_player()
	
	if target:
		move_toward_player(delta)
	
	apply_gravity(delta)
	move_and_slide()

func find_player() -> Node2D:
	# 简单的索敌逻辑
	var players = get_tree().get_nodes_in_group("player")
	for player in players:
		if global_position.distance_to(player.global_position) <= detection_range:
			return player
	return null

func move_toward_player(delta: float) -> void:
	if not target:
		return
	
	var direction = (target.global_position - global_position).normalized()
	
	# 水平移动
	velocity.x = direction.x * speed
	
	# 翻转精灵
	if sprite:
		sprite.flip_h = direction.x < 0

func apply_gravity(delta: float) -> void:
	if not is_on_floor():
		velocity.y += 980.0 * delta

func take_damage(amount: int) -> void:
	health = max(0, health - amount)
	health_changed.emit(health)
	
	if animation_player:
		animation_player.play("hurt")
	
	if health <= 0:
		die()

func die() -> void:
	is_alive = false
	died.emit()
	queue_free()  # 从场景中移除

func get_attack_damage() -> int:
	return attack_damage

func _on_attack_hitbox_body_entered(body: Node2D) -> void:
	if body.is_in_group("player"):
		take_damage(body.attack_damage if body.has_method("get_attack_damage") else 10)
