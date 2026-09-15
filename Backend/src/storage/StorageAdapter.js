/**
 * StorageAdapter interface contract.
 */
class StorageAdapter {
  /**
   * Save a file buffer.
   * @param {string} key - Unique storage key
   * @param {Buffer} buffer - File data
   * @param {string} mimeType - Mime type
   * @returns {Promise<string>} Storage key
   */
  async save(key, buffer, mimeType) {
    throw new Error('Method not implemented.');
  }

  /**
   * Get URL or file path location for reading/downloading.
   * @param {string} key - Unique storage key
   * @param {object} [options] - Options (e.g. expiresIn, fileName, disposition)
   * @returns {Promise<{ url?: string, filePath?: string }>}
   */
  async getUrl(key, options = {}) {
    throw new Error('Method not implemented.');
  }

  /**
   * Get presigned upload URL for direct client-to-storage upload.
   * Returns null if driver does not use presigned client uploads.
   * @param {string} key - Unique storage key
   * @param {string} mimeType - Mime type
   * @param {object} [options] - Options (e.g. expiresIn)
   * @returns {Promise<{ uploadUrl: string, key: string } | null>}
   */
  async getPresignedUploadUrl(key, mimeType, options = {}) {
    throw new Error('Method not implemented.');
  }

  /**
   * Delete file by key.
   * @param {string} key - Unique storage key
   * @returns {Promise<boolean>}
   */
  async delete(key) {
    throw new Error('Method not implemented.');
  }
}

module.exports = StorageAdapter;
