export default function StepIndicator({ steps, currentIndex }) {
  return (
    <div className="step-indicator">
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={`step-item ${i < currentIndex ? 'done' : ''} ${i === currentIndex ? 'active' : ''}`}
        >
          <div className="step-circle">
            {i < currentIndex ? (
              <span className="step-check">&#10003;</span>
            ) : (
              <span className="step-icon">{step.icon}</span>
            )}
          </div>
          <span className="step-label">{step.label}</span>
          {i < steps.length - 1 && (
            <div className={`step-line ${i < currentIndex ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
