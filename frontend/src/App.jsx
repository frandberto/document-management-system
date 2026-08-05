import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments, uploadDocument } from './services/documentsApi';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);

    try {
      const data = await listDocuments();
      setDocuments(data);
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao carregar documentos.');
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(payload) {
    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await uploadDocument(payload);
      setSuccessMessage('Documento enviado com sucesso.');
      await loadDocuments();
    } catch (error) {
      setErrorMessage(error.message || 'Erro ao enviar documento.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '900px' }}>
      <h1>Document Management System</h1>

      {errorMessage ? (
        <p style={{ color: '#b30000', fontWeight: 600 }}>{errorMessage}</p>
      ) : null}

      {successMessage ? (
        <p style={{ color: '#006b2d', fontWeight: 600 }}>{successMessage}</p>
      ) : null}

      <UploadComponent onUpload={handleUpload} isUploading={isUploading} />

      <hr style={{ margin: '2rem 0' }} />

      <DocumentList documents={documents} isLoading={isLoadingDocuments} />
    </main>
  );
}
