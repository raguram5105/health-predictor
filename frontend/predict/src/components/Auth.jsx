import React, { useState } from 'react';
import { Activity, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import './Auth.css';

export default function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed.');
            }

            onLogin(data.user);
        } catch (err) {
            setError(err.message || 'Unable to connect to the backend.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        if (error) setError('');
    };

    const switchMode = (loginMode) => {
        setIsLogin(loginMode);
        setError('');
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel animate-fade-in">
                <div className="auth-header">
                    <div className="logo-container">
                        <Activity size={40} className="logo-icon" />
                    </div>
                    <h1 className="text-gradient hover-trigger">VitalSense AI</h1>
                    <p>Continuous Health Monitoring</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${isLogin ? 'active' : ''}`}
                        onClick={() => switchMode(true)}
                        type="button"
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${!isLogin ? 'active' : ''}`}
                        onClick={() => switchMode(false)}
                        type="button"
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="input-group animate-fade-in">
                            <label>Full Name</label>
                            <div className="input-wrapper">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={isLogin ? undefined : 8}
                                required
                            />
                        </div>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div className="auth-footer">
                    <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
            </div>
        </div>
    );
}
