const { validateFileSignature } = require('../../src/utils/MagicBytesValidator');

describe('File Magic Bytes & Extension Security Validation Tests', () => {
  test('rejects disallowed executable extensions (.exe, .sh, .bat)', async () => {
    const buffer = Buffer.from('test string');
    const exeRes = await validateFileSignature(buffer, 'malware.exe');
    expect(exeRes.valid).toBe(false);
    expect(exeRes.reason).toContain('disallowed');

    const shRes = await validateFileSignature(buffer, 'script.sh');
    expect(shRes.valid).toBe(false);

    const batRes = await validateFileSignature(buffer, 'cmd.bat');
    expect(batRes.valid).toBe(false);
  });

  test('rejects binary executable magic bytes even with innocent extension', async () => {
    // Windows MZ Header magic bytes: 0x4D, 0x5A ('MZ')
    const mzBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const res = await validateFileSignature(mzBuffer, 'fake_document.pdf');
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('Executable binary signature detected');
  });

  test('accepts safe text/pdf files with safe extension', async () => {
    const textBuffer = Buffer.from('Ordinary text document content');
    const res = await validateFileSignature(textBuffer, 'report.txt');
    expect(res.valid).toBe(true);
  });
});
