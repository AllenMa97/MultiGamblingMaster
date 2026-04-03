import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import MapScene from './scenes/MapScene.js';
import CardDungeonScene from './scenes/CardDungeonScene.js';
import ActionDungeonScene from './scenes/ActionDungeonScene.js';
import AIDungeonScene from './scenes/AIDungeonScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  scene: [BootScene, MainMenuScene, MapScene, CardDungeonScene, ActionDungeonScene, AIDungeonScene],
};

const game = new Phaser.Game(config);

export default game;
