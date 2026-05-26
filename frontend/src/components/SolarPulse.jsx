export default function SolarPulse({ size = 48, active = false }) {
  const rings = [
    { delay: 0, opacity: 0.6, scale: 1 },
    { delay: 0.8, opacity: 0.4, scale: 1.2 },
    { delay: 1.6, opacity: 0.2, scale: 1.5 },
  ]

  return (
    <div
      className="solar-pulse"
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="solar-pulse-core"
        style={{
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #FDE68A 0%, #F59E0B 60%, #D97706 100%)',
          boxShadow: active
            ? '0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.2)'
            : '0 0 10px rgba(245, 158, 11, 0.3)',
          zIndex: 2,
          transition: 'box-shadow 0.6s ease',
        }}
      />

      {rings.map((ring, i) => (
        <div
          key={i}
          className={`solar-pulse-ring ${active ? 'ring-active' : ''}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `1.5px solid rgba(245, 158, 11, ${ring.opacity})`,
            animationDelay: `${ring.delay}s`,
            transform: `scale(${ring.scale})`,
            opacity: active ? 1 : 0,
          }}
        />
      ))}
    </div>
  )
}
