#!/usr/bin/env node

// Simple test script for ConfigManager with Zod
import ConfigManager from './src/config/ConfigManager.js';

console.log('Testing ConfigManager with Zod...\n');

try {
  // Test initialization
  ConfigManager.init();
  console.log('✓ ConfigManager initialized successfully');
  
  // Test getting config
  const config = ConfigManager.getConfig();
  console.log('✓ getConfig() works:', {
    debugMode: config.debugMode,
    logLevel: config.logLevel,
    startingLives: config.startingLives,
    audioEnabled: config.audioEnabled
  });
  
  // Test constants
  const constants = ConfigManager.getConstants();
  console.log('✓ getConstants() works, colors:', constants.COLORS.PLAYER);
  
  // Test Phaser config
  const phaserConfig = ConfigManager.getPhaserConfig([]);
  console.log('✓ getPhaserConfig() works, width:', phaserConfig.width);
  
  // Test validation
  const isValid = ConfigManager.validate();
  console.log('✓ validate() works:', isValid);
  
  console.log('\n🎉 All ConfigManager tests passed!');
  
} catch (error) {
  console.error('❌ ConfigManager test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}