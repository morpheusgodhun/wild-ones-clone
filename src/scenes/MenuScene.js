/**
 * MenuScene (Setup)
 * - Her takım için hayvan seçimi (TEAM_SIZE adet slot)
 */


import Phaser from 'phaser';
import { GAME_CONFIG, TEAMS, ANIMALS, GAMEPLAY } from '../config/Constants.js';
import TextureFactory from '../utils/TextureFactory.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Arka plan
    this.drawBackground();

    this.add.text(GAME_CONFIG.WIDTH / 2, 70, 'Animal Select', {
      fontSize: '56px',
      fontStyle: '900',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 10
    }).setOrigin(0.5);

    this.add.text(GAME_CONFIG.WIDTH / 2, 125,
      'Kısayol: SPACE basılı tut = güç doldur, bırak = ateş. Q/E = silah.',
      {
        fontSize: '16px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        alpha: 0.9
      }
    ).setOrigin(0.5);

    // Default loadout (random)
    const animalIds = ANIMALS.map(a => a.id);
    const pick = () => Phaser.Utils.Array.GetRandom(animalIds);

    this.selection = {
      red: Array.from({ length: GAMEPLAY.TEAM_SIZE }, () => pick()),
      blue: Array.from({ length: GAMEPLAY.TEAM_SIZE }, () => pick())
    };

    // UI
    this.drawTeamColumn(TEAMS.RED, 'red', GAME_CONFIG.WIDTH * 0.25);
    this.drawTeamColumn(TEAMS.BLUE, 'blue', GAME_CONFIG.WIDTH * 0.75);

    // Buttons
    this.createButtons();
  }

  drawBackground() {
    const g = this.add.graphics();
    // basit gradient hissi için çoklu rect
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        new Phaser.Display.Color(43, 124, 255),
        new Phaser.Display.Color(11, 27, 58),
        steps - 1,
        i
      );
      const col = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
      g.fillStyle(col, 1);
      g.fillRect(0, (GAME_CONFIG.HEIGHT / steps) * i, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / steps + 2);
    }

    // Bulutlar
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(80, GAME_CONFIG.WIDTH - 80);
      const y = Phaser.Math.Between(90, 240);
      const w = Phaser.Math.Between(100, 180);
      const h = Phaser.Math.Between(30, 60);
      const cloud = this.add.ellipse(x, y, w, h, 0xFFFFFF, 0.12);
      cloud.setDepth(1);
    }
  }

  drawTeamColumn(team, key, centerX) {
    this.add.text(centerX, 175, team.name, {
      fontSize: '26px',
      fontStyle: '800',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const startY = 250;
    const gap = 135;

    this[key] = {
      previews: [],
      labels: []
    };

    for (let i = 0; i < GAMEPLAY.TEAM_SIZE; i++) {
      const y = startY + i * gap;

      const animalId = this.selection[key][i];
      const tex = TextureFactory.getCharacterKey(team.id, animalId);

      const preview = this.add.image(centerX, y, tex).setOrigin(0.5);
      preview.setDisplaySize(92, 92);
      preview.setDepth(5);

      const label = this.add.text(centerX, y + 62, this.getAnimalName(animalId), {
        fontSize: '16px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 4,
        alpha: 0.92
      }).setOrigin(0.5);

      // left/right arrows
      const left = this.add.text(centerX - 90, y, '◀', {
        fontSize: '32px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const right = this.add.text(centerX + 90, y, '▶', {
        fontSize: '32px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      left.on('pointerdown', () => this.cycleAnimal(key, team.id, i, -1));
      right.on('pointerdown', () => this.cycleAnimal(key, team.id, i, 1));

      // hover
      [left, right].forEach(btn => {
        btn.on('pointerover', () => btn.setScale(1.1));
        btn.on('pointerout', () => btn.setScale(1));
      });

      this[key].previews.push(preview);
      this[key].labels.push(label);
    }
  }

  createButtons() {
    const startBtn = this.makeButton(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 95, 'START', () => {
      this.scene.start('GameScene', { loadout: this.selection });
    });

    const rndBtn = this.makeButton(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 40, 'RANDOMIZE', () => {
      const animalIds = ANIMALS.map(a => a.id);
      const pick = () => Phaser.Utils.Array.GetRandom(animalIds);

      this.selection.red = Array.from({ length: GAMEPLAY.TEAM_SIZE }, () => pick());
      this.selection.blue = Array.from({ length: GAMEPLAY.TEAM_SIZE }, () => pick());

      this.refreshColumn('red', TEAMS.RED.id);
      this.refreshColumn('blue', TEAMS.BLUE.id);
    }, { scale: 0.82, alpha: 0.85 });

    startBtn.setDepth(10);
    rndBtn.setDepth(10);
  }

  makeButton(x, y, text, onClick, opts = {}) {
    const btn = this.add.text(x, y, text, {
      fontSize: '30px',
      fontStyle: '900',
      color: '#FFFFFF',
      backgroundColor: '#00000055',
      padding: { x: 18, y: 10 },
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    if (opts.scale) btn.setScale(opts.scale);
    if (opts.alpha) btn.setAlpha(opts.alpha);

    btn.on('pointerdown', onClick);
    btn.on('pointerover', () => btn.setScale((opts.scale ?? 1) * 1.04));
    btn.on('pointerout', () => btn.setScale(opts.scale ?? 1));

    return btn;
  }

  refreshColumn(key, teamId) {
    for (let i = 0; i < GAMEPLAY.TEAM_SIZE; i++) {
      const animalId = this.selection[key][i];
      const tex = TextureFactory.getCharacterKey(teamId, animalId);
      this[key].previews[i].setTexture(tex);
      this[key].labels[i].setText(this.getAnimalName(animalId));
    }
  }

  cycleAnimal(key, teamId, slotIndex, dir) {
    const ids = ANIMALS.map(a => a.id);
    const current = this.selection[key][slotIndex];
    let idx = ids.indexOf(current);
    if (idx === -1) idx = 0;

    idx = (idx + dir + ids.length) % ids.length;
    const next = ids[idx];

    this.selection[key][slotIndex] = next;

    const tex = TextureFactory.getCharacterKey(teamId, next);
    this[key].previews[slotIndex].setTexture(tex);
    this[key].labels[slotIndex].setText(this.getAnimalName(next));
  }

  getAnimalName(animalId) {
    const found = ANIMALS.find(a => a.id === animalId);
    return found ? found.name : animalId;
  }
}

export default MenuScene;
