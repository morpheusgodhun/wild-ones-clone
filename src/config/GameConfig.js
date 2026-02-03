/**
 * Phaser 3 Game Configuration (Matter.js)
 */

import { GAME_CONFIG, PHYSICS } from './Constants.js';

export default {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  backgroundColor: '#0b1b3a',
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: PHYSICS.GRAVITY_Y },
      enableSleep: true,
      debug: false
    }
  },
  scene: [],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false
  }
};
