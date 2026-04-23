import { useState } from 'react'

function Login({ onSignIn = () => {}, onGoToRegister = () => {} }) {
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="form-grid">
      <div>
        <h1 className="card-title">Welcome back</h1>
        <p className="card-sub">Sign in to your health dashboard</p>
      </div>

      <div className="field">
        <label>Email address</label>
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
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />
      </div>

      <button type="button" className="btn-primary" onClick={onSignIn}>
        Sign In →
      </button>

      <div className="divider">or</div>

      <button type="button" className="btn-ghost" onClick={onGoToRegister}>
        Create an account
      </button>
    </div>
  )
}

export default Login
