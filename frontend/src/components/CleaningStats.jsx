export default function CleaningStats({ stats }) {
  const items = [
    { label: 'Registros originales', value: stats.original_rows.toLocaleString(), color: '--solar-gold' },
    { label: 'Registros limpios', value: stats.cleaned_rows.toLocaleString(), color: '--sky-cyan' },
    { label: 'Valores nulos imputados', value: stats.nulls_found, color: '--text-warning' },
    { label: 'Outliers corregidos', value: stats.outliers_fixed, color: '--text-warning' },
    { label: 'Duplicados eliminados', value: stats.duplicates_removed, color: '--text-danger' },
    { label: 'Columnas procesadas', value: stats.original_cols, color: '--text-secondary' },
  ]

  const cleanedPercent = ((stats.cleaned_rows / stats.original_rows) * 100).toFixed(1)

  return (
    <div className="cleaning-stats">
      <div className="cleaning-hero">
        <div className="cleaning-circle">
          <svg viewBox="0 0 120 120" className="cleaning-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="var(--sky-cyan)"
              strokeWidth="8"
              strokeDasharray={`${cleanedPercent * 3.267} 327`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className="cleaning-circle-progress"
            />
          </svg>
          <div className="cleaning-circle-text">
            <span className="cleaning-percent">{cleanedPercent}%</span>
            <span className="cleaning-label">datos conservados</span>
          </div>
        </div>
      </div>

      <div className="cleaning-metrics-grid">
        {items.map(item => (
          <div key={item.label} className="cleaning-metric-card">
            <span className="cleaning-metric-value" style={{ color: `var(${item.color})` }}>
              {item.value}
            </span>
            <span className="cleaning-metric-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
