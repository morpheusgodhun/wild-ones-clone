/**
 * Wild Ones Mini Clone - Constants
 * Not: Bu bir "esinlenen" mini klondur. Orijinal oyunun asset/code aynısını kopyalamaz.
 */

export const GAME_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  FPS: 60
};

export const PHYSICS = {
  GRAVITY_Y: 1.15,

  CHARACTER_RADIUS: 22,
  CHARACTER_FRICTION: 0.02,
  CHARACTER_BOUNCE: 0.22,

  PROJECTILE_DENSITY: 0.001,
  GROUND_FRICTION: 0.9
};

export const GAMEPLAY = {
  TURN_TIME: 30, // saniye

  MAX_POWER: 100,
  MIN_POWER: 20,

  // Güç şarj hızı (power / ms)
  // Örn: 80 power aralığı ~ 1200ms sürer.
  CHARGE_SPEED: 0.065,

  WIND_MAX: 3,

  STARTING_HEALTH: 100,
  TEAM_SIZE: 3,

  // Fizik "settle" kriterleri (tur bitirme)
  SETTLE_SPEED_EPS: 0.085,     // Matter hız eşiği
  SETTLE_TIME_MS: 800,         // bu süre boyunca sakin kalırsa settle say
  MAX_RESOLVE_TIME_MS: 9000    // failsafe
};

export const TEAMS = {
  RED: {
    id: 0,
    name: 'Red Team',
    // Biraz daha "oyunsu" palette
    color: 0xFF4D6D,
    outline: 0x9E1632
  },
  BLUE: {
    id: 1,
    name: 'Blue Team',
    color: 0x4D79FF,
    outline: 0x1738A6
  }
};

// Basit "hayvan" seti (vektörel/placeholder görsel)
// İstersen buraya yenilerini ekleyebilirsin.
export const ANIMALS = [
  { id: 'bunny', name: 'Tavşan' },
  { id: 'bear', name: 'Ayı' },
  { id: 'cat', name: 'Kedi' },
  { id: 'fox', name: 'Tilki' },
  { id: 'panda', name: 'Panda' },
  { id: 'pig', name: 'Domuz' }
];

export const WEAPONS = {
  BAZOOKA: {
    id: 'bazooka',
    name: 'Bazooka',
    damage: 35,
    explosionRadius: 80,
    ammo: Infinity,
    projectileSpeed: 1.15
  },
  GRENADE: {
    id: 'grenade',
    name: 'Grenade',
    damage: 45,
    explosionRadius: 95,
    ammo: 5,
    fuseTime: 2400, // ms
    bounces: 3,
    projectileSpeed: 0.95
  }
};

export const COLORS = {
  SKY_TOP: 0x2B7CFF,
  SKY_BOTTOM: 0x0B1B3A,

  GROUND: 0x6E3B1E,
  GROUND_DARK: 0x4A2713,
  GRASS: 0x2AA84A,

  EXPLOSION_ORANGE: 0xFF7A00,
  EXPLOSION_YELLOW: 0xFFE66D,

  UI_TEXT: 0xFFFFFF
};

export const GAME_STATES = {
  MENU: 'menu',
  SETUP: 'setup',
  PLAYER_TURN: 'player_turn',
  AIMING: 'aiming',
  FIRING: 'firing',
  PROJECTILE_FLIGHT: 'projectile_flight',
  PHYSICS_RESOLVE: 'physics_resolve',
  TURN_END: 'turn_end',
  GAME_OVER: 'game_over'
};

export const CONTROLS = {
  MOVE_LEFT: 'A',
  MOVE_RIGHT: 'D',
  JUMP: 'W',
  AIM_UP: 'ArrowUp',
  AIM_DOWN: 'ArrowDown',
  FIRE: 'Space',
  NEXT_WEAPON: 'E',
  PREV_WEAPON: 'Q'
};

export default {
  GAME_CONFIG,
  PHYSICS,
  GAMEPLAY,
  TEAMS,
  ANIMALS,
  WEAPONS,
  COLORS,
  GAME_STATES,
  CONTROLS
};
