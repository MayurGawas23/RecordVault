const fs = require('fs').promises;
const path = require('path');
const StorageAdapter = require('./StorageAdapter');

class LocalStorageAdapter extends StorageAdapter {
  constructor(storageDir = process.env.STORAGE_DIR || './storage') {
    super();
    this.storageDir = path.resolve(storageDir);
    this._ensureDir();
  }

  async _ensureDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch {
      // Directory exists or permission handled
    }
  }

  async save(key, buffer, mimeType) {
    await this._ensureDir();
    const filePath = path.join(this.storageDir, key);
    const parentDir = path.dirname(filePath);
    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    return key;
  }

  async get(key) {
    const filePath = path.join(this.storageDir, key);
    return await fs.readFile(filePath);
  }

  async getUrl(key, options = {}) {
    const filePath = path.join(this.storageDir, key);
    try {
      await fs.access(filePath);
      return { filePath, url: null };
    } catch {
      throw new Error('File not found in storage');
    }
  }

  async getStream(key) {
    const filePath = path.join(this.storageDir, key);
    return require('fs').createReadStream(filePath);
  }

  async getPresignedUploadUrl(key, mimeType, options = {}) {
    // Local storage does not use presigned client upload URLs
    return null;
  }

  async getFilePath(key) {
    const { filePath } = await this.getUrl(key);
    return filePath;
  }

  async delete(key) {
    const filePath = path.join(this.storageDir, key);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = LocalStorageAdapter;
