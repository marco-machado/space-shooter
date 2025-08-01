/**
 * Math utility functions for the game
 * Pure functions that can be easily tested
 */
class MathUtils {
  /**
   * Calculate distance between two points
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Distance between points
   */
  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Clamp a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Linear interpolation between two values
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  static lerp(start, end, t) {
    return start + (end - start) * this.clamp(t, 0, 1);
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   * @param {number} radians - Angle in radians
   * @returns {number} Angle in degrees
   */
  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Generate random number within range
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (exclusive)
   * @returns {number} Random number in range
   */
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generate random integer within range
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random integer in range
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Normalize angle to 0-2π range
   * @param {number} angle - Angle in radians
   * @returns {number} Normalized angle
   */
  static normalizeAngle(angle) {
    let normalizedAngle = angle;
    while (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
    while (normalizedAngle >= Math.PI * 2) normalizedAngle -= Math.PI * 2;
    return normalizedAngle;
  }

  /**
   * Check if point is within rectangle
   * @param {number} x - Point X
   * @param {number} y - Point Y
   * @param {number} rectX - Rectangle X
   * @param {number} rectY - Rectangle Y
   * @param {number} rectWidth - Rectangle width
   * @param {number} rectHeight - Rectangle height
   * @returns {boolean} True if point is within rectangle
   */
  static pointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
    return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
  }
}

export default MathUtils;
