import os
from dotenv import load_dotenv

# 从项目根目录加载环境变量
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# 解析多个API Key（逗号分隔）
_api_keys_str = os.getenv('DASHSCOPE_API_KEYS', '')
API_KEYS = [key.strip() for key in _api_keys_str.split(',') if key.strip()]

# 向后兼容：单个API Key取列表第一个
DASHSCOPE_API_KEY = API_KEYS[0] if API_KEYS else os.getenv('DASHSCOPE_API_KEY', '')

# 配置导出
DASHSCOPE_BASE_URL = os.getenv('DASHSCOPE_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1')
LLM_MODEL_FAST = os.getenv('LLM_MODEL_FAST', 'qwen-flash')
LLM_MODEL_PLUS = os.getenv('LLM_MODEL_PLUS', 'qwen-plus')

# 向后兼容：保留LLM_MODEL
LLM_MODEL = LLM_MODEL_PLUS
