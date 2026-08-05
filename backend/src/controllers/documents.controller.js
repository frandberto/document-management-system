class DocumentsController {
  constructor(documentsService) {
    this.documentsService = documentsService;
  }

  upload = (req, res) => {
    try {
      const owner = req.body?.owner || req.header('x-user-id') || 'anonymous';
      const document = this.documentsService.uploadDocument(req.file, owner);
      return res.status(201).json(document);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message: error.message || 'Erro interno ao fazer upload.',
      });
    }
  };

  list = (req, res) => {
    try {
      const documents = this.documentsService.listDocuments();
      return res.json(documents);
    } catch {
      return res.status(500).json({
        message: 'Erro interno ao listar documentos.',
      });
    }
  };

  download = (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'ID do documento é obrigatório.' });
      }

      const { document, filePath } = this.documentsService.getDocumentForDownload(id);
      return res.download(filePath, document.originalName);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        message: error.message || 'Erro interno ao baixar documento.',
      });
    }
  };
}

module.exports = DocumentsController;