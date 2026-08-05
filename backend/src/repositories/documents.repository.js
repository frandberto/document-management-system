const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

class DocumentsRepository {
  constructor() {
    this.documents = [];
  }

  create({ originalName, storedName, mimeType, size, owner }) {
    const document = {
      id: randomUUID(),
      originalName,
      storedName,
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

  getStorageFilePath(storedName) {
    return path.resolve(__dirname, '../../storage', storedName);
  }

  fileExists(storedName) {
    const filePath = this.getStorageFilePath(storedName);
    return fs.existsSync(filePath);
  }
}

module.exports = DocumentsRepository;