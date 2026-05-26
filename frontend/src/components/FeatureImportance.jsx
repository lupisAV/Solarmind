import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS_REG = ['#F59E0B', '#D97706', '#B45309', '#FBBF24', '#FDE68A', '#FEF3C7', '#FFF7ED', '#FFEDD5']
const COLORS_CLS = ['#22D3EE', '#06B6D4', '#0891B2', '#67E8F9', '#A5F3FC', '#CFFAFE', '#ECFEFF', '#E0F2FE']

export default function FeatureImportance({ regression, classification }) {
  const regData = Object.entries(regression || {}).map(([name, value], i) => ({
    name: name.replace(/_/g, ' '),
    value: parseFloat((value * 100).toFixed(1)),
    color: COLORS_REG[i % COLORS_REG.length],
  }))

  const clsData = Object.entries(classification || {}).map(([name, value], i) => ({
    name: name.replace(/_/g, ' '),
    value: parseFloat((value * 100).toFixed(1)),
    color: COLORS_CLS[i % COLORS_CLS.length],
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <span>{label}: {payload[0].value}%</span>
        </div>
      )
    }
    return null
  }

  return (
    <div className="feature-importance">
      <div className="fi-chart">
        <h3 className="fi-title">
          <span className="metrics-badge reg">Regresión</span>
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={regData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} width={95} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {regData.map((entry, i) => (
                <Cell key={`reg-${i}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="fi-chart">
        <h3 className="fi-title">
          <span className="metrics-badge cls">Clasificación</span>
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={clsData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} width={95} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {clsData.map((entry, i) => (
                <Cell key={`cls-${i}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
