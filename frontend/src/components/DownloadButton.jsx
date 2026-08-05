export default function DownloadButton({ document, onDownload, isDownloading }) {
  async function handleDownload() {
    await onDownload(document);
  }

  return (
    <button type="button" onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
