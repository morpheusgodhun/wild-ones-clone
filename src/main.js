/**
 * Main Entry
 * - Phaser game başlatır
 */

import Phaser from 'phaser';
import config from './config/GameConfig.js';

import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

// Loading ekranını kaldır
window.addEventListener('load', () => {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    setTimeout(() => (loadingEl.style.display = 'none'), 450);
  }
});

// Scene sırası
config.scene = [BootScene, MenuScene, GameScene];

const game = new Phaser.Game(config);

// Debug erişim
window.game = game;

export default game;
