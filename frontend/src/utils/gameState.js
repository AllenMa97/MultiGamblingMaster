/**
 * 游戏状态管理工具
 * 提供与后端游戏存档相关的 API 调用功能
 */
import { get, post, put } from './api.js';

/**
 * 创建新游戏
 * @param {string} playerName - 玩家名称
 * @returns {Promise<Object>} 新创建的游戏状态
 */
export async function createNewGame(playerName = '玩家') {
  return post('/game/new', { player_name: playerName });
}

/**
 * 加载存档
 * @param {string} saveId - 存档ID
 * @returns {Promise<Object>} 游戏状态
 */
export async function loadGame(saveId) {
  return get(`/game/load/${saveId}`);
}

/**
 * 保存游戏
 * @param {string} saveId - 存档ID
 * @param {Object} gameState - 游戏状态对象
 * @returns {Promise<Object>} 保存后的游戏状态
 */
export async function saveGame(saveId, gameState) {
  return put(`/game/save/${saveId}`, gameState);
}

/**
 * 获取存档列表
 * @returns {Promise<Array>} 存档列表
 */
export async function listSaves() {
  return get('/game/saves');
}

/**
 * 删除存档
 * @param {string} saveId - 存档ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteGame(saveId) {
  const response = await fetch(`/api/game/delete/${saveId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * 更新位置和战绩
 * @param {string} saveId - 存档ID
 * @param {number} position - 新位置
 * @param {boolean} won - 是否胜利
 * @param {number} nodeId - 格子ID
 * @returns {Promise<Object>} 更新后的游戏状态
 */
export async function updatePosition(saveId, position, won, nodeId) {
  return put(`/game/update-position/${saveId}`, {
    position,
    won,
    node_id: nodeId
  });
}

/**
 * 添加骰子记录
 * @param {string} saveId - 存档ID
 * @param {number} diceValue - 骰子点数
 * @returns {Promise<Object>} 更新后的游戏状态
 */
export async function addDiceRoll(saveId, diceValue) {
  return put(`/game/add-dice/${saveId}`, {
    dice_value: diceValue
  });
}

/**
 * 游戏状态管理器类
 * 提供更方便的状态管理接口
 */
export class GameStateManager {
  constructor() {
    this.currentState = null;
    this.saveId = null;
  }

  /**
   * 创建新游戏
   * @param {string} playerName - 玩家名称
   */
  async createNew(playerName = '玩家') {
    this.currentState = await createNewGame(playerName);
    this.saveId = this.currentState.save_id;
    return this.currentState;
  }

  /**
   * 加载游戏
   * @param {string} saveId - 存档ID
   */
  async load(saveId) {
    this.currentState = await loadGame(saveId);
    this.saveId = this.currentState.save_id;
    return this.currentState;
  }

  /**
   * 保存当前游戏
   */
  async save() {
    if (!this.currentState || !this.saveId) {
      throw new Error('没有可保存的游戏状态');
    }
    this.currentState = await saveGame(this.saveId, this.currentState);
    return this.currentState;
  }

  /**
   * 更新位置
   * @param {number} position - 新位置
   * @param {boolean} won - 是否胜利
   * @param {number} nodeId - 格子ID
   */
  async moveTo(position, won, nodeId) {
    if (!this.saveId) {
      throw new Error('没有加载的游戏');
    }
    this.currentState = await updatePosition(this.saveId, position, won, nodeId);
    return this.currentState;
  }

  /**
   * 添加骰子记录
   * @param {number} diceValue - 骰子点数
   */
  async rollDice(diceValue) {
    if (!this.saveId) {
      throw new Error('没有加载的游戏');
    }
    this.currentState = await addDiceRoll(this.saveId, diceValue);
    return this.currentState;
  }

  /**
   * 获取当前状态
   */
  getState() {
    return this.currentState;
  }

  /**
   * 获取存档ID
   */
  getSaveId() {
    return this.saveId;
  }

  /**
   * 清除当前状态
   */
  clear() {
    this.currentState = null;
    this.saveId = null;
  }
}

// 导出默认实例
export const gameStateManager = new GameStateManager();
