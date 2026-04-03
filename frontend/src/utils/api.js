const BASE_URL = '/api';

/**
 * 封装 fetch GET 请求
 * @param {string} endpoint - API 端点（不含 /api 前缀）
 * @returns {Promise<any>}
 */
export async function get(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * 封装 fetch POST 请求
 * @param {string} endpoint - API 端点（不含 /api 前缀）
 * @param {object} data - 请求体数据
 * @returns {Promise<any>}
 */
export async function post(endpoint, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * 封装 fetch PUT 请求
 * @param {string} endpoint - API 端点（不含 /api 前缀）
 * @param {object} data - 请求体数据
 * @returns {Promise<any>}
 */
export async function put(endpoint, data) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * WebSocket 连接工厂函数
 * @param {string} path - WebSocket 路径（不含 /ws 前缀）
 * @returns {WebSocket}
 */
export function createWebSocket(path = '') {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws${path}`;
  return new WebSocket(wsUrl);
}
