import { useState } from 'react'

function Register({ onCreateAccount = () => {}, onGoToLogin = () => {} }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    smokingStatus: '',
    physicalActivity: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = () => {
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    const { confirmPassword: _, ...registrationData } = form
    onCreateAccount(registrationData)
  }

  return (
    <div className="form-grid">
      <div>
        <h1 className="card-title">Create account</h1>
        <p className="card-sub">Your personal health profile</p>
      </div>

      <div className="field">
        <label>Full name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Jane Doe"
          required
        />
      </div>

      <div className="two-col">
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="field">
          <label>Phone number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            placeholder="+1 555 000 0000"
            required
          />
        </div>
      </div>

      <div className="two-col">
        <div className="field">
          <label>Age</label>
          <input
            type="number"
            name="age"
            min="1"
            value={form.age}
            onChange={handleChange}
            placeholder="25"
            required
          />
        </div>
        <div className="field">
          <label>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} required>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="two-col">
        <div className="field">
          <label>Height</label>
          <input
            type="text"
            name="height"
            value={form.height}
            onChange={handleChange}
            placeholder="e.g. 170 cm"
            required
          />
        </div>
        <div className="field">
          <label>Weight</label>
          <input
            type="text"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            placeholder="e.g. 70 kg"
            required
          />
        </div>
      </div>

      <div className="two-col">
        <div className="field">
          <label>Smoking status</label>
          <select name="smokingStatus" value={form.smokingStatus} onChange={handleChange} required>
            <option value="">Select…</option>
            <option value="non-smoker">Non-smoker</option>
            <option value="smoker">Smoker</option>
            <option value="former-smoker">Former smoker</option>
          </select>
        </div>
        <div className="field">
          <label>Physical activity</label>
          <select name="physicalActivity" value={form.physicalActivity} onChange={handleChange} required>
            <option value="">Select…</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="two-col">
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min. 8 characters"
            required
          />
        </div>
        <div className="field">
          <label>Confirm password</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat password"
            required
          />
        </div>
      </div>

      {error && <div className="error-msg">⚠ {error}</div>}

      <button type="button" className="btn-primary" onClick={handleSubmit}>
        Create Account →
      </button>

      <div className="divider">or</div>

      <button type="button" className="btn-ghost" onClick={onGoToLogin}>
        Already have an account? Sign in
      </button>
    </div>
  )
}

export default Register
