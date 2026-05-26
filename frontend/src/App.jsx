import { useState, useCallback } from 'react'
import SolarPulse from './components/SolarPulse'
import StepIndicator from './components/StepIndicator'
import RawDataPreview from './components/RawDataPreview'
import CleaningStats from './components/CleaningStats'
import MetricsDashboard from './components/MetricsDashboard'
import FeatureImportance from './components/FeatureImportance'
import TreeVisualizer from './components/TreeVisualizer'

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

export default function App() {
  const [currentStep, setCurrentStep] = useState('idle')
  const [rawData, setRawData] = useState(null)
  const [cleaningStats, setCleaningStats] = useState(null)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/status`)
      const data = await res.json()
      setStatus(data)
    } catch {
      setStatus({ status: 'offline' })
    }
  }, [])

  const loadRawData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/data/raw?page=1&per_page=15`)
      const data = await res.json()
      setRawData(data)
      return data
    } catch (err) {
      setError('Error cargando datos crudos')
      return null
    }
  }, [])

  const runSimulation = useCallback(async () => {
    setError(null)
    setCurrentStep('loading')

    await new Promise(r => setTimeout(r, 400))
    const raw = await loadRawData()
    if (!raw) return

    setCurrentStep('cleaning')
    try {
      const statsRes = await fetch(`${API_BASE}/data/stats`)
      const stats = await statsRes.json()
      setCleaningStats(stats)
    } catch {
      setError('Error obteniendo estadísticas de limpieza')
      return
    }

    await new Promise(r => setTimeout(r, 600))
    setCurrentStep('training')

    try {
      const simRes = await fetch(`${API_BASE}/simulate/run`, { method: 'POST' })
      const simData = await simRes.json()
      setResults(simData)
    } catch {
      setError('Error ejecutando simulación')
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
        <button
          className="btn-primary"
          onClick={runSimulation}
          disabled={currentStep === 'loading' || currentStep === 'cleaning' || currentStep === 'training'}
        >
          <span className="btn-icon">&#9654;</span>
          {currentStep === 'idle' ? 'Iniciar Simulación' : 'Reiniciar Simulación'}
        </button>
        <StepIndicator steps={STEPS} currentIndex={stepIndex} />
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}

      <main className="main-content">
        {currentStep === 'idle' && (
          <div className="welcome-screen">
            <SolarPulse size={120} active={true} />
            <h2>Solarmind Analytics</h2>
            <p>
              Pipeline completo de minería de datos: limpieza de dataset de radiación solar
              y aplicación de árboles de decisión para regresión y clasificación.
            </p>
            <ul className="welcome-features">
              <li><span className="bullet">&#9679;</span> 5,500+ registros con errores inyectados</li>
              <li><span className="bullet">&#9679;</span> Limpieza automática (NaN, outliers, duplicados, cadenas)</li>
              <li><span className="bullet">&#9679;</span> Árbol de decisión: regresión y clasificación</li>
              <li><span className="bullet">&#9679;</span> Métricas, importancia de features y visualización del árbol</li>
            </ul>
          </div>
        )}

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
                    type="regression"
                  />
                </div>
                <div className="tree-card">
                  <h3 className="tree-card-title">Clasificación</h3>
                  <TreeVisualizer
                    treeJson={results.classification.tree_json}
                    type="classification"
                    classNames={results.classification.metrics.classes}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        <span>Solarmind Analytics &copy; 2025</span>
        <span>Proyecto Final — Minería de Datos</span>
      </footer>
    </div>
  )
}
