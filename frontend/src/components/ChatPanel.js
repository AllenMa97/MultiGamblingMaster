/**
 * 对话面板组件
 * 用于 AI 辩论副本中的聊天界面
 */

// 角色颜色配置
const ROLE_COLORS = {
  player: '#4FC3F7',   // 蓝色 - 玩家
  opponent: '#FF7043', // 橙色 - 对手
  judge: '#FFD54F',    // 金色 - 裁判
};

const ROLE_LABELS = {
  player: '[你]',
  opponent: '[对手]',
  judge: '[裁判]',
};

/**
 * 创建对话面板
 * @param {Phaser.Scene} scene - Phaser 场景
 * @param {number} x - 面板 x 坐标
 * @param {number} y - 面板 y 坐标
 * @param {number} width - 面板宽度
 * @param {number} height - 面板高度
 * @returns {Object} 面板对象，包含 addMessage, appendToLast, clear 方法
 */
export function createChatPanel(scene, x, y, width, height) {
  // 创建容器
  const container = scene.add.container(x, y);
  
  // 绘制背景
  const graphics = scene.add.graphics();
  graphics.fillStyle(0x000000, 0.7);
  graphics.fillRoundedRect(0, 0, width, height, 10);
  graphics.lineStyle(2, 0x444444, 1);
  graphics.strokeRoundedRect(0, 0, width, height, 10);
  container.add(graphics);
  
  // 标题
  const title = scene.add.text(15, 10, '辩论记录', {
    fontSize: '18px',
    fontFamily: 'Arial',
    color: '#ffffff',
    fontStyle: 'bold',
  });
  container.add(title);
  
  // 消息区域（使用容器来管理消息）
  const messageContainer = scene.add.container(0, 40);
  container.add(messageContainer);
  
  // 消息列表
  const messages = [];
  const messageTexts = [];
  
  // 可用高度（减去标题和边距）
  const availableHeight = height - 50;
  
  /**
   * 添加一条消息
   * @param {string} role - 角色：player/opponent/judge
   * @param {string} text - 消息内容
   */
  function addMessage(role, text) {
    const color = ROLE_COLORS[role] || '#ffffff';
    const label = ROLE_LABELS[role] || '[未知]';
    
    // 计算新消息的 y 位置
    let newY = 0;
    for (const msg of messageTexts) {
      newY += msg.height + 10;
    }
    
    // 创建标签文本
    const labelText = scene.add.text(15, newY, label, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: color,
      fontStyle: 'bold',
    });
    
    // 创建消息文本（支持自动换行）
    const maxWidth = width - 30;
    const contentText = scene.add.text(15 + labelText.width + 5, newY, text, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: maxWidth - labelText.width - 10 },
    });
    
    // 将标签和内容组合
    const messageObj = scene.add.container(0, 0);
    messageObj.add([labelText, contentText]);
    messageObj.height = Math.max(labelText.height, contentText.height);
    
    messageContainer.add(messageObj);
    messageTexts.push(messageObj);
    messages.push({ role, text, container: messageObj });
    
    // 自动滚动
    updateScroll();
    
    return messageObj;
  }
  
  /**
   * 追加文字到最后一条消息
   * @param {string} text - 要追加的文字
   */
  function appendToLast(text) {
    if (messageTexts.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    const lastContainer = lastMessage.container;
    
    // 获取内容文本对象（第二个子对象）
    const contentText = lastContainer.list[1];
    contentText.text += text;
    
    // 更新高度
    lastContainer.height = Math.max(
      lastContainer.list[0].height,
      contentText.height
    );
    
    // 重新布局后续消息
    relayoutMessages();
    updateScroll();
  }
  
  /**
   * 重新布局所有消息
   */
  function relayoutMessages() {
    let currentY = 0;
    for (let i = 0; i < messageTexts.length; i++) {
      const msg = messageTexts[i];
      msg.y = currentY;
      currentY += msg.height + 10;
    }
  }
  
  /**
   * 更新滚动位置
   */
  function updateScroll() {
    // 计算总高度
    let totalHeight = 0;
    for (const msg of messageTexts) {
      totalHeight += msg.height + 10;
    }
    
    // 如果超出可用高度，向上滚动
    if (totalHeight > availableHeight) {
      const offset = totalHeight - availableHeight;
      messageContainer.y = 40 - offset;
    } else {
      messageContainer.y = 40;
    }
  }
  
  /**
   * 清空面板
   */
  function clear() {
    for (const msg of messageTexts) {
      msg.destroy();
    }
    messageTexts.length = 0;
    messages.length = 0;
    messageContainer.y = 40;
  }
  
  return {
    container,
    addMessage,
    appendToLast,
    clear,
  };
}

