import { describe, it, expect } from 'vitest';
import MathUtils from '../../src/utils/MathUtils.js';

describe('MathUtils', () => {
  describe('distance', () => {
    it('should calculate distance between two points', () => {
      expect(MathUtils.distance(0, 0, 3, 4)).toBe(5);
      expect(MathUtils.distance(0, 0, 0, 0)).toBe(0);
      expect(MathUtils.distance(-1, -1, 1, 1)).toBeCloseTo(2.828, 2);
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(MathUtils.clamp(15, 0, 10)).toBe(10);
      expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
      expect(MathUtils.clamp(5, 0, 10)).toBe(5);
    });
  });

  describe('lerp', () => {
    it('should interpolate between values', () => {
      expect(MathUtils.lerp(0, 10, 0.5)).toBe(5);
      expect(MathUtils.lerp(0, 10, 0)).toBe(0);
      expect(MathUtils.lerp(0, 10, 1)).toBe(10);
      expect(MathUtils.lerp(0, 10, -0.5)).toBe(0); // Clamped
      expect(MathUtils.lerp(0, 10, 1.5)).toBe(10); // Clamped
    });
  });

  describe('degToRad', () => {
    it('should convert degrees to radians', () => {
      expect(MathUtils.degToRad(0)).toBe(0);
      expect(MathUtils.degToRad(90)).toBeCloseTo(Math.PI / 2, 5);
      expect(MathUtils.degToRad(180)).toBeCloseTo(Math.PI, 5);
      expect(MathUtils.degToRad(360)).toBeCloseTo(Math.PI * 2, 5);
    });
  });

  describe('radToDeg', () => {
    it('should convert radians to degrees', () => {
      expect(MathUtils.radToDeg(0)).toBe(0);
      expect(MathUtils.radToDeg(Math.PI / 2)).toBeCloseTo(90, 5);
      expect(MathUtils.radToDeg(Math.PI)).toBeCloseTo(180, 5);
      expect(MathUtils.radToDeg(Math.PI * 2)).toBeCloseTo(360, 5);
    });
  });

  describe('random', () => {
    it('should generate random numbers within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = MathUtils.random(5, 10);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThan(10);
      }
    });
  });

  describe('randomInt', () => {
    it('should generate random integers within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = MathUtils.randomInt(5, 10);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThanOrEqual(10);
        expect(Number.isInteger(result)).toBe(true);
      }
    });
  });

  describe('normalizeAngle', () => {
    it('should normalize angles to 0-2π range', () => {
      expect(MathUtils.normalizeAngle(0)).toBe(0);
      expect(MathUtils.normalizeAngle(Math.PI)).toBe(Math.PI);
      expect(MathUtils.normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 5);
      expect(MathUtils.normalizeAngle(-Math.PI)).toBeCloseTo(Math.PI, 5);
    });
  });

  describe('pointInRect', () => {
    it('should check if point is within rectangle', () => {
      expect(MathUtils.pointInRect(5, 5, 0, 0, 10, 10)).toBe(true);
      expect(MathUtils.pointInRect(0, 0, 0, 0, 10, 10)).toBe(true);
      expect(MathUtils.pointInRect(10, 10, 0, 0, 10, 10)).toBe(true);
      expect(MathUtils.pointInRect(15, 5, 0, 0, 10, 10)).toBe(false);
      expect(MathUtils.pointInRect(-1, 5, 0, 0, 10, 10)).toBe(false);
    });
  });
});