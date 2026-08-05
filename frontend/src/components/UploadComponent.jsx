import { useState } from 'react';

export default function UploadComponent({ onUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [owner, setOwner] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile || isUploading) {
      return;
    }

    await onUpload({ file: selectedFile, owner });
    setSelectedFile(null);
    setOwner('');
    event.target.reset();
  }

  return (
    <section>
      <h2>Upload de documento</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '420px' }}>
          <label htmlFor="owner">Responsável (opcional)</label>
          <input
            id="owner"
            type="text"
            name="owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Ex.: ana.silva"
            disabled={isUploading}
          />

          <label htmlFor="file">Arquivo</label>
          <input
            id="file"
            type="file"
            name="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            disabled={isUploading}
            required
          />

          <button type="submit" disabled={!selectedFile || isUploading}>
            {isUploading ? 'Enviando...' : 'Enviar documento'}
          </button>
        </div>
      </form>
    </section>
  );
}
