const API_PREFIX = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);

  if (!response.ok) {
    let message = 'Erro ao processar a requisição.';

    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      }
    } catch {
      message = 'Erro ao processar a requisição.';
    }

    throw new Error(message);
  }

  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  return response.json();
}

export async function uploadDocument({ file, owner }) {
  const formData = new FormData();
  formData.append('file', file);

  if (owner) {
    formData.append('owner', owner);
  }

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export function getDownloadUrl(documentId) {
  return `${API_PREFIX}/documents/${documentId}/download`;
}
