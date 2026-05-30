import { lazy, Suspense, useState, useCallback, useEffect } from 'react'
import SolarPulse from './components/SolarPulse'
import StepIndicator from './components/StepIndicator'
import DatasetUpload from './components/DatasetUpload'

const RawDataPreview = lazy(() => import('./components/RawDataPreview'))
const CleaningStats = lazy(() => import('./components/CleaningStats'))
const MetricsDashboard = lazy(() => import('./components/MetricsDashboard'))
const FeatureImportance = lazy(() => import('./components/FeatureImportance'))
const TreeVisualizer = lazy(() => import('./components/TreeVisualizer'))

const API_BASE = '/api'

const STEPS = [
  { id: 'idle', label: 'Listo', icon: '○' },
  { id: 'loading', label: 'Cargando datos', icon: '◉' },
  { id: 'cleaning', label: 'Limpiando dataset', icon: '◎' },
  { id: 'training', label: 'Entrenando modelos', icon: '◉' },
  { id: 'results', label: 'Resultados', icon: '●' },
]

function getStepIndex(stepId) {
  return STEPS.findIndex(s => s.id === stepId)
}

async function fetchJson(url, options) {
  const res = await fetch(url, options)
  let data = null

  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || `Solicitud fallida (${res.status})`)
  }

  return data
}

