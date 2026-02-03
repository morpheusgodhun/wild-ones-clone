/**
 * Math Utilities
 */

export class MathUtils {
  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Trajectory tahmini (velocity ile)
   * - vx/vy: piksel/ms (yaklaşık)
   * - gravity: piksel/ms^2 (yaklaşık)
   * - wind: piksel/ms^2 gibi davranacak (x ivmesi)
   */
  static calculateTrajectoryFromVelocity(x, y, vx, vy, gravity, wind, steps = 40, dtMs = 50) {
    const pts = [];
    let px = x, py = y;
    let vxx = vx, vyy = vy;

    for (let i = 0; i < steps; i++) {
      pts.push({ x: px, y: py });

      // acceleration
      vxx += wind * (dtMs);
      vyy += gravity * (dtMs);

      px += vxx * (dtMs);
      py += vyy * (dtMs);

      if (py > 2000 || px < -200 || px > 2000) break;
    }
    return pts;
  }

  static calculateExplosionDamage(distance, maxDamage, explosionRadius) {
    if (distance > explosionRadius) return 0;
    const damagePercent = 1 - (distance / explosionRadius);
    return Math.floor(maxDamage * damagePercent);
  }

  static calculateExplosionForce(distance, maxForce, explosionRadius) {
    if (distance > explosionRadius) return 0;
    return maxForce * (1 - distance / explosionRadius);
  }
}

export default MathUtils;
