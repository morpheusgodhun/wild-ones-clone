/**
 * Character
 * - Matter body + sprite + UI (health, active ring)
 * - Animal seçimi destekli.
 */

import { PHYSICS, GAMEPLAY, TEAMS } from '../config/Constants.js';
import EventBus, { EVENTS } from '../utils/EventBus.js';
import TextureFactory from '../utils/TextureFactory.js';

export class Character {
  constructor(scene, x, y, teamId, characterIndex, animalId = 'bunny') {
    this.scene = scene;

    this.teamId = teamId;
    this.characterIndex = characterIndex;
    this.team = teamId === TEAMS.RED.id ? TEAMS.RED : TEAMS.BLUE;

    this.animalId = animalId;

    // Stats
    this.maxHealth = GAMEPLAY.STARTING_HEALTH;
    this.health = this.maxHealth;
    this.isAlive = true;

    // Turn state
    this.isActive = false;
    this.canMove = false;

    // Weapons (GameScene set eder)
    this.weapons = [];
    this.currentWeaponIndex = 0;

    // Movement tuning
    this.moveSpeed = 2.6;
    this.jumpForce = -9.5;

    // Aiming
    this.aimAngle = -Math.PI / 4;
    this.power = 50;

    // Ground contact
    this.groundContactCount = 0;

    // Unique collision group: kendi projectile'ı ile çarpışmasın
    this.collisionGroup = -(1000 + teamId * 100 + characterIndex + 1);

    this.createPhysicsBody(x, y);
    this.createVisual(x, y);
    this.createUI(x, y);

    this.update(0, 0);
  }

  createPhysicsBody(x, y) {
    const radius = PHYSICS.CHARACTER_RADIUS;

    this.body = this.scene.matter.add.circle(x, y, radius, {
      friction: PHYSICS.CHARACTER_FRICTION,
      frictionAir: 0.02,
      restitution: PHYSICS.CHARACTER_BOUNCE,
      density: 0.002,
      label: `character_${this.teamId}_${this.characterIndex}`,
      collisionFilter: { group: this.collisionGroup }
    });

    // Body'e reference ekle (collision routing için)
    this.body.isCharacter = true;
    this.body.characterRef = this;
  }

  createVisual(x, y) {
    const key = TextureFactory.getCharacterKey(this.teamId, this.animalId);

    this.sprite = this.scene.add.image(x, y, key);
    this.sprite.setDepth(10);
    // Texture büyük; display size ile fizik boyutuna yaklaştır
    const display = PHYSICS.CHARACTER_RADIUS * 2.35;
    this.sprite.setDisplaySize(display, display);

    // Küçük gölge
    this.shadow = this.scene.add.ellipse(x, y + PHYSICS.CHARACTER_RADIUS + 10, display * 0.9, display * 0.35, 0x000000, 0.20);
    this.shadow.setDepth(2);
  }

