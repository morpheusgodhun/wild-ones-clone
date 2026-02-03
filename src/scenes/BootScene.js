/**
 * BootScene
 * - Texture üretir
 * - Menüye geçer
 */


import Phaser from 'phaser';
import TextureFactory from '../utils/TextureFactory.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    TextureFactory.generateAll(this);
    this.scene.start('MenuScene');
  }
}

export default BootScene;
