const express = require('express');
const multer = require('multer');
const path = require('path');

const DocumentsRepository = require('../repositories/documents.repository');
const DocumentsService = require('../services/documents.service');
const DocumentsController = require('../controllers/documents.controller');

const storageDir = path.resolve(__dirname, '../../storage');
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const safeExtension = extension || '';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const error = new Error('Tipo de arquivo não permitido.');
      error.statusCode = 400;
      cb(error);
      return;
    }

    cb(null, true);
  },
});

function createDocumentsRouter() {
  const router = express.Router();
  const documentsRepository = new DocumentsRepository();
  const documentsService = new DocumentsService(documentsRepository);
  const documentsController = new DocumentsController(documentsService);

  router.post('/upload', upload.single('file'), documentsController.upload);
  router.get('/documents', documentsController.list);
  router.get('/documents/:id/download', documentsController.download);

  return router;
}

module.exports = createDocumentsRouter;