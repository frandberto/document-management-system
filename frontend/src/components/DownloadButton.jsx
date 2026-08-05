import { getDownloadUrl } from '../services/documentsApi';

export default function DownloadButton({ document }) {
  const downloadUrl = getDownloadUrl(document.id);

  function handleDownload() {
    window.location.href = downloadUrl;
  }

  return (
    <button type="button" onClick={handleDownload}>
      Baixar
    </button>
  );
}
