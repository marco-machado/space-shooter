import Logger from '../utils/Logger.js';

/**
 * Development Graphics BaseSystem
 * Creates colored rectangles and shapes for rapid prototyping
 * Easy transition to actual sprites by replacing shape creation with scene.add.sprite()
 */
class DevShapes {
  // Color constants for development graphics
  static COLORS = {
    PLAYER: 0x0099ff, // Blue
    ENEMY: 0xff0000, // Red
    ENEMY_FAST: 0xff4444, // Light red
    ENEMY_BOSS: 0xcc0000, // Dark red
    PROJECTILE_PLAYER: 0xffff00, // Yellow
    PROJECTILE_ENEMY: 0xff8800, // Orange
    POWERUP_HEALTH: 0x00ff00, // Green
    POWERUP_WEAPON: 0x8800ff, // Purple
    POWERUP_SPEED: 0x00ffff, // Cyan
    EXPLOSION: 0xffffff, // White
    UI_BACKGROUND: 0x333333, // Dark gray
    UI_BORDER: 0x666666, // Medium gray
  };

  // Standard sizes for different entity types
  static SIZES = {
    PLAYER: { width: 64, height: 64 },
    ENEMY_SMALL: { width: 32, height: 32 },
    ENEMY_MEDIUM: { width: 48, height: 48 },
    ENEMY_LARGE: { width: 64, height: 64 },
    ENEMY_BOSS: { width: 96, height: 96 },
    PROJECTILE_SMALL: { width: 8, height: 16 },
    PROJECTILE_MEDIUM: { width: 12, height: 20 },
    PROJECTILE_LARGE: { width: 16, height: 24 },
    POWERUP: { width: 24, height: 24 },
  };

  /**
   * Create player ship (blue rectangle)
   * @param {Phaser.Scene} scene - Scene to add to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Phaser.GameObjects.Rectangle} Player rectangle
   */
  static createPlayer(scene, x, y) {
    const size = DevShapes.SIZES.PLAYER;
    const player = scene.add.rectangle(x, y, size.width, size.height, DevShapes.COLORS.PLAYER);

    // Add subtle border for visibility
    player.setStrokeStyle(2, 0xffffff, 0.5);

    Logger.scope('DevShapes').debug('DevShapes: Created player rectangle at', x, y);
    return player;
  }

  /**
   * Create enemy ship (red rectangle with type variations)
   * @param {Phaser.Scene} scene - Scene to add to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Enemy type ('small', 'medium', 'large', 'boss', 'fast')
   * @returns {Phaser.GameObjects.Rectangle} Enemy rectangle
   */
  static createEnemy(scene, x, y, type = 'small') {
    let size, color;

    switch (type) {
      case 'fast':
        size = DevShapes.SIZES.ENEMY_SMALL;
        color = DevShapes.COLORS.ENEMY_FAST;
        break;
      case 'medium':
        size = DevShapes.SIZES.ENEMY_MEDIUM;
        color = DevShapes.COLORS.ENEMY;
        break;
      case 'large':
        size = DevShapes.SIZES.ENEMY_LARGE;
        color = DevShapes.COLORS.ENEMY;
        break;
      case 'boss':
        size = DevShapes.SIZES.ENEMY_BOSS;
        color = DevShapes.COLORS.ENEMY_BOSS;
        break;
      case 'small':
      default:
        size = DevShapes.SIZES.ENEMY_SMALL;
        color = DevShapes.COLORS.ENEMY;
        break;
    }

    const enemy = scene.add.rectangle(x, y, size.width, size.height, color);

    // Add border based on type
    if (type === 'boss') {
      enemy.setStrokeStyle(3, 0xffffff, 0.8);
    } else if (type === 'fast') {
      enemy.setStrokeStyle(1, 0xffff00, 0.6);
    } else {
      enemy.setStrokeStyle(1, 0xffffff, 0.3);
    }

    Logger.scope('DevShapes').debug('DevShapes: Created enemy rectangle', type, 'at', x, y);
    return enemy;
  }

