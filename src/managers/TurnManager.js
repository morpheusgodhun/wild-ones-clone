/**
 * TurnManager
 * - Sıra akışı + timer + fizik settle bekleme
 */

import { GAMEPLAY, GAME_STATES } from '../config/Constants.js';
import EventBus, { EVENTS } from '../utils/EventBus.js';

export class TurnManager {
  constructor(scene) {
    this.scene = scene;

    this.currentTeamIndex = 0;
    this.currentCharacterIndex = 0;

    this.turnTimeRemaining = GAMEPLAY.TURN_TIME;
    this.gameState = GAME_STATES.MENU;

    this.timer = null;

    this.teams = []; // [teamIndex][charIndex]
    this.activeCharacter = null;

    // resolve tracking
    this._resolveCheckTimer = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    EventBus.on(EVENTS.WEAPON_FIRED, this.onWeaponFired, this);
    EventBus.on(EVENTS.PHYSICS_SETTLED, this.onPhysicsSettled, this);
    EventBus.on(EVENTS.CHARACTER_DIED, this.onCharacterDied, this);
  }

  startGame(teams) {
    this.teams = teams;
    this.currentTeamIndex = 0;
    this.currentCharacterIndex = 0;
    this.gameState = GAME_STATES.PLAYER_TURN;

    EventBus.emit(EVENTS.GAME_START);
    this.startTurn();
  }

  startTurn() {
    this.findNextAliveCharacter();

    if (!this.activeCharacter) {
      this.checkGameOver();
      return;
    }

    this.gameState = GAME_STATES.PLAYER_TURN;
    this.turnTimeRemaining = GAMEPLAY.TURN_TIME;

    this.activeCharacter.setActive(true);

    this.startTimer();
    EventBus.emit(EVENTS.TURN_START, this.activeCharacter);

    // UI sync
    EventBus.emit(EVENTS.UI_UPDATE, { timeRemaining: this.turnTimeRemaining });
  }

  findNextAliveCharacter() {
    const startTeam = this.currentTeamIndex;
    const startChar = this.currentCharacterIndex;

    let loops = 0;
    while (loops < 200) {
      const team = this.teams[this.currentTeamIndex];
      if (team && team.length) {
        const candidate = team[this.currentCharacterIndex];
        if (candidate && candidate.isAlive) {
          this.activeCharacter = candidate;
          return;
        }
      }

      // next
      this.currentCharacterIndex++;

      if (!team || this.currentCharacterIndex >= team.length) {
        this.currentCharacterIndex = 0;
        this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length;
      }

      if (this.currentTeamIndex === startTeam && this.currentCharacterIndex === startChar) {
        this.activeCharacter = null;
        return;
      }

      loops++;
    }

    this.activeCharacter = null;
  }

  startTimer() {
    this.stopTimer();

    this.timer = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.onTimerTick,
      callbackScope: this
    });
  }

  onTimerTick() {
    this.turnTimeRemaining--;

    EventBus.emit(EVENTS.UI_UPDATE, { timeRemaining: this.turnTimeRemaining });

    if (this.turnTimeRemaining <= 0) {
      this.onTurnTimeout();
    }
  }

  stopTimer() {
    if (this.timer) {
      this.timer.remove();
      this.timer = null;
    }
  }

  onTurnTimeout() {
    this.stopTimer();
    EventBus.emit(EVENTS.TURN_TIMEOUT, this.activeCharacter);
    this.endTurn();
  }

  onWeaponFired(_weapon, _ownerCharacter) {
    // Fire edilince tur süresi durur, karakter pasifleşir
    this.stopTimer();
    this.gameState = GAME_STATES.PROJECTILE_FLIGHT;

    if (this.activeCharacter) {
      this.activeCharacter.setActive(false);
      this.activeCharacter.canMove = false;
    }

    this.waitForPhysicsSettle();
  }

  waitForPhysicsSettle() {
    this.clearResolveTimer();

    this.gameState = GAME_STATES.PHYSICS_RESOLVE;

    const startMs = this.scene.time.now;
    let settledSince = null;

    this._resolveCheckTimer = this.scene.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        const now = this.scene.time.now;

        const canCheck = typeof this.scene.isPhysicsSettled === 'function';
        const settled = canCheck ? this.scene.isPhysicsSettled() : (now - startMs > 2000);

        if (settled) {
          if (settledSince === null) settledSince = now;

          if (now - settledSince >= GAMEPLAY.SETTLE_TIME_MS) {
            this.clearResolveTimer();
            EventBus.emit(EVENTS.PHYSICS_SETTLED);
            return;
          }
        } else {
          settledSince = null;
        }

        if (now - startMs >= GAMEPLAY.MAX_RESOLVE_TIME_MS) {
          this.clearResolveTimer();
          EventBus.emit(EVENTS.PHYSICS_SETTLED);
        }
      }
    });
  }

  clearResolveTimer() {
    if (this._resolveCheckTimer) {
      this._resolveCheckTimer.remove();
      this._resolveCheckTimer = null;
    }
  }

  onPhysicsSettled() {
    this.clearResolveTimer();
    this.gameState = GAME_STATES.TURN_END;

    this.scene.time.delayedCall(450, () => this.endTurn());
  }

  endTurn() {
    if (this.activeCharacter) {
      this.activeCharacter.setActive(false);
    }

    EventBus.emit(EVENTS.TURN_END, this.activeCharacter);

    // sıra değiştir
    this.currentCharacterIndex++;
    const team = this.teams[this.currentTeamIndex];

    if (!team || this.currentCharacterIndex >= team.length) {
      this.currentCharacterIndex = 0;
      this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length;
    }

    this.scene.time.delayedCall(250, () => this.startTurn());
  }

  onCharacterDied(_character) {
    this.checkGameOver();
  }

  checkGameOver() {
    const aliveTeams = this.teams
      .map((team, index) => ({ index, alive: team.filter((c) => c.isAlive).length }))
      .filter((t) => t.alive > 0);

    if (aliveTeams.length <= 1) {
      const winner = aliveTeams.length === 1 ? aliveTeams[0].index : null;
      this.endGame(winner);
    }
  }

  endGame(winnerTeamIndex) {
    this.stopTimer();
    this.clearResolveTimer();

    this.gameState = GAME_STATES.GAME_OVER;
    EventBus.emit(EVENTS.GAME_OVER, winnerTeamIndex);
  }

  getGameState() {
    return this.gameState;
  }

  getActiveCharacter() {
    return this.activeCharacter;
  }

  destroy() {
    this.stopTimer();
    this.clearResolveTimer();
    EventBus.clear();
  }
}

export default TurnManager;
