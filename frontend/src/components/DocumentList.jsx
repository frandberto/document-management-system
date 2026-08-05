import DownloadButton from './DownloadButton';

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return 'N/A';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export default function DocumentList({ documents, isLoading }) {
  return (
    <section>
      <h2>Documentos</h2>

      {isLoading ? <p>Carregando documentos...</p> : null}

      {!isLoading && documents.length === 0 ? (
        <p>Nenhum documento enviado até o momento.</p>
      ) : null}

      {documents.length > 0 ? (
        <ul style={{ display: 'grid', gap: '0.75rem', padding: 0, listStyle: 'none' }}>
          {documents.map((document) => (
            <li
              key={document.id}
              style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '0.9rem' }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>{document.originalName}</p>
              <p style={{ margin: '0.35rem 0' }}>
                Tamanho: {formatSize(document.size)} | Dono: {document.owner || 'anonymous'}
              </p>
              <DownloadButton document={document} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