/**
 * 创建输入框
 * @param {Phaser.Scene} scene - Phaser 场景
 * @param {number} x - 输入框 x 坐标
 * @param {number} y - 输入框 y 坐标
 * @param {number} width - 输入框宽度
 * @param {function} onSubmit - 提交回调函数
 * @returns {Object} 输入框对象，包含 disable, enable 方法
 */
export function createInputBox(scene, x, y, width, onSubmit) {
  // 创建 DOM 输入框
  const inputElement = document.createElement('input');
  inputElement.type = 'text';
  inputElement.placeholder = '输入你的辩论发言...';
  inputElement.style.cssText = `
    width: ${width - 100}px;
    height: 40px;
    background-color: #2a2a3e;
    color: #ffffff;
    border: 2px solid #444444;
    border-radius: 8px;
    padding: 0 15px;
    font-size: 14px;
    font-family: Arial, sans-serif;
    outline: none;
  `;
  
  // 创建发送按钮
  const buttonElement = document.createElement('button');
  buttonElement.textContent = '发送';
  buttonElement.style.cssText = `
    width: 80px;
    height: 44px;
    margin-left: 10px;
    background-color: #4FC3F7;
    color: #1a1a2e;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  `;
  
  // 创建容器
  const containerElement = document.createElement('div');
  containerElement.style.cssText = `
    display: flex;
    align-items: center;
  `;
  containerElement.appendChild(inputElement);
  containerElement.appendChild(buttonElement);
  
  // 添加到 Phaser DOM
  const domElement = scene.add.dom(x, y, containerElement);
  domElement.setOrigin(0, 0.5);
  
  // 提交处理函数
  function handleSubmit() {
    const text = inputElement.value.trim();
    if (text && onSubmit) {
      onSubmit(text);
      inputElement.value = '';
    }
  }
  
  // 绑定事件
  inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  });
  
  buttonElement.addEventListener('click', handleSubmit);
  
  // 禁用/启用方法
  function disable() {
    inputElement.disabled = true;
    buttonElement.disabled = true;
    inputElement.style.opacity = '0.5';
    buttonElement.style.opacity = '0.5';
    buttonElement.style.cursor = 'not-allowed';
    inputElement.placeholder = '等待对手回复...';
  }
  
  function enable() {
    inputElement.disabled = false;
    buttonElement.disabled = false;
    inputElement.style.opacity = '1';
    buttonElement.style.opacity = '1';
    buttonElement.style.cursor = 'pointer';
    inputElement.placeholder = '输入你的辩论发言...';
    inputElement.focus();
  }
  
  return {
    domElement,
    disable,
    enable,
  };
}

/**
 * 创建回合指示器
 * @param {Phaser.Scene} scene - Phaser 场景
 * @param {number} x - x 坐标
 * @param {number} y - y 坐标
 * @returns {Object} 回合指示器对象，包含 setRound 方法
 */
export function createRoundIndicator(scene, x, y) {
  const text = scene.add.text(x, y, '第 1/3 轮', {
    fontSize: '24px',
    fontFamily: 'Arial',
    color: '#FFD54F',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  
  function setRound(current, max) {
    text.setText(`第 ${current}/${max} 轮`);
  }
  
  return {
    text,
    setRound,
  };
}
