/**
 * BaseWeapon
 * - Silahlar bunun üzerinden türetilir.
 * - Projectile oluşturma + patlama FX + hasar/force ortak kod.
 */


import Phaser from 'phaser';
import EventBus, { EVENTS } from '../utils/EventBus.js';
import MathUtils from '../utils/MathUtils.js';
import { PHYSICS } from '../config/Constants.js';

export class BaseWeapon {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;

    this.id = config.id;
    this.name = config.name;
    this.damage = config.damage;
    this.explosionRadius = config.explosionRadius || 0;
    this.ammo = config.ammo;
    this.projectileSpeed = config.projectileSpeed || 1.0;
  }

  consumeAmmo() {
    if (this.ammo !== Infinity) this.ammo = Math.max(0, this.ammo - 1);
  }

  /**
   * Override edilecek.
   * ownerCharacter parametresi önemli: muzzle offset + collision group için.
   */
  fire(_x, _y, _angle, _power, _wind = 0, _ownerCharacter = null) {
    if (!this.hasAmmo()) return null;
    this.consumeAmmo();
    EventBus.emit(EVENTS.WEAPON_FIRED, this, _ownerCharacter);
    return null;
  }

  /**
   * Projectile (Matter Image) oluştur
   */
  createProjectile(x, y, vx, vy, opts = {}) {
    const radius = opts.radius ?? 6;
    const textureKey = opts.textureKey ?? null;

    // textureKey null olursa Phaser hata verir; o yüzden basit bir fallback
    const key = textureKey || 'ui_wind_arrow';

    const projectile = this.scene.matter.add.image(x, y, key, undefined, {
      restitution: opts.bounce ?? 0.6,
      friction: 0.005,
      frictionAir: opts.frictionAir ?? 0.01,
      density: opts.density ?? PHYSICS.PROJECTILE_DENSITY,
      label: opts.label || 'projectile'
    });

    projectile.setCircle(radius);
    projectile.setOrigin(0.5, 0.5);
    projectile.setDepth(25);
    projectile.setVelocity(vx, vy);

    // collision group (owner ile çarpışmayı engelle)
    if (typeof opts.collisionGroup === 'number') {
      projectile.body.collisionFilter.group = opts.collisionGroup;
    }

    // tagging
    projectile.body.isProjectile = true;
    projectile.body.projectileGO = projectile;
    projectile.body.weaponRef = this;
    projectile.body.ownerCharacter = opts.ownerCharacter || null;

    // wind tracking (GameScene update'te uygulanacak)
    projectile.body.wind = opts.wind ?? 0;

    // impact handler
    projectile.body.onImpact = typeof opts.onImpact === 'function' ? opts.onImpact : null;

    if (typeof this.scene.registerProjectile === 'function') {
      this.scene.registerProjectile(projectile);
    }

    return projectile;
  }

  /**
   * Patlama yarat
   */
  createExplosion(x, y) {
    const radius = this.explosionRadius;

    // FX
    this.createExplosionFX(x, y, radius);

    // Screen shake
    this.scene.cameras.main.shake(180, 0.008);

    // Damage + force
    this.applyExplosionDamageAndForce(x, y, radius);

    // Scene'e bilgi (settle için)
    if (typeof this.scene.onExplosion === 'function') {
      this.scene.onExplosion();
    }

    EventBus.emit(EVENTS.EXPLOSION, { x, y, radius, damage: this.damage });
  }

  createExplosionFX(x, y, radius) {
    // ana patlama
    const blast = this.scene.add.graphics();
    blast.setDepth(60);

    blast.fillStyle(0xFF7A00, 0.9);
    blast.fillCircle(0, 0, radius * 0.45);

    blast.fillStyle(0xFFE66D, 0.85);
    blast.fillCircle(0, 0, radius * 0.28);

    blast.setPosition(x, y);

    this.scene.tweens.add({
      targets: blast,
      alpha: 0,
      scaleX: 2.0,
      scaleY: 2.0,
      duration: 380,
      ease: 'Cubic.easeOut',
      onComplete: () => blast.destroy()
    });

    // parçacıklar
    for (let i = 0; i < 18; i++) {
      const p = this.scene.add.circle(x, y, Phaser.Math.Between(3, 7), i % 2 ? 0xFF7A00 : 0xFFE66D, 1);
      p.setDepth(59);

      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const sp = Phaser.Math.FloatBetween(radius * 0.25, radius * 1.05);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * sp,
        y: y + Math.sin(ang) * sp,
        alpha: 0,
        scale: 0.6,
        duration: Phaser.Math.Between(380, 620),
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  applyExplosionDamageAndForce(x, y, radius) {
    const characters = this.scene.getAllCharacters ? this.scene.getAllCharacters() : [];

    characters.forEach((character) => {
      if (!character?.isAlive) return;

      const pos = character.body.position;
      const dist = MathUtils.distance(x, y, pos.x, pos.y);
      if (dist > radius) return;

      const dmg = MathUtils.calculateExplosionDamage(dist, this.damage, radius);
      if (dmg > 0) character.takeDamage(dmg);

      const maxForce = 0.020; // ayarlanabilir
      const forceMag = MathUtils.calculateExplosionForce(dist, maxForce, radius);
      const ang = Math.atan2(pos.y - y, pos.x - x);

      this.scene.matter.body.applyForce(character.body, pos, {
        x: Math.cos(ang) * forceMag,
        y: Math.sin(ang) * forceMag
      });
    });
  }

  calculateVelocity(angle, power) {
    const speed = (power / 100) * 22 * this.projectileSpeed;
    return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
  }

  hasAmmo() {
    return this.ammo === Infinity || this.ammo > 0;
  }
}

export default BaseWeapon;
