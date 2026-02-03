/**
 * GameScene - Ana oyun sahnesi
 * - Aiming: pointer.worldX/worldY kullanır (kamera pan/scale bozulmasın)
 * - Projectile'lar sprite ile gelir, render 'yerde/0,0' bug'ı çözülür
 * - Hayvan seçimi loadout ile gelir
 */


import Phaser from 'phaser';
import { GAME_CONFIG, PHYSICS, GAMEPLAY, TEAMS, WEAPONS, COLORS, GAME_STATES, ANIMALS } from '../config/Constants.js';
import Character from '../entities/Character.js';
import TurnManager from '../managers/TurnManager.js';
import Bazooka from '../weapons/Bazooka.js';
import Grenade from '../weapons/Grenade.js';
import EventBus, { EVENTS } from '../utils/EventBus.js';
import TextureFactory from '../utils/TextureFactory.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.loadout = data?.loadout || null;
  }

  create() {
    // Managers
    this.turnManager = new TurnManager(this);

    // Collections
    this.teams = [[], []];
    this.allCharacters = [];
    this.projectiles = new Set();

    // State
    this.wind = 0;
    this.currentPower = GAMEPLAY.MIN_POWER;
    this.currentAngle = -Math.PI / 4;
    this.isCharging = false;

    // for settle detection
    this.lastImpactTime = this.time.now;

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,Q,E,SPACE');

    // Camera
    this.cameras.main.setBounds(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // Background
    this.drawSky();

    // World + collisions
    this.createWorld();
    this.setupCollisionRouting();

    // Characters
    this.createCharacters();

    // UI
    this.createUI();

    // Input + Events
    this.setupInputHandlers();
    this.setupEventListeners();

    // Start game
    this.startGame();
    this.setWind();
  }

  drawSky() {
    const g = this.add.graphics();
    const steps = 22;

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
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(80, GAME_CONFIG.WIDTH - 80);
      const y = Phaser.Math.Between(80, 260);
      const w = Phaser.Math.Between(110, 220);
      const h = Phaser.Math.Between(28, 62);
      const cloud = this.add.ellipse(x, y, w, h, 0xFFFFFF, 0.10);
      cloud.setDepth(0);
    }
  }

  createWorld() {
    const groundHeight = 120;
    const groundY = GAME_CONFIG.HEIGHT - groundHeight / 2;

    // Static ground body
    this.groundBody = this.matter.add.rectangle(
      GAME_CONFIG.WIDTH / 2,
      groundY,
      GAME_CONFIG.WIDTH,
      groundHeight,
      {
        isStatic: true,
        friction: PHYSICS.GROUND_FRICTION,
        label: 'ground'
      }
    );
    this.groundBody.isGround = true;

    // Visual ground
    this.groundGraphics = this.add.graphics();
    this.groundGraphics.setDepth(1);

    // base
    this.groundGraphics.fillStyle(COLORS.GROUND_DARK, 1);
    this.groundGraphics.fillRect(0, GAME_CONFIG.HEIGHT - groundHeight, GAME_CONFIG.WIDTH, groundHeight);

    // top soil
    this.groundGraphics.fillStyle(COLORS.GROUND, 1);
    this.groundGraphics.fillRect(0, GAME_CONFIG.HEIGHT - groundHeight, GAME_CONFIG.WIDTH, 46);

    // grass strip
    this.groundGraphics.fillStyle(COLORS.GRASS, 1);
    this.groundGraphics.fillRect(0, GAME_CONFIG.HEIGHT - groundHeight, GAME_CONFIG.WIDTH, 10);

    // Platforms (yükseklik çeşitliliği)
    this.platformBodies = [];

    const platforms = [
      { x: 420, y: 470, w: 260, h: 26 },
      { x: 860, y: 420, w: 280, h: 26 }
    ];

    platforms.forEach((p) => {
      const body = this.matter.add.rectangle(p.x, p.y, p.w, p.h, {
        isStatic: true,
        label: 'ground',
        friction: 0.95
      });
      body.isGround = true;
      this.platformBodies.push(body);

      // visuals
      const pg = this.add.graphics();
      pg.setDepth(1);
      pg.fillStyle(COLORS.GROUND, 1);
      pg.fillRoundedRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 8);
      pg.fillStyle(COLORS.GRASS, 1);
      pg.fillRoundedRect(p.x - p.w / 2, p.y - p.h / 2, p.w, 7, 8);
    });

    // World bounds
    const wallThickness = 40;
    this.matter.add.rectangle(-wallThickness / 2, GAME_CONFIG.HEIGHT / 2, wallThickness, GAME_CONFIG.HEIGHT, { isStatic: true });
    this.matter.add.rectangle(GAME_CONFIG.WIDTH + wallThickness / 2, GAME_CONFIG.HEIGHT / 2, wallThickness, GAME_CONFIG.HEIGHT, { isStatic: true });
  }

  setupCollisionRouting() {
    this.matter.world.on('collisionstart', this.onCollisionStart, this);
    this.matter.world.on('collisionend', this.onCollisionEnd, this);
  }

  isGroundBody(body) {
    return !!(body && (body.isGround || body.label === 'ground'));
  }

  onCollisionStart(event) {
    event.pairs.forEach((pair) => {
      const a = pair.bodyA;
      const b = pair.bodyB;

      // projectile impact
      if (a?.isProjectile) this.handleProjectileImpact(a, b);
      if (b?.isProjectile) this.handleProjectileImpact(b, a);

      // ground contact for jump
      if (a?.isCharacter && this.isGroundBody(b)) a.characterRef?.onGroundContactStart?.();
      if (b?.isCharacter && this.isGroundBody(a)) b.characterRef?.onGroundContactStart?.();
    });
  }

  onCollisionEnd(event) {
    event.pairs.forEach((pair) => {
      const a = pair.bodyA;
      const b = pair.bodyB;

      if (a?.isCharacter && this.isGroundBody(b)) a.characterRef?.onGroundContactEnd?.();
      if (b?.isCharacter && this.isGroundBody(a)) b.characterRef?.onGroundContactEnd?.();
    });
  }

  handleProjectileImpact(projectileBody, otherBody) {
    // projectileBody.projectileGO: Matter Image
    const handler = projectileBody.onImpact;
    if (!handler) return;
    // Aynı frame içinde çok kez çağrılmasın
    if (projectileBody._impactCooldownUntil && this.time.now < projectileBody._impactCooldownUntil) return;
    projectileBody._impactCooldownUntil = this.time.now + 40;

    handler(otherBody);
  }

  createCharacters() {
    const groundTop = GAME_CONFIG.HEIGHT - 120; // groundHeight
    const spawnY = groundTop - PHYSICS.CHARACTER_RADIUS - 10;

    const red = [];
    const blue = [];

    const animalIds = ANIMALS.map(a => a.id);
    const pickRandom = () => Phaser.Utils.Array.GetRandom(animalIds);

    const redLoadout = this.loadout?.red?.length ? this.loadout.red : Array.from({ length: GAMEPLAY.TEAM_SIZE }, () => pickRandom());
    const blueLoadout = this.loadout?.blue?.length ? this.loadout.blue : Array.from({ length: GAMEPLAY.TEAM_SIZE }, () => pickRandom());

    // RED
    for (let i = 0; i < GAMEPLAY.TEAM_SIZE; i++) {
      const x = 170 + i * 95;
      const animalId = redLoadout[i] || pickRandom();
      const c = new Character(this, x, spawnY, TEAMS.RED.id, i, animalId);

      c.weapons = [
        new Bazooka(this, { ...WEAPONS.BAZOOKA }),
        new Grenade(this, { ...WEAPONS.GRENADE })
      ];

      red.push(c);
      this.allCharacters.push(c);
    }

    // BLUE
    for (let i = 0; i < GAMEPLAY.TEAM_SIZE; i++) {
      const x = GAME_CONFIG.WIDTH - 170 - i * 95;
      const animalId = blueLoadout[i] || pickRandom();
      const c = new Character(this, x, spawnY, TEAMS.BLUE.id, i, animalId);

      c.weapons = [
        new Bazooka(this, { ...WEAPONS.BAZOOKA }),
        new Grenade(this, { ...WEAPONS.GRENADE })
      ];

      blue.push(c);
      this.allCharacters.push(c);
    }

    this.teams[0] = red;
    this.teams[1] = blue;
  }

  createUI() {
    this.ui = {};

    // Top bar
    this.ui.timerText = this.add.text(GAME_CONFIG.WIDTH / 2, 26, `Time: ${GAMEPLAY.TURN_TIME}`, {
      fontSize: '24px',
      fontStyle: '900',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(100);

    this.ui.weaponText = this.add.text(24, 22, 'Weapon: Bazooka', {
      fontSize: '18px',
      fontStyle: '800',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 5
    }).setDepth(100);

    this.ui.turnText = this.add.text(GAME_CONFIG.WIDTH - 24, 22, 'Red Team', {
      fontSize: '18px',
      fontStyle: '900',
      color: '#FF4D6D',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(1, 0).setDepth(100);

    // Wind indicator
    this.ui.windArrow = this.add.image(GAME_CONFIG.WIDTH / 2, 62, 'ui_wind_arrow').setOrigin(0.5);
    this.ui.windArrow.setDepth(100);
    this.ui.windText = this.add.text(GAME_CONFIG.WIDTH / 2, 84, 'Wind: 0.0', {
      fontSize: '16px',
      fontStyle: '700',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(100);

    // Power bar
    this.ui.powerBg = this.add.graphics().setDepth(100);
    this.ui.powerFill = this.add.graphics().setDepth(101);
    this.ui.powerLabel = this.add.text(GAME_CONFIG.WIDTH - 68, GAME_CONFIG.HEIGHT / 2 - 134, 'POWER', {
      fontSize: '14px',
      fontStyle: '800',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(100);

    this.powerBar = {
      x: GAME_CONFIG.WIDTH - 82,
      y: GAME_CONFIG.HEIGHT / 2 - 100,
      w: 26,
      h: 200
    };
    this.drawPowerBar();

    // Aim/Trajectory graphics
    this.ui.aimGraphics = this.add.graphics().setDepth(50);

    // Hint
    this.ui.hint = this.add.text(24, GAME_CONFIG.HEIGHT - 92,
      'A/D: Move  W: Jump  Mouse: Aim  Hold&Release: Fire  Q/E: Weapon',
      {
        fontSize: '13px',
        color: '#FFFFFF',
        backgroundColor: '#00000055',
        padding: { x: 10, y: 8 }
      }
    ).setDepth(100);
  }

  drawPowerBar() {
    const { x, y, w, h } = this.powerBar;

    this.ui.powerBg.clear();
    this.ui.powerBg.fillStyle(0x000000, 0.35);
    this.ui.powerBg.fillRoundedRect(x, y, w, h, 8);

    this.updatePowerBar();
  }

  updatePowerBar() {
    const { x, y, w, h } = this.powerBar;
    const t = Phaser.Math.Clamp((this.currentPower - GAMEPLAY.MIN_POWER) / (GAMEPLAY.MAX_POWER - GAMEPLAY.MIN_POWER), 0, 1);
    const fillH = h * t;

    this.ui.powerFill.clear();
    // renk geçiş hissi: düşükte yeşil, yüksekte turuncu/kırmızı
    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(39, 209, 108),
      new Phaser.Display.Color(255, 77, 109),
      100,
      Math.floor(t * 100)
    );
    const color = Phaser.Display.Color.GetColor(col.r, col.g, col.b);

    this.ui.powerFill.fillStyle(color, 1);
    this.ui.powerFill.fillRoundedRect(x + 2, y + (h - fillH) + 2, w - 4, Math.max(0, fillH - 4), 6);
  }

  setupInputHandlers() {
    // Pointer aim (world coords)
    this.input.on('pointermove', (pointer) => {
      const active = this.turnManager.getActiveCharacter();
      if (!active || !active.isActive) return;

      if (this.turnManager.getGameState() !== GAME_STATES.PLAYER_TURN) return;

      const p = pointer.positionToCamera(this.cameras.main);
      const o = active.getAimOrigin();
      this.currentAngle = Phaser.Math.Angle.Between(o.x, o.y, p.x, p.y);
      active.setAimAngle(this.currentAngle);
    });

    // Mouse charge/fire
    this.input.on('pointerdown', () => {
      this.startCharging();
    });

    this.input.on('pointerup', () => {
      this.fireWeapon();
    });

    // Keyboard charge/fire (SPACE)
    this.keys.SPACE.on('down', () => this.startCharging());
    this.keys.SPACE.on('up', () => this.fireWeapon());
  }

  setupEventListeners() {
    EventBus.on(EVENTS.TURN_START, this.onTurnStart, this);
    EventBus.on(EVENTS.UI_UPDATE, this.onUIUpdate, this);
    EventBus.on(EVENTS.GAME_OVER, this.onGameOver, this);
    EventBus.on(EVENTS.WEAPON_CHANGED, this.onWeaponChanged, this);
    EventBus.on(EVENTS.EXPLOSION, () => this.onExplosion(), this);
  }

  onTurnStart(character) {
    // Turn UI
    const teamColor = character.teamId === TEAMS.RED.id ? '#FF4D6D' : '#4D79FF';
    this.ui.turnText.setText(`${character.team.name} Turn`);
    this.ui.turnText.setColor(teamColor);

    // Weapon UI
    const wpn = character.getCurrentWeapon();
    if (wpn) this.ui.weaponText.setText(`Weapon: ${wpn.name} (${wpn.ammo === Infinity ? '∞' : wpn.ammo})`);

    // Aim sync
    this.currentAngle = character.aimAngle;

    // Camera pan
    this.cameras.main.pan(character.body.position.x, character.body.position.y - 40, 380, 'Cubic.easeOut');

    // New wind each turn
    this.setWind();
  }

  onWeaponChanged(weapon) {
    if (!weapon) return;
    this.ui.weaponText.setText(`Weapon: ${weapon.name} (${weapon.ammo === Infinity ? '∞' : weapon.ammo})`);
  }

  onUIUpdate(data) {
    if (data.timeRemaining !== undefined) {
      this.ui.timerText.setText(`Time: ${data.timeRemaining}`);
    }
  }

  onGameOver(winnerTeamIndex) {
    const winnerText = winnerTeamIndex === null
      ? 'Draw!'
      : (winnerTeamIndex === TEAMS.RED.id ? 'Red Team Wins!' : 'Blue Team Wins!');

    const label = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, winnerText, {
      fontSize: '64px',
      fontStyle: '900',
      color: '#FFE66D',
      stroke: '#000000',
      strokeThickness: 10
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: label,
      scale: 1.08,
      yoyo: true,
      repeat: -1,
      duration: 450
    });

    // Menüye dönmek istersen: R
    const r = this.input.keyboard.addKey('R');
    r.once('down', () => this.scene.start('MenuScene'));
  }

  startGame() {
    this.turnManager.startGame(this.teams);
  }

  setWind() {
    this.wind = Phaser.Math.FloatBetween(-GAMEPLAY.WIND_MAX, GAMEPLAY.WIND_MAX);
    const w = this.wind;

    // UI
    this.ui.windText.setText(`Wind: ${w.toFixed(1)}`);

    // arrow flip
    this.ui.windArrow.setScale(w >= 0 ? 1 : -1, 1);
    this.ui.windArrow.setAlpha(0.35 + Math.min(0.65, Math.abs(w) / GAMEPLAY.WIND_MAX));

    EventBus.emit(EVENTS.WIND_CHANGED, w);
  }

  startCharging() {
    if (this.isCharging) return;

    if (this.turnManager.getGameState() !== GAME_STATES.PLAYER_TURN) return;

    const active = this.turnManager.getActiveCharacter();
    if (!active || !active.isActive) return;

    const weapon = active.getCurrentWeapon();
    if (!weapon || !weapon.hasAmmo()) return;

    this.isCharging = true;
    this.currentPower = GAMEPLAY.MIN_POWER;
    this._chargeDir = 1;

    // hareketi kilitle (Wild Ones hissi)
    active.canMove = false;

    this.updatePowerBar();
  }

  fireWeapon() {
    if (!this.isCharging) return;

    this.isCharging = false;

    const active = this.turnManager.getActiveCharacter();
    if (!active || !active.isActive) return;

    const weapon = active.getCurrentWeapon();
    if (!weapon || !weapon.hasAmmo()) {
      active.canMove = true;
      return;
    }

    // Fire
    const origin = active.getAimOrigin();
    weapon.fire(origin.x, origin.y, this.currentAngle, this.currentPower, this.wind, active);

    // UI ammo
    this.ui.weaponText.setText(`Weapon: ${weapon.name} (${weapon.ammo === Infinity ? '∞' : weapon.ammo})`);

    // artık hareket yok (tur resolve bitene kadar)
    active.canMove = false;
  }

  registerProjectile(projectile) {
    if (!projectile) return;
    this.projectiles.add(projectile);
  }

  destroyProjectile(projectile) {
    if (!projectile) return;
    this.projectiles.delete(projectile);
    projectile.destroy();
    // no explosion olabilir; settle hesabı için "son etkileşim" say
    this.lastImpactTime = this.time.now;
  }

  onExplosion() {
    this.lastImpactTime = this.time.now;
  }

  isPhysicsSettled() {
    // patlama/impact sonrası biraz bekleyelim
    if (this.time.now - this.lastImpactTime < 140) return false;

    if (this.projectiles.size > 0) return false;

    const eps = GAMEPLAY.SETTLE_SPEED_EPS;

    for (const c of this.allCharacters) {
      if (!c.isAlive) continue;
      const v = c.body.velocity;
      if (Math.abs(v.x) > eps || Math.abs(v.y) > eps) return false;
    }

    return true;
  }

  updateAimGraphics(active, weapon) {
    const g = this.ui.aimGraphics;
    g.clear();

    if (!active || !active.isActive) return;
    if (!weapon) return;

    const o = active.getAimOrigin();

    // Aim line
    const len = 70;
    const endX = o.x + Math.cos(this.currentAngle) * len;
    const endY = o.y + Math.sin(this.currentAngle) * len;

    g.lineStyle(3, 0xFFE66D, 0.95);
    g.beginPath();
    g.moveTo(o.x, o.y);
    g.lineTo(endX, endY);
    g.strokePath();

    // Trajectory preview (yaklaşık)
    const v = weapon.calculateVelocity(this.currentAngle, this.currentPower);
    let px = o.x + Math.cos(this.currentAngle) * (PHYSICS.CHARACTER_RADIUS + 12);
    let py = o.y + Math.sin(this.currentAngle) * (PHYSICS.CHARACTER_RADIUS + 12);
    let vx = v.x;
    let vy = v.y;

    // Dotted points
    g.fillStyle(0xFFFFFF, 0.75);
    for (let i = 0; i < 32; i++) {
      // wind (x) + gravity (y) etkisi
      vx += this.wind * 0.03;
      vy += PHYSICS.GRAVITY_Y * 0.38;

      px += vx;
      py += vy;

      if (i % 2 === 0) g.fillCircle(px, py, 2);

      if (py > GAME_CONFIG.HEIGHT + 200) break;
      if (px < -200 || px > GAME_CONFIG.WIDTH + 200) break;
    }
  }

  updateProjectiles() {
    for (const proj of Array.from(this.projectiles)) {
      if (!proj?.body) {
        this.projectiles.delete(proj);
        continue;
      }

      // apply wind as tiny constant force
      const w = proj.body.wind ?? this.wind;
      this.matter.body.applyForce(proj.body, proj.body.position, { x: w * 0.000008, y: 0 });

      // rocket points to velocity
      if (proj.body.label === 'proj_bazooka') {
        const v = proj.body.velocity;
        proj.rotation = Math.atan2(v.y, v.x);
      }

      // out of bounds cleanup
      if (proj.y > GAME_CONFIG.HEIGHT + 400 || proj.x < -400 || proj.x > GAME_CONFIG.WIDTH + 400) {
        this.destroyProjectile(proj);
      }
    }
  }

  update(time, delta) {
    // Characters update
    this.allCharacters.forEach((c) => c.update(time, delta));

    const active = this.turnManager.getActiveCharacter();
    const isPlayerTurn = this.turnManager.getGameState() === GAME_STATES.PLAYER_TURN;

    if (active && active.isActive && isPlayerTurn) {
      // Movement
      if (active.canMove) {
        if (this.keys.A.isDown) active.moveLeft();
        else if (this.keys.D.isDown) active.moveRight();
      }

      if (Phaser.Input.Keyboard.JustDown(this.keys.W)) active.jump();

      // Aim with keyboard
      if (this.cursors.up.isDown) {
        this.currentAngle -= 0.025;
        active.setAimAngle(this.currentAngle);
      } else if (this.cursors.down.isDown) {
        this.currentAngle += 0.025;
        active.setAimAngle(this.currentAngle);
      }

      // Weapon switch
      if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
        active.previousWeapon();
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        active.nextWeapon();
      }

      // Charging power update
      if (this.isCharging) {
        // ping-pong bar (Wild Ones hissi)
        const deltaPower = delta * GAMEPLAY.CHARGE_SPEED;
        this.currentPower += this._chargeDir * deltaPower;

        if (this.currentPower >= GAMEPLAY.MAX_POWER) {
          this.currentPower = GAMEPLAY.MAX_POWER;
          this._chargeDir = -1;
        } else if (this.currentPower <= GAMEPLAY.MIN_POWER) {
          this.currentPower = GAMEPLAY.MIN_POWER;
          this._chargeDir = 1;
        }

        this.updatePowerBar();
      }

      const weapon = active.getCurrentWeapon();
      this.updateAimGraphics(active, weapon);
    } else {
      this.ui.aimGraphics.clear();
      this.isCharging = false;
    }

    this.updateProjectiles();
  }

  getAllCharacters() {
    return this.allCharacters;
  }
}

export default GameScene;
