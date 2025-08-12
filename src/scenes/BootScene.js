import Phaser from 'phaser';

/**
 * Boot Scene
 * @class
 * @classdesc Handles environment initialization and transitions to preloader.
 * This is the first scene to load and sets up the basic environment before
 * transitioning to the PreloaderScene for asset loading.
 * @extends Phaser.Scene
 */
export default class BootScene extends Phaser.Scene {
  /**
   * Create a new BootScene instance.
   * @constructor
   */
  constructor() {
    super({ key: 'BootScene' });
  }

  /**
   * Preload minimal assets needed for the boot scene.
   * @returns {void}
   */
  preload() {
    this.load.path = 'assets/';

    this.load.image('bootSceneBackground', 'boot.png');
  }

  /**
   * Create the boot scene.
   * @returns {void}
   */
  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.image(centerX, centerY, 'bootSceneBackground');

    this.add
      .text(centerX, centerY + 50, 'LOADING', {
        fontSize: '36px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5);

    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);

      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('PreloaderScene');
      });
    });
  }
}
