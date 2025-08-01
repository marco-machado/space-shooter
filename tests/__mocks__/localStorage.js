/**
 * localStorage mock for testing
 * Provides a simple in-memory storage implementation
 */
class LocalStorageMock {
  constructor() {
    this.storage = {};
  }

  getItem(key) {
    return this.storage[key] || null;
  }

  setItem(key, value) {
    this.storage[key] = value.toString();
  }

  removeItem(key) {
    delete this.storage[key];
  }

  clear() {
    this.storage = {};
  }

  get length() {
    return Object.keys(this.storage).length;
  }

  key(index) {
    const keys = Object.keys(this.storage);
    return keys[index] || null;
  }
}

export default LocalStorageMock;