export default function App() {
  const [currentStep, setCurrentStep] = useState('idle')
  const [rawData, setRawData] = useState(null)
  const [cleaningStats, setCleaningStats] = useState(null)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null)
  const [datasetLoaded, setDatasetLoaded] = useState(false)
  const [datasetInfo, setDatasetInfo] = useState(null)

  const checkStatus = useCallback(async () => {
    try {
      const data = await fetchJson(`${API_BASE}/status`)
      setStatus(data)
    } catch {
      setStatus({ status: 'offline' })
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const handleDatasetReady = useCallback((info) => {
    setDatasetInfo(info)
    setDatasetLoaded(true)
    setCurrentStep('idle')
    setRawData(null)
    setCleaningStats(null)
    setResults(null)
    setError(null)
  }, [])

  const loadRawData = useCallback(async () => {
    try {
      const data = await fetchJson(`${API_BASE}/data/raw?page=1&per_page=100`)
      setRawData(data)
      return data
    } catch (err) {
      setError(err.message || 'Error cargando datos crudos')
      return null
    }
  }, [])

  const handleGoHome = useCallback(() => {
    setDatasetLoaded(false)
    setDatasetInfo(null)
    setCurrentStep('idle')
    setRawData(null)
    setCleaningStats(null)
    setResults(null)
    setError(null)
  }, [])

  const runSimulation = useCallback(async () => {
    setError(null)
    setCurrentStep('loading')

    await new Promise(r => setTimeout(r, 400))
    const raw = await loadRawData()
    if (!raw) return

    setCurrentStep('cleaning')
    try {
      const stats = await fetchJson(`${API_BASE}/data/stats`)
      setCleaningStats(stats)
    } catch (err) {
      setError(err.message || 'Error obteniendo estadísticas de limpieza')
      return
    }

    await new Promise(r => setTimeout(r, 600))
    setCurrentStep('training')

    try {
      const simData = await fetchJson(`${API_BASE}/simulate/run`, { method: 'POST' })
      setResults(simData)
    } catch (err) {
      setError(err.message || 'Error ejecutando simulación')
      return
    }

    await new Promise(r => setTimeout(r, 500))
    setCurrentStep('results')
  }, [loadRawData])

  const stepIndex = getStepIndex(currentStep)

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <SolarPulse size={32} active={currentStep !== 'idle'} />
          <div>
            <h1 className="header-title">Solarmind<span className="header-title-accent">Analytics</span></h1>
            <p className="header-subtitle">Minería de datos de radiación solar</p>
          </div>
        </div>
        <div className="header-status">
          <span className={`status-dot ${status?.status === 'online' ? 'online' : ''}`} />
          <span className="status-text">
            {status ? `${status.status}` : 'verificando...'}
          </span>
        </div>
      </header>

      <div className="simulation-controls">
        <div className="controls-buttons">
          <button
            className="btn-primary"
            onClick={runSimulation}
            disabled={!datasetLoaded || currentStep === 'loading' || currentStep === 'cleaning' || currentStep === 'training'}
          >
            <span className="btn-icon">&#9654;</span>
            {currentStep === 'idle' ? 'Iniciar Análisis' : 'Reiniciar Análisis'}
          </button>
          {results && (
            <button className="btn-home" onClick={handleGoHome}>
              <svg className="btn-icon-svg" viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M3 8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 18V10h4v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Nuevo Dataset
            </button>
          )}
        </div>
        <StepIndicator steps={STEPS} currentIndex={stepIndex} />
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}

      <main className="main-content">
        {!datasetLoaded && (
          <DatasetUpload onDatasetReady={handleDatasetReady} />
        )}

        {datasetLoaded && currentStep === 'idle' && (
          <div className="dataset-status-bar">
            <svg className="ds-icon" viewBox="0 0 20 20" fill="none" width="18" height="18">
              <rect x="3" y="1" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 7h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M7 10h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M7 13h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <div className="ds-info">
              <span className="ds-filename">{datasetInfo?.filename}</span>
              <span className="ds-meta">
                {datasetInfo?.rows?.toLocaleString()} filas &middot; {datasetInfo?.columns?.length} columnas
              </span>
            </div>
            <span className="ds-badge">
              {datasetInfo?.generated ? 'Dataset de ejemplo' : 'Listo para analizar'}
            </span>
          </div>
        )}

        <Suspense fallback={<div className="loading-panel">Cargando vista...</div>}>
          {currentStep !== 'idle' && rawData && (
            <section className="section">
              <h2 className="section-title">
                <span className="section-number">01</span>
                Dataset Crudo
              </h2>
              <RawDataPreview data={rawData} />
            </section>
          )}

          {cleaningStats && currentStep !== 'idle' && (
            <section className="section">
              <h2 className="section-title">
                <span className="section-number">02</span>
                Estadísticas de Limpieza
              </h2>
              <CleaningStats stats={cleaningStats} />
            </section>
          )}

          {results && (
            <>
              <section className="section">
                <h2 className="section-title">
                  <span className="section-number">03</span>
                  Métricas de Modelos
                </h2>
                <MetricsDashboard metrics={{
                  regression: results.regression.metrics,
                  classification: results.classification.metrics,
                }} />
              </section>

              <section className="section">
                <h2 className="section-title">
                  <span className="section-number">04</span>
                  Importancia de Features
                </h2>
                <FeatureImportance
                  regression={results.regression.feature_importance}
                  classification={results.classification.feature_importance}
                />
              </section>

              <section className="section">
                <h2 className="section-title">
                  <span className="section-number">05</span>
                  Árboles de Decisión
                </h2>
                <div className="tree-grid">
                  <div className="tree-card">
                    <h3 className="tree-card-title">Regresión</h3>
                    <TreeVisualizer
                      treeJson={results.regression.tree_json}
                      treeText={results.regression.tree_text}
                      type="regression"
                    />
                  </div>
                  <div className="tree-card">
                    <h3 className="tree-card-title">Clasificación</h3>
                    <TreeVisualizer
                      treeJson={results.classification.tree_json}
                      treeText={results.classification.tree_text}
                      type="classification"
                      classNames={results.classification.metrics.classes}
                    />
                  </div>
                </div>
              </section>

              <div className="results-footer">
                <button className="btn-home btn-home-large" onClick={handleGoHome}>
                  <svg className="btn-icon-svg" viewBox="0 0 20 20" fill="none" width="16" height="16">
                    <path d="M3 8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 18V10h4v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Cargar otro dataset
                </button>
              </div>
            </>
          )}
        </Suspense>
      </main>

      <footer className="app-footer">
        <span>Solarmind Analytics &copy; 2025</span>
        <span>Proyecto Final - Minería de Datos</span>
      </footer>
    </div>
  )
}
