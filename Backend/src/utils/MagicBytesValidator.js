const path = require('path');
const FileType = require('file-type');

const DISALLOWED_EXTENSIONS = new Set([
  '.exe', '.bat', '.sh', '.cmd', '.com', '.msi', '.dll', '.scr',
  '.vbs', '.js', '.jse', '.jar', '.ps1', '.vb', '.cpl', '.hta',
  '.ins', '.isp', '.pif', '.reg', '.wsf', '.wsh', '.php', '.py', '.pl'
]);

/**
 * Validates a file by extension and magic byte signature.
 * @param {Buffer} buffer File buffer
 * @param {string} originalFilename Original file name
 * @returns {Promise<{ valid: boolean, mime: string, ext: string, reason?: string }>}
 */
async function validateFileSignature(buffer, originalFilename) {
  const ext = path.extname(originalFilename).toLowerCase();
  
  if (DISALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      mime: '',
      ext,
      reason: `File extension '${ext}' is disallowed for security reasons.`
    };
  }

  // Check magic bytes using file-type
  let detectedType;
  try {
    detectedType = await FileType.fromBuffer(buffer);
  } catch (err) {
    // Error parsing magic bytes
  }

  // Check executable signatures directly from buffer header
  if (buffer && buffer.length >= 4) {
    // 'MZ' for Windows Executable
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return { valid: false, mime: 'application/x-msdownload', ext, reason: 'Executable binary signature detected (MZ).' };
    }
    // ELF header '\x7fELF' for Linux Executables
    if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
      return { valid: false, mime: 'application/x-executable', ext, reason: 'Executable binary signature detected (ELF).' };
    }
    // Mach-O header for macOS Executables
    if ((buffer[0] === 0xfe && buffer[1] === 0xed && buffer[2] === 0xfa && buffer[3] === 0xce) ||
        (buffer[0] === 0xcf && buffer[1] === 0xfa && buffer[2] === 0xed && buffer[3] === 0xfe)) {
      return { valid: false, mime: 'application/x-mach-binary', ext, reason: 'Executable binary signature detected (Mach-O).' };
    }
    // Shell script '#!'
    if (buffer[0] === 0x23 && buffer[1] === 0x21) {
      return { valid: false, mime: 'text/x-shellscript', ext, reason: 'Shell script signature detected (#!).' };
    }
  }

  const detectedMime = detectedType ? detectedType.mime : 'application/octet-stream';
  const detectedExt = detectedType ? `.${detectedType.ext}` : ext;

  return {
    valid: true,
    mime: detectedMime,
    ext: detectedExt
  };
}

module.exports = {
  validateFileSignature,
  DISALLOWED_EXTENSIONS
};
