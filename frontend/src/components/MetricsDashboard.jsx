import React from 'react'

export default function MetricsDashboard({ metrics }) {
  const { regression, classification } = metrics

  return (
    <div className="metrics-dashboard">
      <div className="metrics-group">
        <h3 className="metrics-group-title">
          <span className="metrics-badge reg">Regresión</span>
        </h3>
        <div className="metrics-cards">
          <MetricCard label="R² Score" value={regression.r2} format="decimal" />
          <MetricCard label="MAE" value={regression.mae} format="number" suffix=" W/m²" />
          <MetricCard label="RMSE" value={regression.rmse} format="number" suffix=" W/m²" />
          <MetricCard label="Muestras train" value={regression.samples_train} format="int" />
          <MetricCard label="Muestras test" value={regression.samples_test} format="int" />
        </div>
      </div>

      <div className="metrics-group">
        <h3 className="metrics-group-title">
          <span className="metrics-badge cls">Clasificación</span>
        </h3>
        <div className="metrics-cards">
          <MetricCard label="Accuracy" value={classification.accuracy} format="percent" />
          <MetricCard label="Precision (macro)" value={classification.precision_macro} format="decimal" />
          <MetricCard label="Recall (macro)" value={classification.recall_macro} format="decimal" />
          <MetricCard label="F1 Score (macro)" value={classification.f1_macro} format="decimal" />
          <MetricCard label="Muestras train" value={classification.samples_train} format="int" />
          <MetricCard label="Muestras test" value={classification.samples_test} format="int" />
        </div>
      </div>

      {classification.confusion_matrix && (
        <div className="confusion-matrix-section">
          <h3 className="metrics-group-title">Matriz de Confusión</h3>
          <ConfusionMatrix
            matrix={classification.confusion_matrix}
            labels={classification.classes || ['Baja', 'Media', 'Alta', 'Muy Alta']}
          />
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, format, suffix = '' }) {
  let display = value
  if (format === 'percent') display = (value * 100).toFixed(1) + '%'
  else if (format === 'decimal') display = Number(value).toFixed(4)
  else if (format === 'int') display = parseInt(value).toLocaleString()
  else if (format === 'number') display = Number(value).toFixed(2)

  return (
    <div className="metric-card">
      <span className="metric-value">{display}{suffix}</span>
      <span className="metric-label">{label}</span>
    </div>
  )
}

function ConfusionMatrix({ matrix, labels }) {
  const maxVal = Math.max(...matrix.flat())

  return (
    <div className="confusion-matrix">
      <div className="cm-grid" style={{ gridTemplateColumns: `80px repeat(${labels.length}, 1fr)` }}>
        <div className="cm-cell cm-header" />
        {labels.map(l => <div key={`h-${l}`} className="cm-cell cm-header cm-col-label">{l}</div>)}

        {matrix.map((row, i) => (
          <React.Fragment key={`row-${i}`}>
            <div className="cm-cell cm-header cm-row-label">{labels[i]}</div>
            {row.map((val, j) => {
              const intensity = maxVal > 0 ? val / maxVal : 0
              const isDiagonal = i === j
              return (
                <div
                  key={`${i}-${j}`}
                  className={`cm-cell ${isDiagonal ? 'cm-diagonal' : ''}`}
                  style={{
                    backgroundColor: `rgba(245, 158, 11, ${intensity * 0.6})`,
                    color: intensity > 0.5 ? '#0A0E1A' : 'var(--text-primary)',
                  }}
                >
                  {val}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

