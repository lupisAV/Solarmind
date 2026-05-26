import { useMemo } from 'react'

export default function RawDataPreview({ data }) {
  const { data: rows, columns, total, nulls_per_column } = data

  const numericCols = useMemo(() =>
    columns.filter(c => !['fecha', 'hora'].includes(c)),
  [columns])

  function isError(value) {
    if (value === null || value === undefined || value === '') return true
    if (typeof value === 'string' && isNaN(Number(value))) return true
    return false
  }

  function cellClass(col, value) {
    if (isError(value)) return 'cell-error'
    if (typeof value === 'number' && (value > 5000 || value < -500)) return 'cell-outlier'
    return ''
  }

  return (
    <div className="data-preview-wrapper">
      <div className="data-preview-header">
        <span className="data-count">
          <strong>{total.toLocaleString()}</strong> registros totales
        </span>
        <span className="data-errors">
          Errores detectados en {Object.values(nulls_per_column || {}).reduce((a, b) => a + b, 0)} celdas
        </span>
      </div>

      <div className="data-preview-legend">
        <span className="legend-item"><span className="legend-swatch error" /> NaN / String inválido</span>
        <span className="legend-item"><span className="legend-swatch outlier" /> Outlier detectado</span>
        <span className="legend-item"><span className="legend-swatch clean" /> Dato limpio</span>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th className="th-index">#</th>
              {numericCols.map(col => (
                <th key={col}>{col.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="td-index">{i + 1}</td>
                {numericCols.map(col => (
                  <td key={col} className={cellClass(col, row[col])}>
                    {row[col] === null || row[col] === undefined
                      ? <span className="nil-value">NULL</span>
                      : row[col] === ''
                        ? <span className="nil-value">VACIO</span>
                        : String(row[col])
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
