const LocalStorageAdapter = require('./LocalStorageAdapter');
const S3StorageAdapter = require('./S3StorageAdapter');
const logger = require('../config/Logger');

class StorageFactory {
  constructor() {
    this.instances = new Map();
  }

  getStorageAdapter(driverOverride = null) {
    if (!process.env.STORAGE_DRIVER) {
      require('dotenv').config();
    }
    const driver = (driverOverride || process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();

    if (this.instances.has(driver)) {
      return this.instances.get(driver);
    }

    let adapter;
    if (driver === 's3') {
      adapter = new S3StorageAdapter();
      logger.info({ driver, bucket: process.env.AWS_S3_BUCKET, region: process.env.AWS_REGION }, 'StorageFactory: Initialized S3StorageAdapter');
    } else {
      adapter = new LocalStorageAdapter();
      logger.info({ driver }, 'StorageFactory: Initialized LocalStorageAdapter');
    }

    this.instances.set(driver, adapter);
    return adapter;
  }

  reset() {
    this.instances.clear();
  }
}

const factory = new StorageFactory();
module.exports = factory;
