class DocumentsService {
  constructor(documentsRepository) {
    this.documentsRepository = documentsRepository;
  }

  uploadDocument(file, owner) {
    if (!file) {
      const error = new Error('Arquivo não enviado.');
      error.statusCode = 400;
      throw error;
    }

    return this.documentsRepository.create({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      owner,
    });
  }

  listDocuments() {
    return this.documentsRepository.findAll();
  }

  getDocumentForDownload(id) {
    const document = this.documentsRepository.findById(id);

    if (!document) {
      const error = new Error('Documento não encontrado.');
      error.statusCode = 404;
      throw error;
    }

    if (!this.documentsRepository.fileExists(document.storedName)) {
      const error = new Error('Arquivo do documento não está disponível.');
      error.statusCode = 404;
      throw error;
    }

    return {
      document,
      filePath: this.documentsRepository.getStorageFilePath(document.storedName),
    };
  }
}

module.exports = DocumentsService;