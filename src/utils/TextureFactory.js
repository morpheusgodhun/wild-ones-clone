/**
 * TextureFactory
 * - Dış asset kullanmadan (placeholder) daha 'oyunsu' görseller üretmek için.
 * - Team renklerine göre karakter texture'ları, projectile texture'ları vb. üretir.
 */

import { TEAMS, ANIMALS } from '../config/Constants.js';

export class TextureFactory {
  static getCharacterKey(teamId, animalId) {
    return `char_${teamId}_${animalId}`;
  }

  static getProjectileKey(name) {
    return `proj_${name}`;
  }

  static generateAll(scene) {
    // Karakter texture'ları
    const teams = [TEAMS.RED, TEAMS.BLUE];
    teams.forEach((team) => {
      ANIMALS.forEach((animal) => {
        const key = this.getCharacterKey(team.id, animal.id);
        if (!scene.textures.exists(key)) {
          this.generateCharacterTexture(scene, key, team, animal.id);
        }
      });
    });

    // Projectile texture'ları
    if (!scene.textures.exists(this.getProjectileKey('bazooka'))) {
      this.generateBazookaProjectile(scene, this.getProjectileKey('bazooka'));
    }
    if (!scene.textures.exists(this.getProjectileKey('grenade'))) {
      this.generateGrenadeProjectile(scene, this.getProjectileKey('grenade'));
    }
    if (!scene.textures.exists('ui_wind_arrow')) {
      this.generateWindArrow(scene, 'ui_wind_arrow');
    }
  }

  static generateCharacterTexture(scene, key, team, animalId) {
    const size = 96;
    const cx = size / 2;
    const cy = size / 2 + 4;
    const r = 30;

    const g = scene.add.graphics();
    g.clear();

    // Ears / head accessories (arkada kalsın)
    this.drawAnimalEars(g, team, animalId, cx, cy, r);

    // Shadow (arkaya gölge)
    g.fillStyle(0x000000, 0.18);
    g.fillCircle(cx + 6, cy + 8, r);

    // Outline
    g.fillStyle(team.outline, 1);
    g.fillCircle(cx, cy, r + 3);

    // Body
    g.fillStyle(team.color, 1);
    g.fillCircle(cx, cy, r);

    // Highlight
    g.fillStyle(0xFFFFFF, 0.18);
    g.fillCircle(cx - 10, cy - 12, r * 0.55);

    // Face - eyes
    const eyeY = cy - 6;
    const eyeDX = 11;

    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(cx - eyeDX, eyeY, 7);
    g.fillCircle(cx + eyeDX, eyeY, 7);

    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - eyeDX + 2, eyeY + 1, 3);
    g.fillCircle(cx + eyeDX + 2, eyeY + 1, 3);

    // Blush
    g.fillStyle(0xFFB3C1, 0.35);
    g.fillCircle(cx - 18, cy + 5, 6);
    g.fillCircle(cx + 18, cy + 5, 6);

    // Mouth
    g.lineStyle(3, 0x111111, 0.7);
    g.beginPath();
    g.arc(cx, cy + 10, 8, 0.15 * Math.PI, 0.85 * Math.PI);
    g.strokePath();

    // Animal specific face detail
    this.drawAnimalFaceDetail(g, animalId, cx, cy, r);

