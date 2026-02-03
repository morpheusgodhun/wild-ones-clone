/**
 * Grenade
 * - Belli süre sonra patlar (fuseTime)
 * - Birkaç kez sekebilir (bounces)
 */

import BaseWeapon from './BaseWeapon.js';
import EventBus, { EVENTS } from '../utils/EventBus.js';
import TextureFactory from '../utils/TextureFactory.js';

export class Grenade extends BaseWeapon {
  fire(x, y, angle, power, wind = 0, ownerCharacter = null) {
    if (!this.hasAmmo()) return null;

    this.consumeAmmo();

    const origin = ownerCharacter?.getMuzzlePosition
      ? ownerCharacter.getMuzzlePosition(angle)
      : { x, y };

    const v = this.calculateVelocity(angle, power);

    const projectile = this.createProjectile(
      origin.x,
      origin.y,
      v.x + wind * 0.35,
      v.y,
      {
        radius: 10,
        bounce: 0.7,
        frictionAir: 0.01,
        density: 0.0015,
        label: 'proj_grenade',
        textureKey: TextureFactory.getProjectileKey('grenade'),
        ownerCharacter,
        collisionGroup: ownerCharacter?.collisionGroup ?? undefined,
        wind,
        onImpact: (otherBody) => {
          if (projectile.body._exploded) return;

          // Karaktere direkt çarparsa hemen patla (daha arcade)
          if (otherBody?.isCharacter && otherBody?.characterRef && otherBody.characterRef !== ownerCharacter) {
            this.explodeNow(projectile);
            return;
          }

          // Zemine çarptıysa bounce say
          if (otherBody?.label === 'ground' || otherBody?.isGround) {
            projectile.body._bouncesLeft = (projectile.body._bouncesLeft ?? this.config.bounces ?? 3) - 1;
            if (projectile.body._bouncesLeft <= 0) {
              this.explodeNow(projectile);
            }
          }
        }
      }
    );

    // Fuse timer
    projectile.body._bouncesLeft = this.config.bounces ?? 3;

    projectile.body._fuseTimer = this.scene.time.delayedCall(this.config.fuseTime ?? 2500, () => {
      if (!projectile?.body) return;
      if (projectile.body._exploded) return;
      this.explodeNow(projectile);
    });

    // Küçük spin
    projectile.setAngularVelocity(0.12);

    EventBus.emit(EVENTS.WEAPON_FIRED, this, ownerCharacter);
    return projectile;
  }

  explodeNow(projectile) {
    if (!projectile?.body || projectile.body._exploded) return;
    projectile.body._exploded = true;

    // timer temizle
    projectile.body._fuseTimer?.remove?.();
    projectile.body._killTimer?.remove?.();

    this.createExplosion(projectile.x, projectile.y);

    if (typeof this.scene.destroyProjectile === 'function') this.scene.destroyProjectile(projectile);
    else projectile.destroy();
  }
}

export default Grenade;
