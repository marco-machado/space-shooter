# Development Graphics Strategy

## Development Phase Approach:
Use **simple colored rectangles and shapes** for rapid prototyping instead of image files.

## Color Coding Standards:
- **Player**: `0x0099ff` (blue) - 64x64px rectangle
- **Enemies**: 
  - Basic: `0xff0000` (red) - 32x32px, 48x48px rectangles
  - Boss: `0xcc0000` (dark red) - 80x80px+ rectangles
- **Projectiles**: 
  - Player bullets: `0xffff00` (yellow) - 8x8px rectangles
  - Enemy bullets: `0xff8800` (orange) - 8x8px rectangles
- **Power-ups**: 
  - Temporary: `0x00ff00` (green) - diamond shapes
  - Permanent: `0x8800ff` (purple) - star shapes
- **UI Elements**: 
  - Text: `0xffffff` (white)
  - Backgrounds: `0x333333` (dark gray)

## Implementation Examples:
```javascript
// Development graphics helper
class DevShapes {
    static createPlayer(scene, x, y) {
        const player = scene.add.rectangle(x, y, 64, 64, 0x0099ff);
        scene.physics.add.existing(player);
        return player;
    }
    
    static createEnemy(scene, x, y, size = 32) {
        const enemy = scene.add.rectangle(x, y, size, size, 0xff0000);
        scene.physics.add.existing(enemy);
        return enemy;
    }
    
    static createPowerUp(scene, x, y, type = 'temporary') {
        const color = type === 'temporary' ? 0x00ff00 : 0x8800ff;
        const powerUp = scene.add.polygon(x, y, [0,-16, 14,14, -14,14], color);
        scene.physics.add.existing(powerUp);
        return powerUp;
    }
}
```

## Benefits:
- **Fast iteration**: No need to create/load graphics files
- **Clear identification**: Color coding makes entity types obvious
- **Easy transition**: Simple parameter change to switch to sprites later
- **Performance**: Lightweight rendering during development

## Production Transition:
When ready for final graphics, simply replace shape creation with:
```javascript
// From: scene.add.rectangle(x, y, 64, 64, 0x0099ff)
// To:   scene.add.sprite(x, y, 'player-texture')
```