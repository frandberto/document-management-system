const API_PREFIX = '/api';
let currentUserId = 'anonymous';

function normalizeUserId(userId) {
  return userId?.trim() || 'anonymous';
}

export function setCurrentUserId(userId) {
  currentUserId = normalizeUserId(userId);
}

export function getCurrentUserId() {
  return currentUserId;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('x-user-id')) {
    headers.set('x-user-id', currentUserId);
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers,
  });

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
  const normalizedOwner = normalizeUserId(owner);
  setCurrentUserId(normalizedOwner);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('owner', normalizedOwner);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export function getDownloadUrl(documentId) {
  return `${API_PREFIX}/documents/${documentId}/download`;
}

function getFilenameFromContentDisposition(contentDispositionHeader, fallbackName) {
  const fileNameMatch = contentDispositionHeader?.match(/filename="?([^";]+)"?/i);
  return fileNameMatch?.[1] || fallbackName;
}

export async function downloadDocument(documentId, fallbackName = 'documento') {
  const response = await request(`/documents/${documentId}/download`);
  const blob = await response.blob();

  const fileName = getFilenameFromContentDisposition(
    response.headers.get('content-disposition'),
    fallbackName,
  );

  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(objectUrl);
}
