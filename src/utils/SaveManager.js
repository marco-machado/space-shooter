import Logger from './Logger.js';

/**
 * Save Manager
 * Handles localStorage operations with error handling and validation
 * Provides a safe interface for game data persistence
 */
class SaveManager {
  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {*} data - Data to save (will be JSON stringified)
   * @returns {boolean} True if save successful, false otherwise
   */
  static save(key, data) {
    if (!key || typeof key !== 'string') {
      Logger.error('SaveManager: Invalid key provided', { key });
      return false;
    }

    try {
      const jsonData = JSON.stringify(data);
      localStorage.setItem(key, jsonData);
      Logger.debug('SaveManager: Data saved successfully', { key, size: jsonData.length });
      return true;
    } catch (error) {
      Logger.error('SaveManager: Failed to save data', { key, error: error.message });
      return false;
    }
  }

  /**
   * Load data from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if load fails or key doesn't exist
   * @returns {*} Loaded data or default value
   */
  static load(key, defaultValue = null) {
    if (!key || typeof key !== 'string') {
      Logger.error('SaveManager: Invalid key provided', { key });
      return defaultValue;
    }

    try {
      const jsonData = localStorage.getItem(key);
      if (jsonData === null) {
        Logger.debug('SaveManager: No data found for key', { key });
        return defaultValue;
      }

      const data = JSON.parse(jsonData);
      Logger.debug('SaveManager: Data loaded successfully', { key, hasData: data !== null });
      return data;
    } catch (error) {
      Logger.error('SaveManager: Failed to load data', { key, error: error.message });
      return defaultValue;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if removal successful, false otherwise
   */
  static remove(key) {
    if (!key || typeof key !== 'string') {
      Logger.error('SaveManager: Invalid key provided', { key });
      return false;
    }

    try {
      localStorage.removeItem(key);
      Logger.debug('SaveManager: Data removed successfully', { key });
      return true;
    } catch (error) {
      Logger.error('SaveManager: Failed to remove data', { key, error: error.message });
      return false;
    }
  }

  /**
   * Clear all data from localStorage
   * @returns {boolean} True if clear successful, false otherwise
   */
  static clear() {
    try {
      localStorage.clear();
      Logger.debug('SaveManager: All data cleared successfully');
      return true;
    } catch (error) {
      Logger.error('SaveManager: Failed to clear data', { error: error.message });
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists, false otherwise
   */
  static exists(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }

    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      Logger.error('SaveManager: Failed to check key existence', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get all keys in localStorage (with optional prefix filter)
   * @param {string} prefix - Optional prefix to filter keys
   * @returns {string[]} Array of keys
   */
  static getKeys(prefix = '') {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      Logger.debug('SaveManager: Retrieved keys', { count: keys.length, prefix });
      return keys;
    } catch (error) {
      Logger.error('SaveManager: Failed to get keys', { prefix, error: error.message });
      return [];
    }
  }

  /**
   * Get storage information
   * @returns {Object} Storage usage information
   */
  static getStorageInfo() {
    try {
      const keys = this.getKeys();
      let totalSize = 0;
      const keyInfo = {};

      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          const size = data.length;
          totalSize += size;
          keyInfo[key] = size;
        }
      });

      const info = {
        totalKeys: keys.length,
        totalSize,
        keyInfo,
        available: this.isStorageAvailable(),
      };

      Logger.debug('SaveManager: Storage info retrieved', info);
      return info;
    } catch (error) {
      Logger.error('SaveManager: Failed to get storage info', { error: error.message });
      return {
        totalKeys: 0,
        totalSize: 0,
        keyInfo: {},
        available: false,
      };
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  static isStorageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      Logger.warn('SaveManager: localStorage not available', { error: error.message });
      return false;
    }
  }
}

export default SaveManager;
