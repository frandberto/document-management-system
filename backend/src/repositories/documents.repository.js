const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const STORAGE_DIR = path.resolve(__dirname, '../../storage');
const STORED_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

class DocumentsRepository {
  constructor() {
    this.documents = [];
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  create({ originalName, storedName, mimeType, size, owner }) {
    const safeStoredName = this.validateStoredName(storedName);
    const document = {
      id: randomUUID(),
      originalName: path.basename(originalName || 'document'),
      storedName: safeStoredName,
      mimeType,
      size,
      owner,
      uploadedAt: new Date().toISOString(),
    };

    this.documents.push(document);
    return document;
  }

  findAll() {
    return [...this.documents];
  }

  findById(id) {
    return this.documents.find((document) => document.id === id) || null;
  }

  findAllByOwner(owner) {
    return this.documents.filter((document) => document.owner === owner);
  }

  validateStoredName(storedName) {
    if (typeof storedName !== 'string' || !STORED_NAME_PATTERN.test(storedName)) {
      const error = new Error('Nome de arquivo inválido no storage.');
      error.statusCode = 400;
      throw error;
    }

    return storedName;
  }

  getStorageFilePath(storedName) {
    const safeStoredName = this.validateStoredName(storedName);
    const filePath = path.resolve(STORAGE_DIR, safeStoredName);

    if (!filePath.startsWith(`${STORAGE_DIR}${path.sep}`)) {
      const error = new Error('Caminho de arquivo inválido.');
      error.statusCode = 400;
      throw error;
    }

    return filePath;
  }

  async fileExists(storedName) {
    const filePath = this.getStorageFilePath(storedName);

    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = DocumentsRepository;