  createUI(x, y) {
    // Active ring
    this.activeRing = this.scene.add.graphics();
    this.activeRing.setDepth(30);
    this.activeRing.visible = false;

    // Health bar (local coords)
    const barWidth = 56;
    const barHeight = 7;
    const yOffset = -(PHYSICS.CHARACTER_RADIUS + 22);

    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.setDepth(40);
    this.healthBarBg.fillStyle(0x000000, 0.35);
    this.healthBarBg.fillRoundedRect(-barWidth / 2, yOffset, barWidth, barHeight, 3);

    this.healthBar = this.scene.add.graphics();
    this.healthBar.setDepth(41);
    this._healthBarLayout = { barWidth, barHeight, yOffset };

    this.redrawHealthBar();

    // Name (animal) label (küçük)
    this.nameText = this.scene.add.text(0, 0, '', {
      fontSize: '12px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.nameText.setOrigin(0.5);
    this.nameText.setDepth(42);
    this.nameText.setText(this.animalId.toUpperCase());
  }

  redrawHealthBar() {
    const { barWidth, barHeight, yOffset } = this._healthBarLayout;
    const t = this.health / this.maxHealth;

    // Renk: yeşil -> sarı -> kırmızı
    let color = 0x27D16C;
    if (t < 0.5) color = 0xFFD166;
    if (t < 0.25) color = 0xFF4D6D;

    this.healthBar.clear();
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRoundedRect(-barWidth / 2, yOffset, barWidth * t, barHeight, 3);
  }

  setActive(active) {
    this.isActive = active;
    this.canMove = active;

    if (active) {
      this.activeRing.visible = true;
      this.activeRing.clear();
      this.activeRing.lineStyle(3, 0xFFE66D, 1);
      this.activeRing.strokeCircle(0, 0, PHYSICS.CHARACTER_RADIUS + 7);

      if (this._ringTween) this._ringTween.stop();
      this._ringTween = this.scene.tweens.add({
        targets: this.activeRing,
        alpha: 0.35,
        yoyo: true,
        duration: 420,
        repeat: -1
      });
    } else {
      if (this._ringTween) this._ringTween.stop();
      this.activeRing.alpha = 1;
      this.activeRing.visible = false;
    }
  }

  // Movement
  moveLeft() {
    this.applyMove(-1);
  }

  moveRight() {
    this.applyMove(1);
  }

  applyMove(dir) {
    if (!this.canMove || !this.isAlive) return;

    const vx = dir * this.moveSpeed;
    this.scene.matter.body.setVelocity(this.body, { x: vx, y: this.body.velocity.y });
  }

  jump() {
    if (!this.canMove || !this.isAlive) return;
    if (!this.isGrounded()) return;

    this.scene.matter.body.setVelocity(this.body, { x: this.body.velocity.x, y: this.jumpForce });
  }

  isGrounded() {
    if (this.groundContactCount > 0) return true;
    // fallback
    return Math.abs(this.body.velocity.y) < 0.45;
  }

  onGroundContactStart() {
    this.groundContactCount++;
  }

  onGroundContactEnd() {
    this.groundContactCount = Math.max(0, this.groundContactCount - 1);
  }

  setAimAngle(angle) {
    this.aimAngle = angle;
    EventBus.emit(EVENTS.ANGLE_CHANGED, angle);
  }

  setPower(power) {
    this.power = power;
    EventBus.emit(EVENTS.POWER_CHANGED, power);
  }

  nextWeapon() {
    if (!this.weapons.length) return;
    this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    EventBus.emit(EVENTS.WEAPON_CHANGED, this.getCurrentWeapon());
  }

  previousWeapon() {
    if (!this.weapons.length) return;
    this.currentWeaponIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    EventBus.emit(EVENTS.WEAPON_CHANGED, this.getCurrentWeapon());
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex] || null;
  }

  // Aim origin ve muzzle (silah çıkışı) noktası
  getAimOrigin() {
    const p = this.body.position;
    return { x: p.x, y: p.y - 3 };
  }

  getMuzzlePosition(angle) {
    const o = this.getAimOrigin();
    const dist = PHYSICS.CHARACTER_RADIUS + 12;
    return {
      x: o.x + Math.cos(angle) * dist,
      y: o.y + Math.sin(angle) * dist
    };
  }

  takeDamage(amount) {
    if (!this.isAlive) return;

    this.health = Math.max(0, this.health - amount);
    this.redrawHealthBar();
    this.showDamageText(amount);

    EventBus.emit(EVENTS.CHARACTER_DAMAGED, this, amount);

    if (this.health <= 0) {
      this.die();
    }
  }

  showDamageText(damage) {
    const pos = this.body.position;
    const text = this.scene.add.text(pos.x, pos.y - 52, `-${damage}`, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FF4D6D',
      stroke: '#000000',
      strokeThickness: 4
    });
    text.setOrigin(0.5);
    text.setDepth(100);

    this.scene.tweens.add({
      targets: text,
      y: pos.y - 90,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  die() {
    this.isAlive = false;
    this.isActive = false;
    this.canMove = false;

    this.sprite.setAlpha(0.35);
    this.shadow.setAlpha(0.12);

    this.setActive(false);

    EventBus.emit(EVENTS.CHARACTER_DIED, this);
  }

  update(_time, _delta) {
    if (!this.body) return;

    const { x, y } = this.body.position;

    // Visual sync
    this.sprite.setPosition(x, y);
    this.shadow.setPosition(x, y + PHYSICS.CHARACTER_RADIUS + 10);

    // UI position
    this.healthBarBg.setPosition(x, y);
    this.healthBar.setPosition(x, y);
    this.nameText.setPosition(x, y - (PHYSICS.CHARACTER_RADIUS + 34));
    this.activeRing.setPosition(x, y);
  }

  destroy() {
    if (this._ringTween) this._ringTween.stop();

    this.sprite?.destroy();
    this.shadow?.destroy();
    this.activeRing?.destroy();
    this.healthBar?.destroy();
    this.healthBarBg?.destroy();
    this.nameText?.destroy();

    if (this.body) {
      this.scene.matter.world.remove(this.body);
      this.body = null;
    }
  }
}

export default Character;
