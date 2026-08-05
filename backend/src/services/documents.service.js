class DocumentsService {
  constructor(documentsRepository) {
    this.documentsRepository = documentsRepository;
  }

  static UUID_V4_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
      owner: owner || 'anonymous',
    });
  }

  listDocuments(owner) {
    return this.documentsRepository.findAllByOwner(owner || 'anonymous');
  }

  async getDocumentForDownload(id, requesterId) {
    if (!DocumentsService.UUID_V4_PATTERN.test(id)) {
      const error = new Error('ID do documento inválido.');
      error.statusCode = 400;
      throw error;
    }

    const document = this.documentsRepository.findById(id);

    if (!document) {
      const error = new Error('Documento não encontrado.');
      error.statusCode = 404;
      throw error;
    }

    if (document.owner !== (requesterId || 'anonymous')) {
      const error = new Error('Acesso negado a este documento.');
      error.statusCode = 403;
      throw error;
    }

    if (!(await this.documentsRepository.fileExists(document.storedName))) {
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