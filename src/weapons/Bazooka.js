/**
 * Bazooka
 * - İlk çarpışmada patlar.
 */

import BaseWeapon from './BaseWeapon.js';
import EventBus, { EVENTS } from '../utils/EventBus.js';
import TextureFactory from '../utils/TextureFactory.js';

export class Bazooka extends BaseWeapon {
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
      v.x + wind * 0.6,
      v.y,
      {
        radius: 7,
        bounce: 0.05,
        frictionAir: 0.002,
        density: 0.001,
        label: 'proj_bazooka',
        textureKey: TextureFactory.getProjectileKey('bazooka'),
        ownerCharacter,
        collisionGroup: ownerCharacter?.collisionGroup ?? undefined,
        wind,
        onImpact: (otherBody) => {
          if (projectile.body._exploded) return;

          // Owner ile çarpışma (çok nadir) olursa ignore
          if (otherBody?.isCharacter && otherBody?.characterRef === ownerCharacter) return;

          projectile.body._exploded = true;
          this.createExplosion(projectile.x, projectile.y);

          if (typeof this.scene.destroyProjectile === 'function') this.scene.destroyProjectile(projectile);
          else projectile.destroy();
        }
      }
    );

    // Failsafe: ekranda kalmasın
    projectile.body._killTimer = this.scene.time.delayedCall(6500, () => {
      if (!projectile?.body) return;
      if (typeof this.scene.destroyProjectile === 'function') this.scene.destroyProjectile(projectile);
      else projectile.destroy();
    });

    EventBus.emit(EVENTS.WEAPON_FIRED, this, ownerCharacter);
    return projectile;
  }
}

export default Bazooka;
