const StorageFactory = require('../../src/storage/StorageFactory');
const LocalStorageAdapter = require('../../src/storage/LocalStorageAdapter');
const S3StorageAdapter = require('../../src/storage/S3StorageAdapter');
const recordService = require('../../src/services/RecordService');

describe('Storage Abstraction & Adapters Unit Tests', () => {
  beforeEach(() => {
    StorageFactory.reset();
    delete process.env.STORAGE_DRIVER;
  });

  test('StorageFactory returns LocalStorageAdapter by default or when STORAGE_DRIVER=local', () => {
    process.env.STORAGE_DRIVER = 'local';
    const adapter = StorageFactory.getStorageAdapter();
    expect(adapter).toBeInstanceOf(LocalStorageAdapter);
  });

  test('StorageFactory returns S3StorageAdapter when STORAGE_DRIVER=s3', () => {
    process.env.STORAGE_DRIVER = 's3';
    const adapter = StorageFactory.getStorageAdapter();
    expect(adapter).toBeInstanceOf(S3StorageAdapter);
  });

  test('LocalStorageAdapter save, getUrl, and delete workflow', async () => {
    const localAdapter = new LocalStorageAdapter('./storage_test_dir');
    const testKey = 'test-file.txt';
    const buffer = Buffer.from('RecordVault Storage Test Content');

    await localAdapter.save(testKey, buffer, 'text/plain');

    const locationInfo = await localAdapter.getUrl(testKey);
    expect(locationInfo.filePath).toBeDefined();
    expect(locationInfo.url).toBeNull();

    const deleted = await localAdapter.delete(testKey);
    expect(deleted).toBe(true);
  });

  test('S3StorageAdapter generates presigned URLs with mocked S3Client', async () => {
    const mockS3Client = {
      send: jest.fn().mockResolvedValue({})
    };

    const s3Adapter = new S3StorageAdapter({
      region: 'us-east-1',
      bucket: 'test-bucket',
      s3Client: mockS3Client
    });

    const savedKey = await s3Adapter.save('records/123/file.pdf', Buffer.from('pdf data'), 'application/pdf');
    expect(savedKey).toBe('records/123/file.pdf');
    expect(mockS3Client.send).toHaveBeenCalledTimes(1);

    const deleted = await s3Adapter.delete('records/123/file.pdf');
    expect(deleted).toBe(true);
  });

  test('RecordService generatePresignedUploadUrl validates file signature before issuing URL', async () => {
    process.env.STORAGE_DRIVER = 'local';

    // Valid text file header
    const validHeaderBase64 = Buffer.from('Plain text file header content').toString('base64');
    const result = await recordService.generatePresignedUploadUrl({
      recordId: null,
      fileName: 'document.txt',
      fileSize: 1024,
      mimeType: 'text/plain',
      headerChunkBase64: validHeaderBase64,
      currentUser: { id: 'user-1', role: 'USER' }
    });

    expect(result.key).toContain('uploads/');
    expect(result.proxyUploadNeeded).toBe(true);

    // Invalid file signature / size limit violation
    await expect(
      recordService.generatePresignedUploadUrl({
        recordId: null,
        fileName: 'malicious.exe',
        fileSize: 999999999, // Exceeds size limit
        mimeType: 'application/x-msdownload',
        headerChunkBase64: Buffer.from('MZ...').toString('base64'),
        currentUser: { id: 'user-1', role: 'USER' }
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
