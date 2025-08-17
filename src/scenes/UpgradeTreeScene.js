import ConfigManager from '@/config/ConfigManager.js';
import { getEventBus } from '@/event-bus/EventBus.js';
import { EventTypes } from '@/event-bus/EventTypes.js';
import UpgradeSystem from '@/systems/UpgradeSystem.js';
import GameStateManager from '@/utils/GameStateManager.js';
import Logger from '@/utils/Logger.js';

/**
 * Upgrade Tree Scene
 * @class
 * @classdesc Provides UI for browsing and purchasing upgrades from the upgrade tree.
 * Features tree navigation, prerequisite visualization, and purchase interface.
 * @extends Phaser.Scene
 */
export default class UpgradeTreeScene extends Phaser.Scene {
  // Private fields
  #logger;
  #eventBus;
  #gameStateManager;
  #upgradeSystem;

  // UI elements
  #background;
  #titleText;
  #pointsText;
  #backButton;
  #upgradeNodes;
  #connectionLines;
  #tooltip;
  #confirmDialog;
  #dialogEnterKey;
  #dialogEscapeKey;

  // State
  #selectedUpgrade;
  #currentTree = 'weapons';
  #currentBranch = 'laser';
  #availableTrees = ['weapons', 'universal', 'defense', 'mobility'];
  #availableBranches = {
    weapons: ['laser', 'plasma', 'missile'],
    universal: ['thermal', 'firing'],
    defense: ['hull', 'armor', 'shields'],
    mobility: ['speed', 'agility'],
    special: ['utility', 'passive']
  };

  /**
   * Create a new UpgradeTreeScene instance
   */
  constructor() {
    super({ key: 'UpgradeTreeScene' });

    this.#logger = Logger.scope('UpgradeTreeScene');
    this.#eventBus = getEventBus();
    this.#upgradeNodes = [];
    this.#connectionLines = [];
    this.#selectedUpgrade = null;
  }

  /**
   * Initialize the upgrade tree scene
   * @param {Object} data - Scene initialization data
   * @returns {void}
   */
  init(data = {}) {
    // Create or use existing GameStateManager
    this.#gameStateManager = data.gameStateManager || new GameStateManager(this);
    
    // Load saved data if this is a new GameStateManager
    if (!data.gameStateManager) {
      this.#gameStateManager.loadGame();
    }
    
    // Create UpgradeSystem with the GameStateManager
    this.#upgradeSystem = data.upgradeSystem || new UpgradeSystem(this.#gameStateManager);

    this.#logger.info('UpgradeTreeScene initialized', {
      availablePoints: this.#gameStateManager.availablePoints,
      spentPoints: this.#gameStateManager.spentPoints,
      characterLevel: this.#gameStateManager.characterLevel,
      purchasedUpgrades: this.#upgradeSystem.getPurchasedUpgrades().size,
    });
  }

  /**
   * Create the upgrade tree UI
   * @returns {void}
   */
  create() {
    this.createBackground();
    this.createUI();
    this.createUpgradeTree();
    this.setupInputHandlers();
    this.updatePointsDisplay();

    // Emit upgrade tree opened event
    this.#eventBus.emit(EventTypes.UPGRADE_TREE_OPENED, {
      tree: this.#currentTree,
      branch: this.#currentBranch,
    });

    // Fade in effect
    this.cameras.main.fadeIn(500);
  }

  /**
   * Create background and visual elements
   * @private
   * @returns {void}
   */
  createBackground() {
    // Dark background
    this.#background = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x0a0a0a
    );

    // Title - Dynamic based on current tree and branch
    const treeDisplayName = this.getTreeDisplayName(this.#currentTree, this.#currentBranch);
    this.#titleText = this.add.text(
      this.scale.width / 2,
      50,
      treeDisplayName,
      {
        fontSize: '32px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }
    ).setOrigin(0.5);

    // Points display
    this.#pointsText = this.add.text(
      this.scale.width - 20,
      50,
      '',
      {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 1,
      }
    ).setOrigin(1, 0.5);

    // Back button
    this.#backButton = this.add.rectangle(80, 50, 120, 40, 0x444444)
      .setStrokeStyle(2, 0x888888)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goBack())
      .on('pointerover', () => this.#backButton.setFillStyle(0x666666))
      .on('pointerout', () => this.#backButton.setFillStyle(0x444444));

    this.add.text(80, 50, 'Back', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  /**
   * Create main UI elements
   * @private
   * @returns {void}
   */
  createUI() {
    // Tooltip container (initially hidden)
    this.#tooltip = this.add.container(0, 0);
    this.#tooltip.setVisible(false);
    this.#tooltip.setDepth(1000);

    const tooltipBg = this.add.rectangle(0, 0, 300, 150, 0x000000, 0.9)
      .setStrokeStyle(2, 0xffffff);
    
    const tooltipTitle = this.add.text(0, -60, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const tooltipDescription = this.add.text(0, -30, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#cccccc',
      wordWrap: { width: 280 },
    }).setOrigin(0.5);

    const tooltipCost = this.add.text(0, 20, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffff00',
    }).setOrigin(0.5);

    const tooltipStatus = this.add.text(0, 45, '', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.#tooltip.add([tooltipBg, tooltipTitle, tooltipDescription, tooltipCost, tooltipStatus]);
  }

  /**
   * Create the upgrade tree layout
   * @private
   * @returns {void}
   */
  createUpgradeTree() {
    this.clearUpgradeTree();

    const upgrades = this.#upgradeSystem.getUpgradesByBranch(this.#currentTree, this.#currentBranch);
    
    // Get dynamic positions based on current tree/branch
    const positions = this.calculateTreeLayout(this.#currentTree, this.#currentBranch, upgrades);

    // Create upgrade nodes
    for (const upgrade of upgrades) {
      const position = positions[upgrade.id] || this.getDefaultPosition();
      this.createUpgradeNode(upgrade, position.x, position.y);
    }

    // Create connection lines for prerequisites
    this.createConnectionLines(upgrades, positions);
    
    // Update title
    const treeDisplayName = this.getTreeDisplayName(this.#currentTree, this.#currentBranch);
    this.#titleText.setText(treeDisplayName);
  }

  /**
   * Calculate layout positions for different tree configurations
   * @private
   * @param {string} tree - Tree name
   * @param {string} branch - Branch name
   * @param {Array} upgrades - Array of upgrade definitions
   * @returns {Object} Position mapping for upgrades
   */
  calculateTreeLayout(tree, branch, upgrades) {
    if (tree === 'weapons' && branch === 'laser') {
      return {
        'laser-damage-1': { x: 300, y: 200 },
        'laser-damage-2': { x: 300, y: 300 },
        'laser-damage-3': { x: 300, y: 400 },
        'twin-lasers': { x: 500, y: 250 },
        'triple-threat': { x: 500, y: 350 },
        'laser-velocity': { x: 150, y: 200 },
        'piercing-shots': { x: 450, y: 400 },
      };
    }
    
    if (tree === 'defense' && branch === 'hull') {
      return {
        'reinforced-hull-1': { x: 200, y: 200 },
        'reinforced-hull-2': { x: 200, y: 300 },
        'reinforced-hull-3': { x: 200, y: 400 },
        'titanium-plating': { x: 200, y: 500 },
      };
    }
    
    if (tree === 'defense' && branch === 'armor') {
      return {
        'damage-reduction-1': { x: 300, y: 200 },
        'damage-reduction-2': { x: 300, y: 300 },
      };
    }
    
    if (tree === 'mobility' && branch === 'speed') {
      return {
        'engine-boost-1': { x: 250, y: 200 },
        'engine-boost-2': { x: 250, y: 300 },
        'engine-boost-3': { x: 250, y: 400 },
        'afterburner': { x: 450, y: 250 },
        'advanced-afterburner': { x: 450, y: 350 },
      };
    }
    
    if (tree === 'mobility' && branch === 'agility') {
      return {
        'tight-controls': { x: 200, y: 200 },
        'expert-pilot': { x: 200, y: 300 },
        'barrel-roll': { x: 400, y: 250 },
        'evasive-maneuvers': { x: 400, y: 350 },
      };
    }
    
    // Default grid layout for other trees (future expansion)
    return this.generateGridLayout(upgrades);
  }

  /**
   * Generate a default grid layout for upgrades
   * @private
   * @param {Array} upgrades - Array of upgrade definitions
   * @returns {Object} Position mapping
   */
  generateGridLayout(upgrades) {
    const positions = {};
    const startX = 200;
    const startY = 200;
    const spacingX = 150;
    const spacingY = 100;
    const itemsPerRow = 4;
    
    upgrades.forEach((upgrade, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      positions[upgrade.id] = {
        x: startX + col * spacingX,
        y: startY + row * spacingY
      };
    });
    
    return positions;
  }

  /**
   * Get default fallback position
   * @private
   * @returns {Object} Default position
   */
  getDefaultPosition() {
    return { x: 400, y: 300 };
  }

  /**
   * Get display name for tree and branch combination
   * @private
   * @param {string} tree - Tree name
   * @param {string} branch - Branch name
   * @returns {string} Display name
   */
  getTreeDisplayName(tree, branch) {
    const treeNames = {
      weapons: 'Weapons',
      universal: 'Universal',
      defense: 'Defense',
      mobility: 'Mobility',
      special: 'Special'
    };
    
    const branchNames = {
      laser: 'Laser',
      plasma: 'Plasma',
      missile: 'Missile',
      thermal: 'Heat Management',
      firing: 'Fire Rate',
      hull: 'Hull',
      armor: 'Armor',
      shields: 'Shields',
      speed: 'Speed',
      agility: 'Agility',
      utility: 'Utility',
      passive: 'Passive'
    };
    
    const treeName = treeNames[tree] || tree;
    const branchName = branchNames[branch] || branch;
    
    return `${branchName} ${treeName} Tree`;
  }

  /**
   * Create an individual upgrade node
   * @private
   * @param {Object} upgrade - Upgrade definition
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {void}
   */
  createUpgradeNode(upgrade, x, y) {
    try {
      const status = this.#upgradeSystem.getUpgradeStatus(upgrade.id);
      
      // Determine node color based on status
      let nodeColor = 0x333333; // Default: not available
      let borderColor = 0x666666;
      
      if (status.isPurchased) {
        nodeColor = 0x00ff00; // Green: purchased
        borderColor = 0x00aa00;
      } else if (status.canPurchase) {
        nodeColor = 0x0088ff; // Blue: available
        borderColor = 0x0066cc;
      } else if (status.validationResult.code === 'INSUFFICIENT_POINTS') {
        nodeColor = 0xff8800; // Orange: can't afford
        borderColor = 0xcc6600;
      }

      // Create node elements directly in the scene (no container)
      // Node background circle
      const nodeBg = this.add.circle(x, y, 40, nodeColor)
        .setStrokeStyle(3, borderColor)
        .setInteractive({ useHandCursor: !status.isPurchased })
        .on('pointerover', () => this.showTooltip(upgrade, x, y))
        .on('pointerout', () => this.hideTooltip())
        .on('pointerdown', () => this.onUpgradeClicked(upgrade));

      // Node icon/text (simplified)
      const nodeText = this.add.text(x, y, upgrade.name.charAt(0), {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Cost display
      const costText = this.add.text(x, y + 55, `${upgrade.cost}`, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffff00',
      }).setOrigin(0.5);

      // Store all elements for this node
      const nodeElements = { nodeBg, nodeText, costText, upgrade };
      this.#upgradeNodes.push(nodeElements);
      
      this.#logger.debug(`Created upgrade node: ${upgrade.id}`, {
        position: { x, y },
        status: status.canPurchase ? 'available' : 'unavailable',
        cost: upgrade.cost
      });
    } catch (error) {
      this.#logger.error(`Failed to create upgrade node: ${upgrade.id}`, error);
      throw error;
    }
  }

  /**
   * Create connection lines between prerequisites
   * @private
   * @param {Array} upgrades - Array of upgrade definitions
   * @param {Object} positions - Position mapping for upgrades
   * @returns {void}
   */
  createConnectionLines(upgrades, positions) {
    try {
      for (const upgrade of upgrades) {
        for (const prereqId of upgrade.prerequisites) {
          const startPos = positions[prereqId];
          const endPos = positions[upgrade.id];
          
          if (startPos && endPos) {
            const line = this.drawConnectionLine(startPos, endPos);
            this.#connectionLines.push(line);
          }
        }
      }
    } catch (error) {
      this.#logger.error('Failed to create connection lines:', error);
    }
  }

  /**
   * Draw a connection line between two points
   * @private
   * @param {Object} startPos - Starting position {x, y}
   * @param {Object} endPos - Ending position {x, y}
   * @returns {Phaser.GameObjects.Line} Created line object
   */
  drawConnectionLine(startPos, endPos) {
    const line = this.add.line(
      0, 0,
      startPos.x, startPos.y,
      endPos.x, endPos.y,
      0x888888
    ).setLineWidth(2).setOrigin(0).setDepth(-1);
    
    return line;
  }

  /**
   * Clear the current upgrade tree
   * @private
   * @returns {void}
   */
  clearUpgradeTree() {
    // Remove existing nodes (now they are objects with multiple elements)
    this.#upgradeNodes.forEach(nodeElements => {
      if (nodeElements.nodeBg) nodeElements.nodeBg.destroy();
      if (nodeElements.nodeText) nodeElements.nodeText.destroy();
      if (nodeElements.costText) nodeElements.costText.destroy();
    });
    this.#upgradeNodes = [];

    // Remove existing connection lines
    this.#connectionLines.forEach(line => line.destroy());
    this.#connectionLines = [];
  }

  /**
   * Show tooltip for an upgrade
   * @private
   * @param {Object} upgrade - Upgrade definition
   * @param {number} x - Node X position
   * @param {number} y - Node Y position
   * @returns {void}
   */
  showTooltip(upgrade, x, y) {
    try {
      const status = this.#upgradeSystem.getUpgradeStatus(upgrade.id);
      
      // Update tooltip content
      const [_bg, title, description, cost, statusText] = this.#tooltip.list;
      
      title.setText(upgrade.name);
      description.setText(upgrade.description);
      cost.setText(`Cost: ${upgrade.cost} points`);
      
      let statusMessage = '';
      if (status.isPurchased) {
        statusMessage = 'PURCHASED';
      } else if (status.canPurchase) {
        statusMessage = 'Available';
      } else {
        statusMessage = status.validationResult.reason;
      }
      statusText.setText(statusMessage);

      // Position tooltip using utility method
      const tooltipPosition = this.calculateTooltipPosition(x, y);
      this.#tooltip.setPosition(tooltipPosition.x, tooltipPosition.y);
      this.#tooltip.setVisible(true);
    } catch (error) {
      this.#logger.error('Failed to show tooltip:', error);
    }
  }

  /**
   * Calculate optimal tooltip position to keep it on screen
   * @private
   * @param {number} nodeX - Node X position
   * @param {number} nodeY - Node Y position
   * @returns {Object} Calculated position
   */
  calculateTooltipPosition(nodeX, nodeY) {
    const tooltipWidth = 300;
    const tooltipHeight = 150;
    const margin = 20;
    
    let tooltipX = nodeX + 100;
    let tooltipY = nodeY;
    
    // Keep tooltip on screen horizontally
    if (tooltipX + tooltipWidth / 2 > this.scale.width - margin) {
      tooltipX = nodeX - 100;
    }
    if (tooltipX - tooltipWidth / 2 < margin) {
      tooltipX = margin + tooltipWidth / 2;
    }
    
    // Keep tooltip on screen vertically
    if (tooltipY + tooltipHeight / 2 > this.scale.height - margin) {
      tooltipY = this.scale.height - margin - tooltipHeight / 2;
    }
    if (tooltipY - tooltipHeight / 2 < margin) {
      tooltipY = margin + tooltipHeight / 2;
    }
    
    return { x: tooltipX, y: tooltipY };
  }

  /**
   * Hide tooltip
   * @private
   * @returns {void}
   */
  hideTooltip() {
    this.#tooltip.setVisible(false);
  }

  /**
   * Show user message with different styles based on type
   * @private
   * @param {string} message - Message to display
   * @param {string} type - Message type ('info', 'warning', 'error', 'success')
   * @returns {void}
   */
  showUserMessage(message, type = 'info') {
    try {
      const colors = {
        info: 0x0099ff,
        warning: 0xff8800,
        error: 0xff4444,
        success: 0x00ff00
      };
      
      const color = colors[type] || colors.info;
      
      // Create message container
      const messageContainer = this.add.container(this.scale.width / 2, 100);
      messageContainer.setDepth(3000);
      
      const messageBg = this.add.rectangle(0, 0, 400, 60, 0x000000, 0.9)
        .setStrokeStyle(2, color);
      
      const messageText = this.add.text(0, 0, message, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: Phaser.Display.Color.IntegerToColor(color).rgba,
        align: 'center',
        wordWrap: { width: 380 }
      }).setOrigin(0.5);
      
      messageContainer.add([messageBg, messageText]);
      
      // Auto-remove after 3 seconds
      this.time.delayedCall(3000, () => {
        if (messageContainer && messageContainer.scene) {
          messageContainer.destroy();
        }
      });
      
      // Fade in animation
      messageContainer.setAlpha(0);
      this.tweens.add({
        targets: messageContainer,
        alpha: 1,
        duration: 300,
        ease: 'Power2.easeOut'
      });
      
    } catch (error) {
      this.#logger.error('Failed to show user message:', error);
    }
  }

  /**
   * Handle upgrade node click
   * @private
   * @param {Object} upgrade - Upgrade definition
   * @returns {void}
   */
  onUpgradeClicked(upgrade) {
    try {
      this.#logger.info(`Upgrade node clicked: ${upgrade.id}`);
      
      const status = this.#upgradeSystem.getUpgradeStatus(upgrade.id);
      
      if (status.isPurchased) {
        this.#logger.debug('Upgrade already purchased', { upgradeId: upgrade.id });
        this.showUserMessage('This upgrade has already been purchased!', 'info');
        return;
      }

      if (!status.canPurchase) {
        this.#logger.debug('Upgrade not available', { 
          upgradeId: upgrade.id, 
          reason: status.validationResult.reason 
        });
        this.showUserMessage(status.validationResult.reason, 'warning');
        return;
      }

      this.#selectedUpgrade = upgrade;
      this.showPurchaseConfirmation(upgrade);
    } catch (error) {
      this.#logger.error(`Error handling upgrade click: ${upgrade.id}`, error);
      this.showUserMessage('An error occurred. Please try again.', 'error');
    }
  }

  /**
   * Show purchase confirmation dialog
   * @private
   * @param {Object} upgrade - Upgrade to purchase
   * @returns {void}
   */
  showPurchaseConfirmation(upgrade) {
    // Create confirmation dialog
    this.#confirmDialog = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.#confirmDialog.setDepth(2000);

    const dialogBg = this.add.rectangle(0, 0, 400, 200, 0x000000, 0.95)
      .setStrokeStyle(3, 0xffffff);

    const dialogTitle = this.add.text(0, -60, 'Purchase Upgrade?', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const dialogText = this.add.text(0, -20, `${upgrade.name}\n${upgrade.description}\nCost: ${upgrade.cost} points`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#cccccc',
      align: 'center',
    }).setOrigin(0.5);

    const confirmButton = this.add.rectangle(-80, 50, 120, 40, 0x00aa00)
      .setStrokeStyle(2, 0x00ff00)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.confirmPurchase())
      .on('pointerover', () => confirmButton.setFillStyle(0x00cc00))
      .on('pointerout', () => confirmButton.setFillStyle(0x00aa00));

    const confirmText = this.add.text(-80, 50, 'Purchase', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    const cancelButton = this.add.rectangle(80, 50, 120, 40, 0xaa0000)
      .setStrokeStyle(2, 0xff0000)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.cancelPurchase())
      .on('pointerover', () => cancelButton.setFillStyle(0xcc0000))
      .on('pointerout', () => cancelButton.setFillStyle(0xaa0000));

    const cancelText = this.add.text(80, 50, 'Cancel', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Add help text for keyboard navigation
    const helpText = this.add.text(0, 80, 'Press ENTER to Purchase, ESC to Cancel', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5);

    this.#confirmDialog.add([
      dialogBg, dialogTitle, dialogText, 
      confirmButton, confirmText, cancelButton, cancelText, helpText
    ]);

    // Add keyboard handlers for dialog
    this.#setupDialogKeyboard();
  }

  /**
   * Confirm upgrade purchase
   * @private
   * @returns {void}
   */
  confirmPurchase() {
    if (!this.#selectedUpgrade) return;

    try {
      const success = this.#upgradeSystem.purchaseUpgrade(this.#selectedUpgrade.id);
      
      if (success) {
        this.#logger.info(`Upgrade purchased: ${this.#selectedUpgrade.name}`);
        this.showUserMessage(`Successfully purchased: ${this.#selectedUpgrade.name}!`, 'success');
        this.updatePointsDisplay();
        this.createUpgradeTree(); // Refresh tree
      } else {
        this.#logger.warn(`Failed to purchase upgrade: ${this.#selectedUpgrade.name}`);
        this.showUserMessage('Failed to purchase upgrade. Please try again.', 'error');
      }
    } catch (error) {
      this.#logger.error(`Error during upgrade purchase: ${this.#selectedUpgrade.name}`, error);
      this.showUserMessage('An error occurred during purchase. Please try again.', 'error');
    }

    this.closePurchaseConfirmation();
  }

  /**
   * Cancel upgrade purchase
   * @private
   * @returns {void}
   */
  cancelPurchase() {
    this.closePurchaseConfirmation();
  }

  /**
   * Setup keyboard handlers for the purchase confirmation dialog
   * @private
   * @returns {void}
   */
  #setupDialogKeyboard() {
    // Store references to keyboard handlers so we can remove them
    this.#dialogEnterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.#dialogEscapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
    this.#dialogEnterKey.on('down', () => {
      if (this.#confirmDialog) {
        this.confirmPurchase();
      }
    });
    
    this.#dialogEscapeKey.on('down', () => {
      if (this.#confirmDialog) {
        this.cancelPurchase();
      }
    });
  }

  /**
   * Close purchase confirmation dialog
   * @private
   * @returns {void}
   */
  closePurchaseConfirmation() {
    if (this.#confirmDialog) {
      this.#confirmDialog.destroy();
      this.#confirmDialog = null;
    }
    
    // Clean up dialog keyboard handlers
    if (this.#dialogEnterKey) {
      this.#dialogEnterKey.destroy();
      this.#dialogEnterKey = null;
    }
    if (this.#dialogEscapeKey) {
      this.#dialogEscapeKey.destroy();
      this.#dialogEscapeKey = null;
    }
    
    this.#selectedUpgrade = null;
  }

  /**
   * Update points display
   * @private
   * @returns {void}
   */
  updatePointsDisplay() {
    const points = this.#gameStateManager.availablePoints;
    const spent = this.#gameStateManager.spentPoints;
    const total = this.#gameStateManager.getTotalPointsEarned();
    
    this.#pointsText.setText(`Points: ${points} / ${total} (${spent} spent)`);
  }

  /**
   * Switch to a different upgrade tree
   * @private
   * @param {string} tree - Tree name to switch to
   * @param {string} [branch] - Branch name (optional)
   * @returns {void}
   */
  switchTree(tree, branch = null) {
    try {
      if (!this.#availableTrees.includes(tree)) {
        this.#logger.warn(`Invalid tree: ${tree}`);
        this.showUserMessage(`Tree '${tree}' is not available yet!`, 'warning');
        return;
      }
      
      this.#currentTree = tree;
      
      if (branch && this.#availableBranches[tree]?.includes(branch)) {
        this.#currentBranch = branch;
      } else {
        // Use first available branch for the tree
        this.#currentBranch = this.#availableBranches[tree]?.[0] || 'default';
      }
      
      this.#logger.info(`Switched to tree: ${tree}, branch: ${this.#currentBranch}`);
      this.createUpgradeTree();
      
      // Emit tree change event
      this.#eventBus.emit(EventTypes.UPGRADE_TREE_OPENED, {
        tree: this.#currentTree,
        branch: this.#currentBranch,
      });
    } catch (error) {
      this.#logger.error(`Failed to switch tree: ${tree}`, error);
      this.showUserMessage('Failed to switch upgrade tree. Please try again.', 'error');
    }
  }

  /**
   * Setup input handlers
   * @private
   * @returns {void}
   */
  setupInputHandlers() {
    // ESC key to go back
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      .on('down', () => this.goBack());

    // DEBUGGING: Add a scene-wide click handler to test pointer events
    this.input.on('pointerdown', (pointer) => {
      this.#logger.info('Scene click detected', {
        x: pointer.x,
        y: pointer.y,
        worldX: pointer.worldX,
        worldY: pointer.worldY
      });
      
      // Test if clicks are near any upgrade nodes
      for (const nodeElements of this.#upgradeNodes) {
        if (nodeElements.nodeBg) {
          const distance = Phaser.Math.Distance.Between(
            pointer.worldX, pointer.worldY,
            nodeElements.nodeBg.x, nodeElements.nodeBg.y
          );
          if (distance < 50) { // Within 50 pixels
            this.#logger.info('Click near upgrade node detected', {
              upgrade: nodeElements.upgrade.id,
              distance: distance,
              nodeX: nodeElements.nodeBg.x,
              nodeY: nodeElements.nodeBg.y
            });
            this.onUpgradeClicked(nodeElements.upgrade);
            break;
          }
        }
      }
    });

    // R key to reset (for debugging)
    if (ConfigManager.getConfig().debugMode) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
        .on('down', () => {
          try {
            this.#upgradeSystem.resetAllUpgrades();
            this.updatePointsDisplay();
            this.createUpgradeTree();
            this.showUserMessage('All upgrades reset (Debug)', 'info');
          } catch (error) {
            this.#logger.error('Failed to reset upgrades:', error);
            this.showUserMessage('Failed to reset upgrades', 'error');
          }
        });
      
      // Debug keys for tree switching
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE)
        .on('down', () => this.switchTree('weapons', 'laser'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO)
        .on('down', () => this.switchTree('defense', 'hull'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
        .on('down', () => this.switchTree('defense', 'armor'));
      
      // WORKAROUND: Keyboard-based upgrade selection
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
        .on('down', () => this.selectUpgradeByKey('laser-velocity'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        .on('down', () => this.selectUpgradeByKey('laser-damage-1'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
        .on('down', () => this.selectUpgradeByKey('laser-damage-2'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        .on('down', () => this.selectUpgradeByKey('twin-lasers'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        .on('down', () => this.selectUpgradeByKey('triple-threat'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        .on('down', () => this.selectUpgradeByKey('piercing-shots'));
      
      // Defense tree shortcuts
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z)
        .on('down', () => this.selectUpgradeByKey('reinforced-hull-1'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)
        .on('down', () => this.selectUpgradeByKey('reinforced-hull-2'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C)
        .on('down', () => this.selectUpgradeByKey('reinforced-hull-3'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V)
        .on('down', () => this.selectUpgradeByKey('titanium-plating'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B)
        .on('down', () => this.selectUpgradeByKey('damage-reduction-1'));
      
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N)
        .on('down', () => this.selectUpgradeByKey('damage-reduction-2'));
      
      // Add helper message for debug mode
      if (ConfigManager.getConfig().debugMode) {
        this.showUserMessage('Debug Mode: Use Q/W/E/A/S/D for weapons, Z/X/C/V/B/N for defense, R to reset, 1/2/3 to switch trees', 'info');
      }
    }
  }

  /**
   * Select upgrade by keyboard shortcut (workaround for click issues)
   * @private
   * @param {string} upgradeId - ID of upgrade to select
   * @returns {void}
   */
  selectUpgradeByKey(upgradeId) {
    try {
      const upgrade = this.#upgradeSystem.upgradeDefinitions[upgradeId];
      if (!upgrade) {
        this.#logger.warn(`Upgrade not found: ${upgradeId}`);
        this.showUserMessage(`Upgrade ${upgradeId} not found`, 'error');
        return;
      }
      
      this.#logger.info(`Keyboard selection: ${upgradeId}`);
      this.onUpgradeClicked(upgrade);
    } catch (error) {
      this.#logger.error(`Error selecting upgrade by key: ${upgradeId}`, error);
      this.showUserMessage('Error selecting upgrade', 'error');
    }
  }

  /**
   * Go back to previous scene
   * @private
   * @returns {void}
   */
  goBack() {
    // Emit upgrade tree closed event
    this.#eventBus.emit(EventTypes.UPGRADE_TREE_CLOSED, {
      tree: this.#currentTree,
      branch: this.#currentBranch,
    });

    this.cameras.main.fadeOut(300);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MainMenuScene');
    });
  }

  /**
   * Clean up scene resources
   * @returns {void}
   */
  shutdown() {
    this.hideTooltip();
    this.closePurchaseConfirmation();
    this.clearUpgradeTree();

    this.#logger.debug('UpgradeTreeScene shutdown complete');
  }
}