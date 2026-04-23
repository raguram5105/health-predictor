function Dashboard({ registrationData, onGoToLogin = () => {} }) {
  const parseHeightToMeters = (heightInput) => {
    if (!heightInput) return null

    const normalized = String(heightInput).toLowerCase().trim()
    const numeric = Number.parseFloat(normalized.replace(/[^0-9.]/g, ''))

    if (!Number.isFinite(numeric) || numeric <= 0) return null

    if (normalized.includes('m') && !normalized.includes('cm')) {
      return numeric
    }

    if (numeric <= 3) {
      return numeric
    }

    return numeric / 100
  }

  const parseWeightToKg = (weightInput) => {
    if (!weightInput) return null

    const numeric = Number.parseFloat(String(weightInput).replace(/[^0-9.]/g, ''))

    if (!Number.isFinite(numeric) || numeric <= 0) return null

    return numeric
  }
  const heightMeters = parseHeightToMeters(registrationData?.height)
  const weightKg = parseWeightToKg(registrationData?.weight)
  const bmi =
    heightMeters && weightKg ? (weightKg / (heightMeters * heightMeters)).toFixed(1) : null

  const fields = [
    { label: 'Name', value: registrationData?.name },
    { label: 'Height', value: registrationData?.height },
    { label: 'Weight', value: registrationData?.weight },
    { label: 'Smoking', value: registrationData?.smokingStatus },
    { label: 'Activity', value: registrationData?.physicalActivity },
    { label: 'BMI', value: bmi },
  ]

  return (
    <>
      <div className="dash-header">
        <h1 className="card-title">Your Profile</h1>
        <div className="dash-badge">
          <span />
          Active &amp; Registered
        </div>
      </div>

      <div className="dash-grid">
        {fields.map((field) => (
          <div className="dash-item" key={field.label}>
            <div className="dash-item-label">{field.label}</div>
            <div className="dash-item-value">{field.value || '-'}</div>
          </div>
        ))}
      </div>

      <button type="button" className="btn-secondary" onClick={onGoToLogin}>
        Sign Out
      </button>
    </>
  )
}

export default Dashboard
