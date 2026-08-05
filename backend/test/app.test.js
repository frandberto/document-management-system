const { test } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');

function createTextFileFormData(content, fileName = 'documento.txt') {
  const formData = new FormData();
  const file = new File([content], fileName, { type: 'text/plain' });
  formData.append('file', file);
  return formData;
}

async function withServer(runTest) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => {
    server.once('listening', resolve);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await runTest(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

test('GET /health retorna status ok', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.deepStrictEqual(data, { status: 'ok' });
  });
});

test('escopo por usuário em listagem e download', async () => {
  await withServer(async (baseUrl) => {
    const uploadAlice = createTextFileFormData('conteudo alice', 'alice.txt');
    uploadAlice.append('owner', 'alice');

    const aliceUploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': 'alice',
      },
      body: uploadAlice,
    });

    assert.strictEqual(aliceUploadResponse.status, 201);
    const aliceDocument = await aliceUploadResponse.json();

    const uploadBob = createTextFileFormData('conteudo bob', 'bob.txt');
    uploadBob.append('owner', 'bob');

    const bobUploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': 'bob',
      },
      body: uploadBob,
    });

    assert.strictEqual(bobUploadResponse.status, 201);

    const aliceListResponse = await fetch(`${baseUrl}/documents`, {
      headers: {
        'x-user-id': 'alice',
      },
    });

    assert.strictEqual(aliceListResponse.status, 200);
    const aliceDocuments = await aliceListResponse.json();
    assert.strictEqual(aliceDocuments.length, 1);
    assert.strictEqual(aliceDocuments[0].owner, 'alice');

    const bobDownloadForbidden = await fetch(`${baseUrl}/documents/${aliceDocument.id}/download`, {
      headers: {
        'x-user-id': 'bob',
      },
    });

    assert.strictEqual(bobDownloadForbidden.status, 403);

    const aliceDownload = await fetch(`${baseUrl}/documents/${aliceDocument.id}/download`, {
      headers: {
        'x-user-id': 'alice',
      },
    });

    assert.strictEqual(aliceDownload.status, 200);
    const content = await aliceDownload.text();
    assert.strictEqual(content, 'conteudo alice');
  });
});

test('upload rejeita owner diferente do usuário autenticado', async () => {
  await withServer(async (baseUrl) => {
    const formData = createTextFileFormData('teste mismatch', 'mismatch.txt');
    formData.append('owner', 'outro-usuario');

    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': 'usuario-logado',
      },
      body: formData,
    });

    assert.strictEqual(response.status, 403);
    const payload = await response.json();
    assert.strictEqual(payload.message, 'O owner informado difere do usuário autenticado.');
  });
});

test('download com id inválido retorna 400', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/documents/nao-e-uuid/download`, {
      headers: {
        'x-user-id': 'alice',
      },
    });

    assert.strictEqual(response.status, 400);
    const payload = await response.json();
    assert.strictEqual(payload.message, 'ID do documento inválido.');
  });
});

test('upload rejeita tipo de arquivo não permitido', async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    const file = new File(['conteudo html'], 'pagina.html', { type: 'text/html' });
    formData.append('file', file);
    formData.append('owner', 'alice');

    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': 'alice',
      },
      body: formData,
    });

    assert.strictEqual(response.status, 400);
    const payload = await response.json();
    assert.strictEqual(payload.message, 'Tipo de arquivo não permitido.');
  });
});

test('upload acima do limite retorna 413', async () => {
  await withServer(async (baseUrl) => {
    const oversizedContent = 'a'.repeat(10 * 1024 * 1024 + 1);
    const formData = createTextFileFormData(oversizedContent, 'grande.txt');
    formData.append('owner', 'alice');

    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'x-user-id': 'alice',
      },
      body: formData,
    });

    assert.strictEqual(response.status, 413);
    const payload = await response.json();
    assert.strictEqual(payload.message, 'Arquivo excede o limite de 10 MB.');
  });
});
