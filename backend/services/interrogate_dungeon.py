"""AI审讯室关卡服务"""
import uuid
from typing import AsyncGenerator, Dict, Optional
from backend.models.interrogate import InterrogateDungeonState, InterrogateMessage
from backend.services.llm_client import chat_completion, chat_completion_stream
from backend.config import LLM_MODEL_PLUS

# 内存存储 session
_sessions: Dict[str, InterrogateDungeonState] = {}


async def start_dungeon() -> InterrogateDungeonState:
    """创建 session，调用 LLM 生成案件场景"""
    session_id = str(uuid.uuid4())
    
    # 调用 LLM 生成案件场景
    prompt = """你是一个侦探小说的作者。请生成一个简短的案件场景，作为"审讯室"游戏的背景。

要求：
1. 场景要有一个未解之谜或可疑事件
2. 有两个主要嫌疑人（玩家和AI对手），都声称自己无辜
3. 场景要有一些可以追问的细节
4. 控制在50字以内

请直接输出场景描述，不要其他说明。

示例场景：
- 昨晚银行被抢，你和嫌疑人B都声称自己当晚在家看书
- 博物馆名画被盗，你和另一位保安都说自己在巡逻
- 公司机密文件泄露，你和同事都声称没有接触过文件"""
    
    messages = [{"role": "user", "content": prompt}]
    response = await chat_completion(messages, model=LLM_MODEL_PLUS, temperature=0.9, max_tokens=150)
    
    scenario = response.strip()
    # 清理格式
    if scenario.startswith('场景：') or scenario.startswith('场景:'):
        scenario = scenario.split('：', 1)[1].strip() if '：' in scenario else scenario.split(':', 1)[1].strip()
    
    # 如果解析失败，使用默认场景
    if not scenario:
        scenario = "昨晚银行被抢，你和嫌疑人B都声称自己当晚在家看书"
    
    state = InterrogateDungeonState(
        session_id=session_id,
        scenario=scenario,
        status="scenario"
    )
    
    _sessions[session_id] = state
    return state


async def generate_opponent_story(session_id: str) -> AsyncGenerator[str, None]:
    """AI对手编故事背景，流式输出"""
    state = _sessions.get(session_id)
    if not state or not state.scenario:
        yield "[错误：找不到场景]"
        return
    
    state.status = "story_writing"
    
    prompt = f"""你是"审讯室"游戏中的嫌疑人B。你需要根据以下场景编造一个不在场证明的故事。

场景：{state.scenario}

要求：
1. 详细描述你当晚的行踪，包括时间、地点、做了什么
2. 故事要有具体细节（时间、物品、人物等），这些细节可能被追问
3. 你可以编造1-2个小小的漏洞（比如记错时间、看错东西），但不要太多
4. 语气要自然，像个普通人回忆事情
5. 控制在150字以内

请直接输出你的故事，不要其他说明。"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_story = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.85, max_tokens=300):
        full_story += token
        yield token
    
    state.opponent_story = full_story.strip()
    state.messages.append(InterrogateMessage(speaker="opponent", content=f"我的故事：{state.opponent_story}"))


async def submit_player_story(session_id: str, story: str) -> None:
    """保存玩家故事"""
    state = _sessions.get(session_id)
    if not state:
        raise ValueError("Session not found")
    
    state.player_story = story.strip()
    state.messages.append(InterrogateMessage(speaker="player", content=f"我的故事：{state.player_story}"))


async def generate_detective_question(state: InterrogateDungeonState) -> AsyncGenerator[str, None]:
    """侦探生成问题，流式输出"""
    
    state.status = "interrogating"
    
    # 确定当前要问谁
    is_player_turn = state.current_question % 2 == 0
    target = "玩家" if is_player_turn else "嫌疑人B"
    target_story = state.player_story if is_player_turn else state.opponent_story
    
    # 构建历史对话
    history = ""
    for msg in state.messages:
        if msg.speaker == "detective":
            history += f"侦探问：{msg.content}\n"
        elif msg.speaker == "player":
            history += f"玩家答：{msg.content}\n"
        elif msg.speaker == "opponent":
            history += f"嫌疑人B答：{msg.content}\n"
    
    question_num = (state.current_question // 2) + 1
    total_questions = state.max_questions // 2
    
    prompt = f"""你是"审讯室"游戏中的侦探。你需要通过提问找出谁在说谎。

场景：{state.scenario}

{target}的故事：{target_story}

