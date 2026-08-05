const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const DocumentsRepository = require('../repositories/documents.repository');
const DocumentsService = require('../services/documents.service');
const DocumentsController = require('../controllers/documents.controller');

const router = express.Router();
const storageDir = path.resolve(__dirname, '../../storage');

fs.mkdirSync(storageDir, { recursive: true });

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

const upload = multer({ storage });
const documentsRepository = new DocumentsRepository();
const documentsService = new DocumentsService(documentsRepository);
const documentsController = new DocumentsController(documentsService);

router.post('/upload', upload.single('file'), documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

module.exports = router;