  /**
   * Create projectile (colored rectangle or circle)
   * @param {Phaser.Scene} scene - Scene to add to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Projectile type ('player', 'enemy', 'laser', 'missile')
   * @param {string} size - Size ('small', 'medium', 'large')
   * @returns {Phaser.GameObjects.Shape} Projectile shape
   */
  static createProjectile(scene, x, y, type = 'player', size = 'small') {
    // Defensive check for scene object
    if (!scene || !scene.add) {
      Logger.scope('DevShapes').error('Invalid scene object passed to createProjectile', { scene, hasAdd: !!(scene && scene.add) });
      throw new Error('DevShapes.createProjectile requires a valid Phaser scene with scene.add');
    }
    const sizeData =
      DevShapes.SIZES[`PROJECTILE_${size.toUpperCase()}`] || DevShapes.SIZES.PROJECTILE_SMALL;
    const color =
      type === 'player' ? DevShapes.COLORS.PROJECTILE_PLAYER : DevShapes.COLORS.PROJECTILE_ENEMY;

    let projectile;

    // Different shapes for different projectile types
    switch (type) {
      case 'laser':
        // Thin vertical rectangle for laser
        projectile = scene.add.rectangle(x, y, 4, sizeData.height * 1.5, color);
        break;
      case 'missile':
        // Larger rectangle with trail effect
        projectile = scene.add.rectangle(x, y, sizeData.width, sizeData.height, color);
        projectile.setStrokeStyle(1, 0xffffff, 0.5);
        break;
      case 'enemy':
        // Circular enemy projectiles
        projectile = scene.add.circle(x, y, sizeData.width / 2, color);
        break;
      case 'player':
      default:
        // Standard player projectile
        projectile = scene.add.rectangle(x, y, sizeData.width, sizeData.height, color);
        break;
    }

    Logger.scope('DevShapes').debug('DevShapes: Created projectile', type, size, 'at', x, y);
    return projectile;
  }

  /**
   * Create power-up (colored diamond or star shape)
   * @param {Phaser.Scene} scene - Scene to add to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Power-up type ('health', 'weapon', 'speed', 'shield')
   * @returns {Phaser.GameObjects.Shape} Power-up shape
   */
  static createPowerUp(scene, x, y, type = 'health') {
    const size = DevShapes.SIZES.POWERUP;
    let color;

    switch (type) {
      case 'weapon':
        color = DevShapes.COLORS.POWERUP_WEAPON;
        break;
      case 'speed':
        color = DevShapes.COLORS.POWERUP_SPEED;
        break;
      case 'health':
      default:
        color = DevShapes.COLORS.POWERUP_HEALTH;
        break;
    }

    // Create diamond shape using polygon
    const points = [
      0,
      -size.height / 2, // Top
      size.width / 2,
      0, // Right
      0,
      size.height / 2, // Bottom
      -size.width / 2,
      0, // Left
    ];

    const powerup = scene.add.polygon(x, y, points, color);
    powerup.setStrokeStyle(2, 0xffffff, 0.8);

    // Add pulsing animation
    scene.tweens.add({
      targets: powerup,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    Logger.scope('DevShapes').debug('DevShapes: Created power-up', type, 'at', x, y);
    return powerup;
  }

  /**
   * Create explosion effect (expanding circle with particles)
   * @param {Phaser.Scene} scene - Scene to add to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} size - Explosion size ('small', 'medium', 'large')
   * @returns {Object} Explosion effect object
   */
  static createExplosion(scene, x, y, size = 'medium') {
    const baseRadius = size === 'small' ? 20 : size === 'large' ? 60 : 40;
    const particleCount = size === 'small' ? 8 : size === 'large' ? 20 : 12;

    // Main explosion circle
    const explosion = scene.add.circle(x, y, 5, DevShapes.COLORS.EXPLOSION);
    explosion.setAlpha(0.8);

    // Explosion animation
    scene.tweens.add({
      targets: explosion,
      scaleX: baseRadius / 5,
      scaleY: baseRadius / 5,
      alpha: 0,
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => explosion.destroy(),
    });

    // Create particle effects
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const particle = scene.add.circle(x, y, 3, DevShapes.COLORS.EXPLOSION);

      const endX = x + Math.cos(angle) * baseRadius;
      const endY = y + Math.sin(angle) * baseRadius;

      scene.tweens.add({
        targets: particle,
        x: endX,
        y: endY,
        alpha: 0,
        duration: 400,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy(),
      });

      particles.push(particle);
    }

    Logger.scope('DevShapes').debug('DevShapes: Created explosion effect', size, 'at', x, y);
    return { explosion, particles };
  }

  /**
   * Create UI button (rounded rectangle with text)
   * @param {Phaser.Scene} scene - Scene to add to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Button width
   * @param {number} height - Button height
   * @param {string} text - Button text
   * @param {Object} style - Text style options
   * @returns {Object} Button object with background and text
   */
  static createButton(scene, x, y, width, height, text, style = {}) {
    const defaultStyle = {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    };
    const textStyle = { ...defaultStyle, ...style };

    // Button background
    const background = scene.add.rectangle(x, y, width, height, DevShapes.COLORS.UI_BACKGROUND);
    background.setStrokeStyle(2, DevShapes.COLORS.UI_BORDER);

    // Button text
    const buttonText = scene.add.text(x, y, text, textStyle).setOrigin(0.5);

    // Create container for easy interaction
    const button = scene.add.container(x, y, [background, buttonText]);
    button.setSize(width, height);
    button.setInteractive({ useHandCursor: true });

    // Hover effects
    button.on('pointerover', () => {
      background.setFillStyle(DevShapes.COLORS.UI_BORDER);
      buttonText.setColor('#00ff00');
    });

    button.on('pointerout', () => {
      background.setFillStyle(DevShapes.COLORS.UI_BACKGROUND);
      buttonText.setColor('#ffffff');
    });

    Logger.scope('DevShapes').debug('DevShapes: Created UI button', text, 'at', x, y);
    return { container: button, background, text: buttonText };
  }

  /**
   * Create health bar (rectangle with fill)
   * @param {Phaser.Scene} scene - Scene to add to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Bar width
   * @param {number} height - Bar height
   * @param {number} percentage - Health percentage (0-1)
   * @returns {Object} Health bar object
   */
  static createHealthBar(scene, x, y, width, height, percentage = 1) {
    // Background
    const background = scene.add
      .rectangle(x, y, width, height, DevShapes.COLORS.UI_BACKGROUND)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, DevShapes.COLORS.UI_BORDER);

    // Health fill
    const fill = scene.add
      .rectangle(x, y, width * percentage, height - 2, 0x00ff00)
      .setOrigin(0, 0.5);

    // Update method
    const updateHealth = newPercentage => {
      fill.width = width * Math.max(0, Math.min(1, newPercentage));

      // Change color based on health
      if (newPercentage > 0.6) {
        fill.setFillStyle(0x00ff00); // Green
      } else if (newPercentage > 0.3) {
        fill.setFillStyle(0xffff00); // Yellow
      } else {
        fill.setFillStyle(0xff0000); // Red
      }
    };

    Logger.scope('DevShapes').debug('DevShapes: Created health bar at', x, y);
    return { background, fill, updateHealth };
  }

