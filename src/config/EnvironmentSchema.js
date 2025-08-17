import { z } from 'zod';

/**
 * Environment variable schema using Zod for validation and transformation
 * Handles all environment variable parsing, validation, and default values
 * @module EnvironmentSchema
 */

/**
 * Zod schema for environment variable validation and transformation
 * @constant {z.ZodObject}
 */
const EnvironmentSchema = z.object({
  // Development flags - handle multiple boolean representations
  VITE_DEBUG_MODE: z
    .string()
    .optional()
    .transform(val => {
      if (!val || val === '') return false;
      const normalized = val.toLowerCase().trim();
      return ['true', '1', 'yes', 'on'].includes(normalized);
    }),

  VITE_LOG_LEVEL: z
    .string()
    .optional()
    .transform(val => val?.trim() || 'info')
    .pipe(z.enum(['debug', 'info', 'warn', 'error'])),

  VITE_PHYSICS_DEBUG: z
    .string()
    .optional()
    .transform(val => {
      if (!val || val === '') return false;
      const normalized = val.toLowerCase().trim();
      return ['true', '1', 'yes', 'on'].includes(normalized);
    }),

  VITE_AUDIO_ENABLED: z
    .string()
    .optional()
    .transform(val => {
      if (!val || val === '') return true; // Default to true
      const normalized = val.toLowerCase().trim();
      return !['false', '0', 'no', 'off'].includes(normalized);
    }),

  // Game configuration - parse strings to numbers with bounds
  VITE_STARTING_LIVES: z
    .string()
    .optional()
    .transform(val => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return 3;
      return Math.min(10, Math.max(1, parsed));
    }),

  VITE_BASE_SCORE_MULTIPLIER: z
    .string()
    .optional()
    .transform(val => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) return 1.0;
      return Math.min(10.0, Math.max(0.1, parsed));
    }),

  VITE_PLAYER_FIRE_COOLDOWN: z
    .string()
    .optional()
    .transform(val => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return 200;
      return Math.min(5000, Math.max(50, parsed));
    }),

  // Performance settings
  VITE_MAX_PARTICLES: z
    .string()
    .optional()
    .transform(val => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return 1000;
      return Math.min(10000, Math.max(100, parsed));
    }),

  VITE_OBJECT_POOL_SIZE: z
    .string()
    .optional()
    .transform(val => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return 200;
      return Math.min(1000, Math.max(50, parsed));
    }),

  // Development graphics
  VITE_SHOW_FPS: z
    .string()
    .optional()
    .transform(val => {
      if (!val || val === '') return false;
      const normalized = val.toLowerCase().trim();
      return ['true', '1', 'yes', 'on'].includes(normalized);
    }),

  VITE_SHOW_DEBUG_INFO: z
    .string()
    .optional()
    .transform(val => {
      if (!val || val === '') return false;
      const normalized = val.toLowerCase().trim();
      return ['true', '1', 'yes', 'on'].includes(normalized);
    }),

  // Progression settings for testing
  VITE_FAST_PROGRESSION: z
    .string()
    .optional()
    .transform(val => {
      if (!val || val === '') return false;
      const normalized = val.toLowerCase().trim();
      return ['true', '1', 'yes', 'on'].includes(normalized);
    }),

  // Development starting points for easier upgrade testing
  VITE_DEV_STARTING_POINTS: z
    .string()
    .optional()
    .transform(val => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return 0;
      return Math.min(100, Math.max(0, parsed)); // Cap at 100 points for safety
    }),
});

export default EnvironmentSchema;
