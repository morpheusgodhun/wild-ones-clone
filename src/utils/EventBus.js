/**
 * EventBus - Basit global event sistemi (decoupling)
 */

class EventBus {
  constructor() {
    if (EventBus.instance) return EventBus.instance;
    this.events = {};
    EventBus.instance = this;
  }

  on(eventName, callback, context = null) {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push({ callback, context });
    return () => this.off(eventName, callback);
  }

  once(eventName, callback, context = null) {
    const onceWrapper = (...args) => {
      callback.apply(context, args);
      this.off(eventName, onceWrapper);
    };
    return this.on(eventName, onceWrapper, context);
  }

  emit(eventName, ...args) {
    const list = this.events[eventName];
    if (!list) return;
    // Kopya al: emit sırasında off() çağrılırsa bozulmasın.
    [...list].forEach(({ callback, context }) => callback.apply(context, args));
  }

  off(eventName, callback) {
    const list = this.events[eventName];
    if (!list) return;
    this.events[eventName] = list.filter((l) => l.callback !== callback);
  }

  clear(eventName = null) {
    if (eventName) delete this.events[eventName];
    else this.events = {};
  }
}

export default new EventBus();

export const EVENTS = {
  // Turn events
  TURN_START: 'turn:start',
  TURN_END: 'turn:end',
  TURN_TIMEOUT: 'turn:timeout',

  // Character events
  CHARACTER_DAMAGED: 'character:damaged',
  CHARACTER_DIED: 'character:died',

  // Weapon events
  WEAPON_FIRED: 'weapon:fired',
  WEAPON_CHANGED: 'weapon:changed',

  // Explosion events
  EXPLOSION: 'explosion',

  // Physics events
  PHYSICS_SETTLED: 'physics:settled',

  // Game state events
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',

  // UI
  UI_UPDATE: 'ui:update',
  POWER_CHANGED: 'power:changed',
  ANGLE_CHANGED: 'angle:changed',
  WIND_CHANGED: 'wind:changed'
};