历史问答：
{history}

当前是第{question_num}个问题（共{total_questions}个），你要问{target}。

要求：
1. 针对故事中的细节提问（时间、地点、物品、人物等）
2. 问题要具体，能检验故事的真实性
3. 如果之前的回答有可疑之处，可以追问
4. 控制在30字以内

请直接输出你的问题，不要其他说明。"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_question = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.8, max_tokens=100):
        full_question += token
        yield token
    
    state.messages.append(InterrogateMessage(speaker="detective", content=full_question.strip()))


async def submit_answer_and_analyze(session_id: str, answer: str) -> AsyncGenerator[str, None]:
    """提交回答并由侦探分析是否有漏洞，流式输出"""
    state = _sessions.get(session_id)
    if not state:
        raise ValueError("Session not found")
    
    # 确定当前是谁在回答
    is_player_turn = state.current_question % 2 == 0
    speaker = "player" if is_player_turn else "opponent"
    
    state.messages.append(InterrogateMessage(speaker=speaker, content=answer))
    
    # 构建完整上下文
    target_story = state.player_story if is_player_turn else state.opponent_story
    
    history = ""
    for msg in state.messages:
        if msg.speaker == "detective":
            history += f"侦探问：{msg.content}\n"
        elif msg.speaker == "player":
            history += f"玩家答：{msg.content}\n"
        elif msg.speaker == "opponent":
            history += f"嫌疑人B答：{msg.content}\n"
    
    prompt = f"""你是"审讯室"游戏中的侦探。你刚听完一个回答，需要分析其中是否有漏洞。

场景：{state.scenario}

被审问者的故事：{target_story}

问答记录：
{history}

要求：
1. 分析刚才的回答是否与之前的故事一致
2. 如果发现明显矛盾或不合理之处，指出漏洞
3. 如果没有发现漏洞，表示暂时合理
4. 控制在50字以内

请直接输出你的分析，格式为：
- 如果发现漏洞："发现漏洞！[具体问题]"
- 如果没发现漏洞："暂时合理，但我会继续调查。"

注意：要有一定概率发现漏洞，不要每次都放过。"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_analysis = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.7, max_tokens=150):
        full_analysis += token
        yield token
    
    analysis = full_analysis.strip()
    state.messages.append(InterrogateMessage(speaker="detective", content=analysis))
    
    # 统计漏洞
    if "漏洞" in analysis or "矛盾" in analysis or "不一致" in analysis:
        if is_player_turn:
            state.player_holes += 1
        else:
            state.opponent_holes += 1
    
    state.current_question += 1
    
    # 检查是否结束
    if state.current_question >= state.max_questions:
        state.status = "verdict"


async def generate_final_verdict(session_id: str) -> AsyncGenerator[str, None]:
    """生成最终判决，流式输出"""
    state = _sessions.get(session_id)
    if not state:
        raise ValueError("Session not found")
    
    prompt = f"""你是"审讯室"游戏中的侦探。审讯结束了，你需要做出最终判决。

场景：{state.scenario}

审讯结果：
- 玩家漏洞数：{state.player_holes}
- 嫌疑人B漏洞数：{state.opponent_holes}

要求：
1. 宣布谁的漏洞更少，谁就更可信
2. 简要说明判决理由
3. 漏洞少的人获胜
4. 最后一行必须是：【判决】玩家胜 或 【判决】嫌疑人B胜"""
    
    messages = [{"role": "user", "content": prompt}]
    
    full_verdict = ""
    async for token in chat_completion_stream(messages, model=LLM_MODEL_PLUS, temperature=0.7, max_tokens=200):
        full_verdict += token
        yield token
    
    verdict = full_verdict.strip()
    state.messages.append(InterrogateMessage(speaker="detective", content=verdict))
    
    # 判决结果
    if state.player_holes < state.opponent_holes:
        state.result = "win"
    elif state.player_holes > state.opponent_holes:
        state.result = "lose"
    else:
        # 平局，随机决定或看最后判决文本
        if "【判决】玩家胜" in verdict:
            state.result = "win"
        else:
            state.result = "lose"
    
    state.status = "finished"


def get_session(session_id: str) -> Optional[InterrogateDungeonState]:
    """获取 session 状态"""
    return _sessions.get(session_id)


def delete_session(session_id: str) -> bool:
    """删除 session"""
    if session_id in _sessions:
        del _sessions[session_id]
        return True
    return False
