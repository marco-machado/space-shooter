import Logger from './Logger.js';

/**
 * Object Pool
 * Generic object pooling for performance optimization
 * Reduces garbage collection by reusing objects
 */
class ObjectPool {
  /**
   * Create a new object pool
   * @param {Function} createFunction - Function to create new objects
   * @param {Function} resetFunction - Function to reset objects before reuse
   * @param {number} initialSize - Initial pool size
   * @param {number} maxSize - Maximum pool size
   */
  constructor(createFunction, resetFunction, initialSize = 10, maxSize = 100) {
    if (typeof createFunction !== 'function') {
      throw new Error('ObjectPool: createFunction must be a function');
    }

    if (typeof resetFunction !== 'function') {
      throw new Error('ObjectPool: resetFunction must be a function');
    }

    this.createFunction = createFunction;
    this.resetFunction = resetFunction;
    this.maxSize = Math.max(1, maxSize);
    this.pool = [];
    this.activeObjects = new Set();

    // Pre-populate pool
    const preSize = Math.min(Math.max(0, initialSize), this.maxSize);
    for (let i = 0; i < preSize; i++) {
      try {
        const obj = this.createFunction();
        this.pool.push(obj);
      } catch (error) {
        Logger.scope('ObjectPool').error('ObjectPool: Failed to create initial object', { error: error.message });
        break;
      }
    }

    Logger.scope('ObjectPool').debug('ObjectPool: Created', {
      initialSize: this.pool.length,
      maxSize: this.maxSize,
    });
  }

  /**
   * Get an object from the pool
   * @returns {*} Object from pool or newly created object
   */
  get() {
    let obj;

    if (this.pool.length > 0) {
      obj = this.pool.pop();
      Logger.scope('ObjectPool').debug('ObjectPool: Reused object from pool', {
        poolSize: this.pool.length,
        activeCount: this.activeObjects.size,
      });
    } else {
      try {
        obj = this.createFunction();
        Logger.scope('ObjectPool').debug('ObjectPool: Created new object', {
          poolSize: this.pool.length,
          activeCount: this.activeObjects.size,
        });
      } catch (error) {
        Logger.scope('ObjectPool').error('ObjectPool: Failed to create new object', { error: error.message });
        return null;
      }
    }

    this.activeObjects.add(obj);
    return obj;
  }

  /**
   * Release an object back to the pool
   * @param {*} obj - Object to release
   * @returns {boolean} True if object was released successfully
   */
  release(obj) {
    if (!obj) {
      Logger.scope('ObjectPool').warn('ObjectPool: Attempted to release null/undefined object');
      return false;
    }

    if (!this.activeObjects.has(obj)) {
      Logger.scope('ObjectPool').warn('ObjectPool: Attempted to release object not from this pool');
      return false;
    }

    this.activeObjects.delete(obj);

    // Only return to pool if we haven't exceeded max size
    if (this.pool.length < this.maxSize) {
      try {
        this.resetFunction(obj);
        this.pool.push(obj);
        Logger.scope('ObjectPool').debug('ObjectPool: Object released to pool', {
          poolSize: this.pool.length,
          activeCount: this.activeObjects.size,
        });
        return true;
      } catch (error) {
        Logger.scope('ObjectPool').error('ObjectPool: Failed to reset object', { error: error.message });
        return false;
      }
    } else {
      Logger.scope('ObjectPool').debug('ObjectPool: Object discarded (max size reached)', {
        poolSize: this.pool.length,
        activeCount: this.activeObjects.size,
      });
      return true;
    }
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.activeObjects.size,
      maxSize: this.maxSize,
      totalCreated: this.activeObjects.size + this.pool.length,
      utilizationRate: this.activeObjects.size / (this.activeObjects.size + this.pool.length) || 0,
    };
  }

  /**
   * Clear the pool and release all objects
   */
  clear() {
    const totalObjects = this.pool.length + this.activeObjects.size;

    this.pool.length = 0;
    this.activeObjects.clear();

    Logger.scope('ObjectPool').debug('ObjectPool: Cleared all objects', { totalCleared: totalObjects });
  }

  /**
   * Resize the pool
   * @param {number} newMaxSize - New maximum pool size
   */
  resize(newMaxSize) {
    const oldMaxSize = this.maxSize;
    this.maxSize = Math.max(1, newMaxSize);

    // If reducing size, remove excess objects from pool
    if (this.maxSize < this.pool.length) {
      const excess = this.pool.length - this.maxSize;
      this.pool.splice(this.maxSize, excess);
    }

    Logger.scope('ObjectPool').debug('ObjectPool: Resized', {
      oldMaxSize,
      newMaxSize: this.maxSize,
      currentPoolSize: this.pool.length,
    });
  }

  /**
   * Check if pool is healthy (has objects available)
   * @returns {boolean} True if pool has objects available
   */
  isHealthy() {
    return this.pool.length > 0 || this.activeObjects.size < this.maxSize;
  }

  /**
   * Force cleanup of potentially leaked objects
   * (Use with caution - only if you're sure objects are no longer needed)
   */
  forceCleanup() {
    const leakedCount = this.activeObjects.size;
    this.activeObjects.clear();

    Logger.scope('ObjectPool').warn('ObjectPool: Force cleanup performed', {
      leakedObjects: leakedCount,
      poolSize: this.pool.length,
    });
  }
}

export default ObjectPool;
