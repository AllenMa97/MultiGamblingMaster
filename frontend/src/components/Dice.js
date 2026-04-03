import Phaser from 'phaser';

/**
 * 创建骰子组件
 * @param {Phaser.Scene} scene - Phaser 场景
 * @param {number} x - x 坐标
 * @param {number} y - y 坐标
 * @param {Function} onClick - 点击回调函数
 * @returns {Object} 骰子对象
 */
export function createDice(scene, x, y, onClick) {
  // 创建容器
  const container = scene.add.container(x, y);

  // 骰子背景（白色圆角正方形）
  const bg = scene.add.graphics();
  bg.fillStyle(0xffffff, 1);
  bg.fillRoundedRect(-40, -40, 80, 80, 12);
  bg.lineStyle(3, 0xcccccc, 1);
  bg.strokeRoundedRect(-40, -40, 80, 80, 12);

  // 骰子点数文字（初始显示 "?"）
  const text = scene.add.text(0, 0, '?', {
    fontSize: '36px',
    fontFamily: 'Arial, sans-serif',
    color: '#333333',
    fontStyle: 'bold',
  }).setOrigin(0.5);

  container.add([bg, text]);

  // 设置交互
  const hitArea = new Phaser.Geom.Rectangle(-40, -40, 80, 80);
  container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
  container.setInteractive({ useHandCursor: true });

  let isEnabled = true;
  let isAnimating = false;

  // 点击事件
  container.on('pointerdown', () => {
    if (isEnabled && !isAnimating && onClick) {
      // 播放旋转/抖动动画
      isAnimating = true;
      scene.tweens.add({
        targets: container,
        angle: { from: 0, to: 360 },
        scaleX: { from: 1, to: 0.8, to: 1 },
        scaleY: { from: 1, to: 0.8, to: 1 },
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          isAnimating = false;
          container.setAngle(0);
        },
      });
      onClick();
    }
  });

  // 悬停效果
  container.on('pointerover', () => {
    if (isEnabled && !isAnimating) {
      container.setScale(1.1);
      bg.clear();
      bg.fillStyle(0xf0f0f0, 1);
      bg.fillRoundedRect(-40, -40, 80, 80, 12);
      bg.lineStyle(3, 0x3b82f6, 1);
      bg.strokeRoundedRect(-40, -40, 80, 80, 12);
    }
  });

  container.on('pointerout', () => {
    if (isEnabled && !isAnimating) {
      container.setScale(1);
      bg.clear();
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(-40, -40, 80, 80, 12);
      bg.lineStyle(3, 0xcccccc, 1);
      bg.strokeRoundedRect(-40, -40, 80, 80, 12);
    }
  });

  // 返回对象
  return {
    container,
    /**
     * 显示骰子结果
     * @param {number} value - 骰子点数 (1-6)
     */
    showResult(value) {
      text.setText(value.toString());
      // 结果闪现动画
      scene.tweens.add({
        targets: text,
        scale: { from: 2, to: 1 },
        duration: 300,
        ease: 'Back.out',
      });
    },
    /**
     * 重置骰子显示
     */
    reset() {
      text.setText('?');
      text.setScale(1);
    },
    /**
     * 启用骰子点击
     */
    enable() {
      isEnabled = true;
      container.setAlpha(1);
      container.setInteractive({ useHandCursor: true });
    },
    /**
     * 禁用骰子点击
     */
    disable() {
      isEnabled = false;
      container.setAlpha(0.5);
      container.disableInteractive();
    },
    /**
     * 检查是否启用
     */
    isEnabled() {
      return isEnabled;
    },
  };
}
