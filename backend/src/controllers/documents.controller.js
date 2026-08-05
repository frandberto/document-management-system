class DocumentsController {
  constructor(documentsService) {
    this.documentsService = documentsService;
  }

  getRequesterId(req) {
    const requesterId = req.header('x-user-id');
    return requesterId?.trim() || 'anonymous';
  }

  upload = async (req, res, next) => {
    const requesterId = this.getRequesterId(req);
    const ownerFromBody = req.body?.owner?.trim();

    if (ownerFromBody && ownerFromBody !== requesterId) {
      return res.status(403).json({
        message: 'O owner informado difere do usuário autenticado.',
      });
    }

    try {
      const document = this.documentsService.uploadDocument(req.file, requesterId);
      return res.status(201).json(document);
    } catch (error) {
      return next(error);
    }
  };

  list = async (req, res, next) => {
    const requesterId = this.getRequesterId(req);

    try {
      const documents = this.documentsService.listDocuments(requesterId);
      return res.json(documents);
    } catch (error) {
      return next(error);
    }
  };

  download = async (req, res, next) => {
    const { id } = req.params;
    const requesterId = this.getRequesterId(req);

    if (!id) {
      return res.status(400).json({ message: 'ID do documento é obrigatório.' });
    }

    try {
      const { document, filePath } = await this.documentsService.getDocumentForDownload(
        id,
        requesterId,
      );
      return res.download(filePath, document.originalName);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = DocumentsController;