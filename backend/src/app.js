// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const createDocumentsRouter = require('./routes/documents.routes');

const PORT = process.env.PORT || 3000;
function createApp() {
  const app = express();

  app.use(express.json());
  app.use(createDocumentsRouter());

  // Endpoint de verificação de saúde.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ message: 'Arquivo excede o limite de 10 MB.' });
        return;
      }

      res.status(400).json({ message: error.message || 'Erro ao processar upload.' });
      return;
    }

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message || 'Erro interno do servidor.',
    });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
