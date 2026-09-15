const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const StorageAdapter = require('./StorageAdapter');

class S3StorageAdapter extends StorageAdapter {
  constructor(config = {}) {
    super();
    this.region = config.region || process.env.AWS_REGION || 'us-east-1';
    this.bucket = config.bucket || process.env.AWS_S3_BUCKET || 'recordvault-storage-bucket';

    const clientConfig = { region: this.region };
    const accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = { accessKeyId, secretAccessKey };
    }

    this.s3Client = config.s3Client || new S3Client(clientConfig);
  }

  async save(key, buffer, mimeType) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType
    });
    await this.s3Client.send(command);
    return key;
  }

  async getPresignedUploadUrl(key, mimeType, options = {}) {
    const expiresIn = options.expiresIn || 900; // 15 mins default
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType
    });
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    return { uploadUrl, key };
  }

  async getUrl(key, options = {}) {
    const expiresIn = options.expiresIn || 300; // 5 mins default
    const commandInput = {
      Bucket: this.bucket,
      Key: key
    };

    if (options.disposition) {
      commandInput.ResponseContentDisposition = options.disposition;
    }
    if (options.contentType) {
      commandInput.ResponseContentType = options.contentType;
    }

    const command = new GetObjectCommand(commandInput);
    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    return { url, filePath: null };
  }

  async delete(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = S3StorageAdapter;
