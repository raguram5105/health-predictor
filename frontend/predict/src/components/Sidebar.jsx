import React from 'react';
import { Activity, LayoutDashboard, ClipboardList, Stethoscope, LogOut } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ currentView, setCurrentView, onLogout }) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'survey', label: 'Health Survey', icon: ClipboardList },
        { id: 'prediction', label: 'Disease Prediction', icon: Stethoscope },
    ];

    return (
        <aside className="sidebar glass-panel">
            <div className="sidebar-header">
                <div className="logo-container-small">
                    <Activity size={24} className="logo-icon" />
                </div>
                <h2>VitalSense</h2>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                            onClick={() => setCurrentView(item.id)}
                        >
                            <Icon size={20} className="nav-icon" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item text-danger" onClick={onLogout}>
                    <LogOut size={20} className="nav-icon" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
