import HealthComponent from '@/components/Health.js';
import { GameConfig } from '@/config/GameConfig.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import Logger from '@/utils/Logger.js';

/**
 * Creates a new player entity with enhanced movement controls, health component, and mobility upgrades.
 * @param {Phaser.Physics.Arcade.Group} playerGroup - The physics group to add the player to
 * @param {UpgradeSystem} [upgradeSystem] - Optional upgrade system for mobility effects
 * @returns {Phaser.GameObjects.Rectangle} The created player object with enhanced update and destroy methods
 */
export function playerFactory(playerGroup, upgradeSystem = null) {
  const scene = playerGroup.scene;
  const eventBus = getEventBus();
  const logger = Logger.scope('Player');

  const player = scene.add.rectangle(
    scene.scale.width / 2,
    scene.scale.height - GameConfig.PLAYER.START_Y_OFFSET,
    GameConfig.PLAYER.WIDTH,
    GameConfig.PLAYER.HEIGHT,
    GameConfig.PLAYER.COLOR,
  );

  // playerGroup adds a physics body to player
  playerGroup.add(player);

  player.body.setCollideWorldBounds(true);

  // Add health component
  player.health = new HealthComponent(player, GameConfig.PLAYER.HEALTH);

  // Mobility upgrade state
  player.upgradeSystem = upgradeSystem;
  player.mobilityState = {
    // Double-tap detection
    doubleTapWindow: 300, // milliseconds
    keyStates: {
      left: { lastPressTime: 0, doubleTapReady: false },
      right: { lastPressTime: 0, doubleTapReady: false },
      up: { lastPressTime: 0, doubleTapReady: false },
      down: { lastPressTime: 0, doubleTapReady: false }
    },
    
    // Special abilities state
    afterburner: {
      active: false,
      startTime: 0,
      cooldownEndTime: 0
    },
    barrelRoll: {
      active: false,
      startTime: 0,
      cooldownEndTime: 0,
      invulnerable: false
    }
  };

  /**
   * Handle double-tap detection for special abilities
   * @private
   * @param {string} direction - Movement direction (left, right, up, down)
   * @param {number} currentTime - Current time in milliseconds
   * @returns {boolean} True if double-tap detected
   */
  player.handleDoubleTap = function(direction, currentTime) {
    const keyState = this.mobilityState.keyStates[direction];
    
    if (currentTime - keyState.lastPressTime < this.mobilityState.doubleTapWindow) {
      // Double-tap detected
      keyState.doubleTapReady = false;
      
      // Try to activate special abilities
      if (this.upgradeSystem) {
        const effects = this.upgradeSystem.getUpgradeEffects();
        
        // Try Afterburner activation
        if (effects.afterburnerDuration > 0 && !this.mobilityState.afterburner.active && 
            currentTime >= this.mobilityState.afterburner.cooldownEndTime) {
          this.activateAfterburner(currentTime, effects);
          return true;
        }
        
        // Try Barrel Roll activation  
        if (effects.barrelRollDuration > 0 && !this.mobilityState.barrelRoll.active &&
            currentTime >= this.mobilityState.barrelRoll.cooldownEndTime) {
          this.activateBarrelRoll(currentTime, effects);
          return true;
        }
      }
    }
    
    keyState.lastPressTime = currentTime;
    return false;
  };

  /**
   * Activate afterburner special ability
   * @private
   * @param {number} currentTime - Current time in milliseconds
   * @param {Object} effects - Upgrade effects
   */
  player.activateAfterburner = function(currentTime, effects) {
    this.mobilityState.afterburner.active = true;
    this.mobilityState.afterburner.startTime = currentTime;
    
    logger.info('Afterburner activated', {
      duration: effects.afterburnerDuration,
      speed: effects.afterburnerSpeed,
      damageTrail: effects.afterburnerDamageTrail
    });

    eventBus.emit(EventTypes.AFTERBURNER_ACTIVATED, {
      player: this,
      duration: effects.afterburnerDuration,
      speedMultiplier: effects.afterburnerSpeed,
      damageTrail: effects.afterburnerDamageTrail
    });
  };

  /**
   * Deactivate afterburner special ability
   * @private
   * @param {number} currentTime - Current time in milliseconds
   * @param {Object} effects - Upgrade effects
   */
  player.deactivateAfterburner = function(currentTime, effects) {
    this.mobilityState.afterburner.active = false;
    this.mobilityState.afterburner.cooldownEndTime = currentTime + effects.afterburnerCooldown;
    
    logger.info('Afterburner deactivated', {
      cooldownUntil: this.mobilityState.afterburner.cooldownEndTime
    });

    eventBus.emit(EventTypes.AFTERBURNER_DEACTIVATED, {
      player: this,
      cooldownDuration: effects.afterburnerCooldown
    });
  };

  /**
   * Activate barrel roll special ability  
   * @private
   * @param {number} currentTime - Current time in milliseconds
   * @param {Object} effects - Upgrade effects
   */
  player.activateBarrelRoll = function(currentTime, effects) {
    this.mobilityState.barrelRoll.active = true;
    this.mobilityState.barrelRoll.startTime = currentTime;
    this.mobilityState.barrelRoll.invulnerable = effects.invulnerabilityFrames;
    
    logger.info('Barrel roll activated', {
      duration: effects.barrelRollDuration,
      invulnerable: effects.invulnerabilityFrames
    });

    eventBus.emit(EventTypes.BARREL_ROLL_ACTIVATED, {
      player: this,
      duration: effects.barrelRollDuration,
      invulnerable: effects.invulnerabilityFrames
    });
  };

  /**
   * Deactivate barrel roll special ability
   * @private
   * @param {number} currentTime - Current time in milliseconds  
   * @param {Object} effects - Upgrade effects
   */
  player.deactivateBarrelRoll = function(currentTime, effects) {
    this.mobilityState.barrelRoll.active = false;
    this.mobilityState.barrelRoll.invulnerable = false;
    this.mobilityState.barrelRoll.cooldownEndTime = currentTime + effects.barrelRollCooldown;
    
    logger.info('Barrel roll deactivated', {
      cooldownUntil: this.mobilityState.barrelRoll.cooldownEndTime
    });

    eventBus.emit(EventTypes.BARREL_ROLL_DEACTIVATED, {
      player: this,
      cooldownDuration: effects.barrelRollCooldown
    });
  };

  /**
   * Check if player is currently invulnerable
   * @returns {boolean} True if player is invulnerable to damage
   */
  player.isInvulnerable = function() {
    return this.mobilityState.barrelRoll.invulnerable;
  };

  /**
   * Check if player should dodge incoming damage
   * @returns {boolean} True if damage should be dodged
   */
  player.shouldDodgeDamage = function() {
    if (!this.upgradeSystem) return false;
    
    const effects = this.upgradeSystem.getUpgradeEffects();
    if (effects.dodgeChance <= 0) return false;
    
    const dodgeRoll = Math.random();
    const dodged = dodgeRoll < effects.dodgeChance;
    
    if (dodged) {
      logger.debug('Player dodged damage', {
        dodgeChance: effects.dodgeChance,
        roll: dodgeRoll
      });
      
      eventBus.emit(EventTypes.PLAYER_DODGED, {
        player: this,
        dodgeChance: effects.dodgeChance,
        roll: dodgeRoll
      });
    }
    
    return dodged;
  };

  /**
   * Update player movement based on keyboard input with mobility upgrades.
   * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors - Cursor keys object
   * @param {number} delta - Time delta in milliseconds
   * @returns {void}
   */
  player.update = function (cursors, delta) {
    // Enhanced input validation
    if (!cursors || !this.body) return;
    if (!cursors.left || !cursors.right || !cursors.up || !cursors.down) return;
    if (typeof cursors.left.isDown !== 'boolean' || 
        typeof cursors.right.isDown !== 'boolean' || 
        typeof cursors.up.isDown !== 'boolean' || 
        typeof cursors.down.isDown !== 'boolean') return;

    const currentTime = Date.now();
    
    // Get mobility effects from upgrade system
    let speedMultiplier = 1.0;
    let accelerationMultiplier = 1.0;
    let hitboxMultiplier = 1.0;
    
    if (this.upgradeSystem) {
      const effects = this.upgradeSystem.getUpgradeEffects();
      speedMultiplier = effects.movementSpeedMultiplier;
      accelerationMultiplier = effects.accelerationMultiplier;
      hitboxMultiplier = effects.hitboxMultiplier;
      
      // Update special abilities
      this.updateSpecialAbilities(currentTime, effects);
      
      // Apply afterburner speed boost
      if (this.mobilityState.afterburner.active) {
        speedMultiplier *= effects.afterburnerSpeed;
      }
      
      // Apply hitbox size changes
      if (Math.abs(hitboxMultiplier - 1.0) > 0.01) {
        const newWidth = GameConfig.PLAYER.WIDTH * hitboxMultiplier;
        const newHeight = GameConfig.PLAYER.HEIGHT * hitboxMultiplier;
        this.body.setSize(newWidth, newHeight);
      }
    }

    const baseSpeed = GameConfig.PLAYER.SPEED;
    const finalSpeed = baseSpeed * speedMultiplier;
    
    let velocityX = 0;
    let velocityY = 0;

    // Handle double-tap detection and movement
    if (cursors.left.isDown) {
      if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
        this.handleDoubleTap('left', currentTime);
      }
      velocityX = -finalSpeed;
    } else if (cursors.right.isDown) {
      if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
        this.handleDoubleTap('right', currentTime);
      }
      velocityX = finalSpeed;
    }

    if (cursors.up.isDown) {
      if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        this.handleDoubleTap('up', currentTime);
      }
      velocityY = -finalSpeed;
    } else if (cursors.down.isDown) {
      if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
        this.handleDoubleTap('down', currentTime);
      }
      velocityY = finalSpeed;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      const normalizedSpeed = finalSpeed * 0.707; // sqrt(2)/2 ≈ 0.707
      velocityX = velocityX > 0 ? normalizedSpeed : -normalizedSpeed;
      velocityY = velocityY > 0 ? normalizedSpeed : -normalizedSpeed;
    }

    // Apply acceleration multiplier (simulated by adjusting velocity application)
    if (accelerationMultiplier !== 1.0) {
      // Higher acceleration means reaching target velocity faster
      const currentVelX = this.body.velocity.x;
      const currentVelY = this.body.velocity.y;
      const accelFactor = accelerationMultiplier;
      
      velocityX = currentVelX + (velocityX - currentVelX) * accelFactor * (delta / 16.67); // normalize to 60fps
      velocityY = currentVelY + (velocityY - currentVelY) * accelFactor * (delta / 16.67);
    }

    // Apply velocity
    this.body.setVelocity(velocityX, velocityY);
  };

  /**
   * Update special abilities (afterburner, barrel roll) timers
   * @private
   * @param {number} currentTime - Current time in milliseconds
   * @param {Object} effects - Upgrade effects
   */
  player.updateSpecialAbilities = function(currentTime, effects) {
    // Update afterburner
    if (this.mobilityState.afterburner.active) {
      const elapsed = currentTime - this.mobilityState.afterburner.startTime;
      if (elapsed >= effects.afterburnerDuration) {
        this.deactivateAfterburner(currentTime, effects);
      }
    }
    
    // Update barrel roll
    if (this.mobilityState.barrelRoll.active) {
      const elapsed = currentTime - this.mobilityState.barrelRoll.startTime;
      if (elapsed >= effects.barrelRollDuration) {
        this.deactivateBarrelRoll(currentTime, effects);
      }
    }
  };

  /**
   * Destroy the player and clean up resources
   * @returns {void}
   */
  player.destroy = function () {
    if (this.health) {
      this.health.destroy();
      this.health = null;
    }
    
    // Clean up mobility state
    this.mobilityState = null;
    this.upgradeSystem = null;
  };

  return player;
}
