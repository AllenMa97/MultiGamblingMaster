import Phaser from 'phaser';
import { get } from '../utils/api.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 标题文字
    this.add.text(width / 2, height / 2 - 50, '多副本棋盘冒险', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 加载中文字
    this.loadingText = this.add.text(width / 2, height / 2 + 30, '加载中...', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // 调用后端健康检查
    this.checkHealth();
  }

  async checkHealth() {
    try {
      const response = await get('/health');
      if (response.status === 'ok') {
        this.loadingText.setText('连接成功');
        this.loadingText.setColor('#4ade80');
        
        // 延迟1秒后显示开始游戏按钮
        this.time.delayedCall(1000, () => {
          this.createStartButton();
        });
      } else {
        this.loadingText.setText('连接异常');
        this.loadingText.setColor('#f87171');
      }
    } catch (error) {
      console.error('健康检查失败:', error);
      this.loadingText.setText('连接失败，请检查后端服务');
      this.loadingText.setColor('#f87171');
    }
  }

  createStartButton() {
    const { width, height } = this.scale;
    
    // 隐藏加载文字
    this.loadingText.setVisible(false);
    
    // 创建开始游戏按钮
    const buttonContainer = this.add.container(width / 2, height / 2 + 50);
    
    // 按钮背景
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x3b82f6, 1);
    buttonBg.fillRoundedRect(-100, -30, 200, 60, 12);
    
    // 按钮文字
    const buttonText = this.add.text(0, 0, '开始游戏', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    buttonContainer.add([buttonBg, buttonText]);
    
    // 设置交互
    const hitArea = new Phaser.Geom.Rectangle(-100, -30, 200, 60);
    buttonContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    buttonContainer.setInteractive({ useHandCursor: true });
    
    // 悬停效果
    buttonContainer.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x2563eb, 1);
      buttonBg.fillRoundedRect(-100, -30, 200, 60, 12);
      buttonContainer.setScale(1.05);
    });
    
    buttonContainer.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x3b82f6, 1);
      buttonBg.fillRoundedRect(-100, -30, 200, 60, 12);
      buttonContainer.setScale(1);
    });
    
    // 点击事件 - 跳转到主菜单场景
    buttonContainer.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    });
    
    // 入场动画
    buttonContainer.setAlpha(0);
    buttonContainer.setY(height / 2 + 80);
    this.tweens.add({
      targets: buttonContainer,
      alpha: 1,
      y: height / 2 + 50,
      duration: 300,
      ease: 'Power2',
    });
  }
}
