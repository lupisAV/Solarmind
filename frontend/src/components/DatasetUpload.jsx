import { useState, useRef, useCallback } from 'react'

const API_BASE = '/api'

export default function DatasetUpload({ onDatasetReady }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [datasetInfo, setDatasetInfo] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const uploadFile = useCallback(async (file) => {
    if (!file.name.endsWith('.csv')) {
      setError('Solo se aceptan archivos CSV (.csv)')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/dataset/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setUploading(false)
        return
      }

      setDatasetInfo(data)
      onDatasetReady(data)
    } catch {
      setError('Error al subir el archivo. Verifica la conexión con el servidor.')
    } finally {
      setUploading(false)
    }
  }, [onDatasetReady])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }, [uploadFile])

  const handleGenerate = useCallback(async () => {
    setError(null)
    setGenerating(true)

    try {
      const res = await fetch(`${API_BASE}/dataset/generate`)

      const rowsHeader = res.headers.get('X-Dataset-Rows')
      const colsHeader = res.headers.get('X-Dataset-Columns')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'solar_radiation_dataset.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      if (rowsHeader && colsHeader) {
        const info = {
          filename: 'solar_radiation_dataset.csv',
          rows: parseInt(rowsHeader, 10),
          columns: colsHeader.split(','),
          size_bytes: blob.size,
          generated: true,
        }
        setDatasetInfo(info)
        onDatasetReady(info)
      }
    } catch {
      setError('Error al generar el dataset. Verifica la conexión con el servidor.')
    } finally {
      setGenerating(false)
    }
  }, [onDatasetReady])

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="dataset-upload">
      <div className="dataset-upload-header">
        <h2>Cargar Dataset</h2>
        <p>
          Arrastra un archivo CSV o genera uno de ejemplo para comenzar el análisis
          de radiación solar.
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}

      {!datasetInfo ? (
        <>
          <div
            className={`drop-zone${dragOver ? ' active' : ''}${uploading ? ' uploading' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="file-input-hidden"
              onChange={handleFileSelect}
            />

            {uploading ? (
              <div className="upload-state">
                <div className="upload-spinner" />
                <span>Subiendo dataset...</span>
              </div>
            ) : (
              <div className="upload-state">
                <svg className="upload-icon" viewBox="0 0 48 48" fill="none" width="48" height="48">
                  <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M18 20l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M24 14v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M10 34h28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="drop-zone-text">
                  Arrastra un archivo <strong>CSV</strong> aquí
                </span>
                <span className="drop-zone-hint">o haz clic para seleccionarlo</span>
              </div>
            )}
          </div>

          <div className="generate-section">
            <span className="generate-divider-text">o</span>
            <button
              className={`btn-secondary${generating ? ' loading' : ''}`}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="btn-spinner" />
                  Generando...
                </>
              ) : (
                <>
                  <svg className="btn-icon-svg" viewBox="0 0 20 20" fill="none" width="16" height="16">
                    <path d="M10 2v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Generar dataset de ejemplo
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="dataset-ready">
          <div className="dataset-ready-card">
            <div className="dataset-ready-icon">
              <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 12l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="dataset-ready-info">
              <span className="dataset-ready-filename">{datasetInfo.filename}</span>
              <span className="dataset-ready-meta">
                {datasetInfo.rows.toLocaleString()} filas &middot; {datasetInfo.columns.length} columnas
                {datasetInfo.size_bytes ? ` · ${formatSize(datasetInfo.size_bytes)}` : ''}
              </span>
            </div>
            <button
              className="btn-ghost"
              onClick={() => {
                setDatasetInfo(null)
                setError(null)
              }}
            >
              Cambiar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
