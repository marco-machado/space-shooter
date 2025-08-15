export function createBackground(scene) {
  const centerX = scene.scale.width / 2;
  const centerY = scene.scale.height / 2;

  // Dark space background
  scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x000011);

  const stars = scene.add.group();

  for (let i = 0; i < 100; i++) {
    const star = scene.add.circle(
      Math.random() * scene.scale.width,
      Math.random() * scene.scale.height,
      Math.random() * 1.5 + 0.5,
      0xffffff,
      Math.random() * 0.8 + 0.2,
    );

    scene.physics.add.existing(star);

    star.body.setVelocity(0, Math.random() * 50 + 25);
    star.body.setCollideWorldBounds(false);

    stars.add(star);
  }

  return stars;
}

export function updateBackground(starsGroup) {
  starsGroup.children.entries.forEach(star => {
    // Reset star position when it goes off screen (physics-based wrapping)
    if (star.y > starsGroup.scene.scale.height + 10) {
      star.y = -10;
      star.x = Math.random() * starsGroup.scene.scale.width;
    }
  });
}
