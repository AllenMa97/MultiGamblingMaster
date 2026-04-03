import Phaser from 'phaser';
import { post } from '../utils/api.js';

/**
 * 动作指令副本场景
 * 玩家需要在限定时间内按正确顺序输入一系列指令
 */
export default class ActionDungeonScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ActionDungeonScene' });
  }

  init(data) {
    // 接收从地图传入的数据
    this.nodeId = data.nodeId || null;
    this.saveId = data.saveId || null;
    this.difficulty = data.difficulty || 1;
    
    // 游戏状态
    this.commands = []; // 指令序列
    this.sessionId = null;
    this.timeLimit = 0;
    this.currentIndex = 0; // 当前要输入的指令索引
    this.userInputs = []; // 用户已输入的指令
    this.startTime = 0;
    this.isGameActive = false;
    this.isGameOver = false;
    
    // UI 元素引用
    this.commandBoxes = []; // 指令框数组
    this.timerBar = null;
    this.timerBarBg = null;
    this.progressText = null;
    this.titleText = null;
    
    // 键盘映射
    this.keyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
    };
  }

  async create() {
    const { width, height } = this.scale;
    
    // 创建背景
    this.createBackground();
    
    // 显示标题
    this.titleText = this.add.text(width / 2, 60, '动作指令挑战', {
      fontSize: '42px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // 显示加载中
    const loadingText = this.add.text(width / 2, height / 2, '加载中...', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    
    // 调用后端开始副本
    try {
      const response = await post('/dungeon/action/start', { 
        difficulty: this.difficulty 
      });
      
      loadingText.destroy();
      
      this.commands = response.commands;
      this.sessionId = response.session_id;
      this.timeLimit = response.time_limit;
      
      // 开始游戏
      this.startGame();
    } catch (error) {
      console.error('开始副本失败:', error);
      loadingText.setText('加载失败，请重试');
      loadingText.setColor('#ff6b6b');
      
      // 2秒后返回
      this.time.delayedCall(2000, () => {
        this.returnToMap();
      });
    }
  }

  createBackground() {
    // 深色渐变背景
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
  }

  startGame() {
    this.isGameActive = true;
    this.startTime = this.time.now;
    this.currentIndex = 0;
    this.userInputs = [];
    
    // 创建倒计时条
    this.createTimerBar();
    
    // 显示指令序列
    this.displayCommands();
    
    // 显示进度
    this.updateProgressText();
    
    // 设置键盘监听
    this.setupKeyboardInput();
    
    // 启动倒计时更新
    this.time.addEvent({
      delay: 50,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  createTimerBar() {
    const { width } = this.scale;
    const barWidth = 600;
    const barHeight = 20;
    const x = (width - barWidth) / 2;
    const y = 120;
    
    // 背景条
    this.timerBarBg = this.add.graphics();
    this.timerBarBg.fillStyle(0x333333, 1);
    this.timerBarBg.fillRoundedRect(x, y, barWidth, barHeight, 10);
    
    // 进度条
    this.timerBar = this.add.graphics();
    this.updateTimerBar(1.0); // 初始满值
  }

  updateTimerBar(progress) {
    const { width } = this.scale;
    const barWidth = 600;
    const barHeight = 20;
    const x = (width - barWidth) / 2;
    const y = 120;
    
    this.timerBar.clear();
    
    // 根据进度改变颜色
    let color;
    if (progress > 0.5) {
      color = 0x4ade80; // 绿色
    } else if (progress > 0.25) {
      color = 0xfacc15; // 黄色
    } else {
      color = 0xef4444; // 红色
    }
    
    const currentWidth = Math.max(0, barWidth * progress);
    this.timerBar.fillStyle(color, 1);
    this.timerBar.fillRoundedRect(x, y, currentWidth, barHeight, 10);
  }

  displayCommands() {
    const { width, height } = this.scale;
    
    // 计算布局
    const boxSize = 70;
    const boxSpacing = 15;
    const totalWidth = this.commands.length * (boxSize + boxSpacing) - boxSpacing;
    const startX = (width - totalWidth) / 2 + boxSize / 2;
    const y = height / 2;
    
    this.commandBoxes = [];
    
    this.commands.forEach((cmd, index) => {
      const x = startX + index * (boxSize + boxSpacing);
      
      // 创建指令框
      const box = this.createCommandBox(x, y, boxSize, cmd, index);
      this.commandBoxes.push(box);
    });
    
    // 高亮第一个指令
    this.highlightCurrentCommand();
  }

  createCommandBox(x, y, size, cmd, index) {
    const container = this.add.container(x, y);
    
    // 背景框
    const bg = this.add.graphics();
    bg.fillStyle(0x2d3748, 1);
    bg.fillRoundedRect(-size / 2, -size / 2, size, size, 12);
    bg.lineStyle(3, 0x4a5568, 1);
    bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 12);
    
    // 指令文字
    const text = this.add.text(0, 0, cmd.display, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    container.add([bg, text]);
    
    return {
      container,
      bg,
      text,
      index,
      command: cmd,
    };
  }

  highlightCurrentCommand() {
    // 重置所有框的边框
    this.commandBoxes.forEach((box, index) => {
      box.bg.clear();
      
      if (index < this.currentIndex) {
        // 已完成的 - 绿色背景
        box.bg.fillStyle(0x22c55e, 1);
        box.bg.fillRoundedRect(-35, -35, 70, 70, 12);
        box.bg.lineStyle(3, 0x16a34a, 1);
        box.bg.strokeRoundedRect(-35, -35, 70, 70, 12);
        box.text.setColor('#ffffff');
      } else if (index === this.currentIndex && this.isGameActive) {
        // 当前要输入的 - 黄色边框高亮
        box.bg.fillStyle(0x2d3748, 1);
        box.bg.fillRoundedRect(-35, -35, 70, 70, 12);
        box.bg.lineStyle(4, 0xfacc15, 1);
        box.bg.strokeRoundedRect(-35, -35, 70, 70, 12);
        box.text.setColor('#facc15');
      } else {
        // 未输入的 - 默认样式
        box.bg.fillStyle(0x2d3748, 1);
        box.bg.fillRoundedRect(-35, -35, 70, 70, 12);
        box.bg.lineStyle(3, 0x4a5568, 1);
        box.bg.strokeRoundedRect(-35, -35, 70, 70, 12);
        box.text.setColor('#ffffff');
      }
    });
  }

  updateProgressText() {
    if (this.progressText) {
      this.progressText.destroy();
    }
    
    const { width, height } = this.scale;
    
    this.progressText = this.add.text(
      width / 2,
      height / 2 + 100,
      `${this.currentIndex}/${this.commands.length}`,
      {
        fontSize: '28px',
        fontFamily: 'Arial',
        color: '#aaaaaa',
      }
    ).setOrigin(0.5);
  }

  setupKeyboardInput() {
    // 监听所有键盘事件
    this.input.keyboard.on('keydown', (event) => {
      if (!this.isGameActive || this.isGameOver) {
        return;
      }
      
      const key = this.normalizeKey(event.code);
      if (key) {
        this.handleInput(key);
      }
    });
  }

  normalizeKey(code) {
    // 方向键映射
    if (this.keyMap[code]) {
      return this.keyMap[code];
    }
    
    // 字母键 (KeyA - KeyZ)
    if (code.startsWith('Key') && code.length === 4) {
      return code[3].toLowerCase();
    }
    
    return null;
  }

  handleInput(input) {
    if (this.currentIndex >= this.commands.length) {
      return;
    }
    
    const expectedCommand = this.commands[this.currentIndex];
    
    if (input === expectedCommand.value) {
      // 输入正确
      this.userInputs.push(input);
      this.currentIndex++;
      
      // 更新显示
      this.highlightCurrentCommand();
      this.updateProgressText();
      
      // 检查是否全部完成
      if (this.currentIndex >= this.commands.length) {
        this.gameSuccess();
      }
    } else {
      // 输入错误 - 闪烁红色
      this.flashError();
      this.gameFailure('wrong');
    }
  }

  flashError() {
    const currentBox = this.commandBoxes[this.currentIndex];
    if (currentBox) {
      // 闪烁红色效果
      currentBox.bg.clear();
      currentBox.bg.fillStyle(0xef4444, 1);
      currentBox.bg.fillRoundedRect(-35, -35, 70, 70, 12);
      currentBox.bg.lineStyle(4, 0xdc2626, 1);
      currentBox.bg.strokeRoundedRect(-35, -35, 70, 70, 12);
      
      // 200ms 后恢复
      this.time.delayedCall(200, () => {
        if (!this.isGameOver) {
          this.highlightCurrentCommand();
        }
      });
    }
  }

  updateTimer() {
    if (!this.isGameActive || this.isGameOver) {
      return;
    }
    
    const elapsed = (this.time.now - this.startTime) / 1000; // 转换为秒
    const remaining = Math.max(0, this.timeLimit - elapsed);
    const progress = remaining / this.timeLimit;
    
    this.updateTimerBar(progress);
    
    // 检查是否超时
    if (remaining <= 0) {
      this.gameFailure('timeout');
    }
  }

  async gameSuccess() {
    this.isGameActive = false;
    this.isGameOver = true;
    
    const timeUsed = (this.time.now - this.startTime) / 1000;
    
    // 提交结果
    try {
      await this.submitResult(timeUsed);
    } catch (error) {
      console.error('提交结果失败:', error);
    }
    
    // 显示成功画面
    this.showResultScreen(true, timeUsed);
  }

  async gameFailure(reason) {
    this.isGameActive = false;
    this.isGameOver = true;
    
    const timeUsed = (this.time.now - this.startTime) / 1000;
    
    // 提交结果
    try {
      await this.submitResult(timeUsed);
    } catch (error) {
      console.error('提交结果失败:', error);
    }
    
    // 显示失败画面
    this.showResultScreen(false, timeUsed, reason);
  }

  async submitResult(timeUsed) {
    const result = await post('/dungeon/action/submit', {
      session_id: this.sessionId,
      inputs: this.userInputs,
      time_used: timeUsed,
    });
    
    console.log('提交结果:', result);
    return result;
  }

  showResultScreen(isSuccess, timeUsed, reason = null) {
    const { width, height } = this.scale;
    
    // 半透明遮罩
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    
    // 结果文字
    const resultText = isSuccess ? '挑战成功!' : '挑战失败!';
    const resultColor = isSuccess ? '#4ade80' : '#ef4444';
    
    const title = this.add.text(width / 2, height / 2 - 50, resultText, {
      fontSize: '56px',
      fontFamily: 'Arial',
      color: resultColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // 详细信息
    let detailText;
    if (isSuccess) {
      detailText = `完成时间: ${timeUsed.toFixed(2)} 秒`;
    } else {
      if (reason === 'timeout') {
        detailText = '时间耗尽!';
      } else {
        detailText = `输入错误! 进度: ${this.currentIndex}/${this.commands.length}`;
      }
    }
    
    const detail = this.add.text(width / 2, height / 2 + 30, detailText, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    
    // 2秒后显示返回按钮
    this.time.delayedCall(2000, () => {
      this.createReturnButton();
    });
  }

  createReturnButton() {
    const { width, height } = this.scale;
    
    const buttonWidth = 200;
    const buttonHeight = 50;
    const x = (width - buttonWidth) / 2;
    const y = height / 2 + 120;
    
    // 按钮背景
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x3b82f6, 1);
    buttonBg.fillRoundedRect(x, y, buttonWidth, buttonHeight, 10);
    
    // 按钮文字
    const buttonText = this.add.text(
      width / 2,
      y + buttonHeight / 2,
      '返回地图',
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      }
    ).setOrigin(0.5);
    
    // 按钮交互区域
    const hitArea = this.add.zone(
      width / 2,
      y + buttonHeight / 2,
      buttonWidth,
      buttonHeight
    ).setInteractive({ useHandCursor: true });
    
    // 悬停效果
    hitArea.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x2563eb, 1);
      buttonBg.fillRoundedRect(x, y, buttonWidth, buttonHeight, 10);
    });
    
    hitArea.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x3b82f6, 1);
      buttonBg.fillRoundedRect(x, y, buttonWidth, buttonHeight, 10);
    });
    
    // 点击事件
    hitArea.on('pointerdown', () => {
      this.returnToMap();
    });
  }

  returnToMap() {
    // 清理资源
    this.input.keyboard.removeAllListeners();
    
    // 判断是否胜利
    const won = this.isGameOver && this.userInputs.length === this.commands.length;
    
    // 返回地图场景
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MapScene', {
        saveId: this.saveId,
        nodeId: this.nodeId,
        dungeonResult: won ? 'win' : 'lose',
        completed: won,
        mapId: this.mapId,
      });
    });
  }
}