    // Generate
    g.generateTexture(key, size, size);
    g.destroy();
  }

  static drawAnimalEars(g, team, animalId, cx, cy, r) {
    const topY = cy - r - 8;

    switch (animalId) {
      case 'bunny': {
        // 2 uzun kulak
        g.fillStyle(team.outline, 1);
        g.fillEllipse(cx - 14, topY + 4, 18, 42);
        g.fillEllipse(cx + 14, topY + 4, 18, 42);

        g.fillStyle(team.color, 1);
        g.fillEllipse(cx - 14, topY + 6, 14, 38);
        g.fillEllipse(cx + 14, topY + 6, 14, 38);

        g.fillStyle(0xFFFFFF, 0.35);
        g.fillEllipse(cx - 14, topY + 10, 8, 26);
        g.fillEllipse(cx + 14, topY + 10, 8, 26);
        break;
      }
      case 'bear': {
        // 2 küçük kulak
        g.fillStyle(team.outline, 1);
        g.fillCircle(cx - 18, cy - r + 2, 12);
        g.fillCircle(cx + 18, cy - r + 2, 12);
        g.fillStyle(team.color, 1);
        g.fillCircle(cx - 18, cy - r + 3, 9);
        g.fillCircle(cx + 18, cy - r + 3, 9);
        break;
      }
      case 'panda': {
        // Panda kulakları koyu
        g.fillStyle(0x111111, 1);
        g.fillCircle(cx - 18, cy - r + 2, 12);
        g.fillCircle(cx + 18, cy - r + 2, 12);
        g.fillStyle(0x2B2B2B, 1);
        g.fillCircle(cx - 18, cy - r + 3, 9);
        g.fillCircle(cx + 18, cy - r + 3, 9);
        break;
      }
      case 'cat': {
        // Üçgen kulaklar
        g.fillStyle(team.outline, 1);
        g.fillTriangle(cx - 24, cy - r + 10, cx - 10, cy - r - 18, cx - 2, cy - r + 12);
        g.fillTriangle(cx + 24, cy - r + 10, cx + 10, cy - r - 18, cx + 2, cy - r + 12);

        g.fillStyle(team.color, 1);
        g.fillTriangle(cx - 22, cy - r + 10, cx - 10, cy - r - 14, cx - 4, cy - r + 10);
        g.fillTriangle(cx + 22, cy - r + 10, cx + 10, cy - r - 14, cx + 4, cy - r + 10);
        break;
      }
      case 'fox': {
        // Daha sivri/uzun kulak
        g.fillStyle(team.outline, 1);
        g.fillTriangle(cx - 26, cy - r + 12, cx - 8, cy - r - 26, cx - 2, cy - r + 14);
        g.fillTriangle(cx + 26, cy - r + 12, cx + 8, cy - r - 26, cx + 2, cy - r + 14);

        g.fillStyle(team.color, 1);
        g.fillTriangle(cx - 24, cy - r + 12, cx - 8, cy - r - 22, cx - 4, cy - r + 12);
        g.fillTriangle(cx + 24, cy - r + 12, cx + 8, cy - r - 22, cx + 4, cy - r + 12);
        break;
      }
      case 'pig': {
        // küçük kulak
        g.fillStyle(team.outline, 1);
        g.fillTriangle(cx - 22, cy - r + 18, cx - 10, cy - r - 2, cx - 2, cy - r + 20);
        g.fillTriangle(cx + 22, cy - r + 18, cx + 10, cy - r - 2, cx + 2, cy - r + 20);

        g.fillStyle(team.color, 1);
        g.fillTriangle(cx - 20, cy - r + 18, cx - 10, cy - r + 2, cx - 4, cy - r + 18);
        g.fillTriangle(cx + 20, cy - r + 18, cx + 10, cy - r + 2, cx + 4, cy - r + 18);
        break;
      }
      default:
        break;
    }
  }

  static drawAnimalFaceDetail(g, animalId, cx, cy, r) {
    switch (animalId) {
      case 'panda': {
        // Göz çevresi siyah
        g.fillStyle(0x111111, 0.9);
        g.fillEllipse(cx - 12, cy - 6, 18, 16);
        g.fillEllipse(cx + 12, cy - 6, 18, 16);

        // gözleri tekrar üstüne çiz (parlak kalsın)
        g.fillStyle(0xFFFFFF, 1);
        g.fillCircle(cx - 12, cy - 6, 6);
        g.fillCircle(cx + 12, cy - 6, 6);
        g.fillStyle(0x000000, 1);
        g.fillCircle(cx - 10, cy - 5, 3);
        g.fillCircle(cx + 14, cy - 5, 3);
        break;
      }
      case 'pig': {
        // Burun
        g.fillStyle(0xFFD1DC, 0.95);
        g.fillRoundedRect(cx - 12, cy + 6, 24, 16, 8);
        g.fillStyle(0xC76B7A, 0.75);
        g.fillCircle(cx - 5, cy + 14, 3);
        g.fillCircle(cx + 5, cy + 14, 3);
        break;
      }
      case 'fox': {
        // Beyaz ağız maskesi gibi
        g.fillStyle(0xFFFFFF, 0.35);
        g.fillEllipse(cx, cy + 16, 40, 28);
        break;
      }
      case 'cat': {
        // bıyık
        g.lineStyle(2, 0x111111, 0.45);
        g.beginPath();
        g.moveTo(cx - 6, cy + 10);
        g.lineTo(cx - 28, cy + 6);
        g.moveTo(cx - 6, cy + 14);
        g.lineTo(cx - 28, cy + 14);
        g.moveTo(cx + 6, cy + 10);
        g.lineTo(cx + 28, cy + 6);
        g.moveTo(cx + 6, cy + 14);
        g.lineTo(cx + 28, cy + 14);
        g.strokePath();
        break;
      }
      default:
        break;
    }
  }

  static generateBazookaProjectile(scene, key) {
    const w = 48, h = 20;
    const g = scene.add.graphics();

    // gölge
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(6, 8, 32, 10, 5);

    // gövde
    g.fillStyle(0x2F2F2F, 1);
    g.fillRoundedRect(6, 6, 32, 10, 5);

    // burun
    g.fillStyle(0xFF7A00, 1);
    g.fillTriangle(38, 6, 46, 11, 38, 16);

    // parıltı
    g.fillStyle(0xFFFFFF, 0.25);
    g.fillRoundedRect(8, 7, 10, 3, 2);

    g.generateTexture(key, w, h);
    g.destroy();
  }

  static generateGrenadeProjectile(scene, key) {
    const s = 28;
    const cx = s / 2, cy = s / 2;
    const g = scene.add.graphics();

    g.fillStyle(0x000000, 0.2);
    g.fillCircle(cx + 2, cy + 2, 10);

    g.fillStyle(0x2F7D32, 1);
    g.fillCircle(cx, cy, 10);

    g.fillStyle(0x1D5C20, 1);
    g.fillRoundedRect(cx - 5, cy - 15, 10, 6, 2);

    g.fillStyle(0xFFFFFF, 0.18);
    g.fillCircle(cx - 3, cy - 4, 5);

    g.generateTexture(key, s, s);
    g.destroy();
  }

  static generateWindArrow(scene, key) {
    const w = 64, h = 16;
    const g = scene.add.graphics();
    g.lineStyle(4, 0xFFFFFF, 0.9);
    g.beginPath();
    g.moveTo(6, 8);
    g.lineTo(54, 8);
    g.strokePath();

    g.fillStyle(0xFFFFFF, 0.9);
    g.fillTriangle(54, 8, 44, 2, 44, 14);

    g.generateTexture(key, w, h);
    g.destroy();
  }
}

export default TextureFactory;