  /**
   * Create simple particle scopeName for effects
   * @param {Phaser.Scene} scene - Scene to add to
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Particle configuration
   * @returns {Array} Array of particle objects
   */
  static createParticles(scene, x, y, config = {}) {
    const defaultConfig = {
      count: 10,
      color: 0xffffff,
      size: 2,
      speed: 100,
      duration: 1000,
      spread: Math.PI * 2,
    };

    const settings = { ...defaultConfig, ...config };
    const particles = [];

    for (let i = 0; i < settings.count; i++) {
      const angle = (settings.spread * i) / settings.count;
      const particle = scene.add.circle(x, y, settings.size, settings.color);

      const endX = x + Math.cos(angle) * settings.speed;
      const endY = y + Math.sin(angle) * settings.speed;

      scene.tweens.add({
        targets: particle,
        x: endX,
        y: endY,
        alpha: 0,
        scale: 0,
        duration: settings.duration,
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy(),
      });

      particles.push(particle);
    }

    Logger.scope('DevShapes').debug('DevShapes: Created particle scopeName with', settings.count, 'particles at', x, y);
    return particles;
  }

  /**
   * Get color by name
   * @param {string} colorName - Color name
   * @returns {number} Color value
   */
  static getColor(colorName) {
    return DevShapes.COLORS[colorName.toUpperCase()] || 0xffffff;
  }

  /**
   * Get size by name
   * @param {string} sizeName - Size name
   * @returns {Object} Size object with width and height
   */
  static getSize(sizeName) {
    return DevShapes.SIZES[sizeName.toUpperCase()] || { width: 32, height: 32 };
  }
}

export default DevShapes;
