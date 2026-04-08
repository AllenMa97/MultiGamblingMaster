extends Node
class_name APIClient

## API 客户端 - 与 FastAPI 后端通信
@export var base_url: String = "http://localhost:8001"

var http_request: HTTPRequest
var session_id: String = ""
var save_id: String = ""
var node_id: int = 0

signal request_completed(result: Dictionary)
signal request_failed(error: String)

func _ready() -> void:
	http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_request_completed)

## 初始化横版动作关卡
func init_action_dungeon(difficulty: int = 1) -> void:
	var url = base_url + "/dungeon/action/start"
	var data = {
		"difficulty": difficulty,
		"save_id": save_id,
		"node_id": node_id
	}
	
	var json = JSON.stringify(data)
	var headers = ["Content-Type: application/json"]
	
	http_request.request(url, headers, HTTPClient.METHOD_POST, json)
	await request_completed
	
func submit_action_result(inputs: Array, time_used: float) -> void:
	var url = base_url + "/dungeon/action/submit"
	var data = {
		"session_id": session_id,
		"inputs": inputs,
		"time_used": time_used,
		"save_id": save_id,
		"node_id": node_id
	}
	
	var json = JSON.stringify(data)
	var headers = ["Content-Type: application/json"]
	
	http_request.request(url, headers, HTTPClient.METHOD_POST, json)
	await request_completed

## 通用 HTTP POST 请求
func post(endpoint: String, data: Dictionary) -> Dictionary:
	var url = base_url + endpoint
	var json = JSON.stringify(data)
	var headers = [
		"Content-Type: application/json",
		"Accept: application/json"
	]
	
	http_request.request(url, headers, HTTPClient.METHOD_POST, json)
	
	# 等待请求完成
	var result = await request_completed
	return result

## HTTP 请求完成回调
func _on_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if result != HTTPRequest.RESULT_SUCCESS:
		request_failed.emit("HTTP 请求失败：" + str(result))
		return
	
	# 解析 JSON 响应
	var json = JSON.new()
	var parse_result = json.parse(body.get_string_from_utf8())
	
	if parse_result != OK:
		request_failed.emit("JSON 解析失败")
		return
	
	var response_data = json.get_data()
	
	# 提取 session_id 如果有
	if response_data.has("session_id"):
		session_id = response_data["session_id"]
	
	request_completed.emit(response_data)
