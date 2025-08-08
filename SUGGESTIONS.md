# Space Shooter Game - Phaser Suggestions

Based on the Phaser documentation and examples, here are key suggestions for space shooter games:

## Core Space Shooter Features
- Use `this.physics.arcade` for collision detection between bullets, enemies, and player
- Implement `this.time.addEvent` for enemy spawning patterns and power-up timers
- Create bullet pools using object pooling for performance: `this.physics.add.group`
- Use `this.input.keyboard.createCursorKeys()` for player movement controls

## Visual Effects
- Add `postFX.addGlow()` effects to bullets and explosions for sci-fi aesthetics
- Use `postFX.addBlur()` for speed/motion effects during fast movement
- Apply `postFX.addBloom()` to create energy weapon glowing effects
- Implement `preFX.addTiltShift()` for depth-of-field effects on background elements

## Performance Optimization
- Use `this.matter.add.sprite()` with custom collision shapes for complex ship designs
- Implement object pooling for projectiles to avoid constant creation/destruction
- Leverage `this.tweens.stagger()` for coordinated enemy movement patterns
- Use `this.sound.add()` with spatial audio for directional weapon sounds

## Game Structure
- Create separate scenes: `BootScene`, `MenuScene`, `GameScene`, `GameOverScene`
- Use `this.scene.start()` and `this.scene.pause()` for scene transitions
- Implement `this.cameras.main.shake()` for impact effects
- Add particle emitters for explosions and engine trails: `this.add.particles()`

## Timeline System
Use `this.add.timeline()` for scripted sequences like boss battles or cutscenes with precise timing control.