import React, { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { Activity, HeartPulse, Thermometer, Wind } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import './Dashboard.css';

const POLL_INTERVAL_MS = 3000;
const STALE_AFTER_MS = 15000;

const formatTime = (date = new Date()) =>
    date.toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

const displayValue = (value) => (
    value === null || value === undefined || value === '' ? 'null' : value
);

const latestNumber = (value) => {
    if (!Array.isArray(value)) {
        return value ?? null;
    }

    for (let index = value.length - 1; index >= 0; index -= 1) {
        const number = Number(value[index]);

        if (Number.isFinite(number)) {
            return number;
        }
    }

    return null;
};

const emptyReading = () => ({
    time: formatTime(),
    ageSeconds: null,
    heartRate: null,
    temperature: null,
    spo2: null,
    ecg: null
});

const normalizeSensorReading = (reading) => {
    if (!reading || Object.keys(reading).length === 0) return null;

    const createdAt = reading.createdAt ? new Date(reading.createdAt) : new Date();
    const ageMs = Date.now() - createdAt.getTime();
    const isStale = ageMs > STALE_AFTER_MS;

    if (isStale) {
        return emptyReading();
    }

    const ecg = latestNumber(reading.ecg ?? reading.ecg_raw);

    return {
        time: formatTime(createdAt),
        ageSeconds: Math.max(0, Math.round(ageMs / 1000)),
        heartRate: reading.heart_rate ?? reading.heartRate ?? null,
        temperature: reading.temperature ?? null,
        spo2: reading.spo2 ?? null,
        ecg: ecg ?? null
    };
};

const StatCard = ({ title, value, unit, icon: Icon, color, status }) => (
    <div className="stat-card glass-panel animate-fade-in">
        <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}20`, color }}>
                <Icon size={24} />
            </div>
            <div className="stat-trend positive">{status}</div>
        </div>
        <div className="stat-body">
            <h3>{title}</h3>
            <div className="stat-value-container">
                <span className="stat-value">{displayValue(value)}</span>
                <span className="stat-unit">{unit}</span>
            </div>
        </div>
    </div>
);

export default function Dashboard() {
    const [data, setData] = useState([]);
    const [status, setStatus] = useState('Waiting for hardware data...');

    useEffect(() => {
        const fetchSensorData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/sensor/latest`);

                if (!response.ok) {
                    throw new Error(`Sensor request failed with status ${response.status}`);
                }

                const reading = normalizeSensorReading(await response.json());

                if (!reading) {
                    setStatus('No IoT input');
                    setData((prevData) => [...prevData.slice(-19), emptyReading()]);
                    return;
                }

                const hasLiveValues = Object.values({
                    heartRate: reading.heartRate,
                    temperature: reading.temperature,
                    spo2: reading.spo2,
                    ecg: reading.ecg
                }).some((value) => value !== null && value !== undefined);

                setStatus(hasLiveValues ? `Live (${reading.ageSeconds}s ago)` : 'No IoT input');
                setData((prevData) => {
                    const previous = prevData[prevData.length - 1];

                    if (previous?.time === reading.time) {
                        return prevData;
                    }

                    return [...prevData.slice(-19), reading];
                });
            } catch (error) {
                console.error('Error fetching sensor data:', error);
                setStatus('Backend offline');
            }
        };

        fetchSensorData();
        const interval = setInterval(fetchSensorData, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    const latestData = data[data.length - 1] || {};

    return (
        <div className="dashboard-container">
            <div className="stats-grid">
                <StatCard title="Heart Rate" value={latestData.heartRate} unit="bpm" icon={HeartPulse} color="var(--accent)" status={status} />
                <StatCard title="ECG" value={latestData.ecg} unit="raw" icon={Activity} color="var(--primary)" status={status} />
                <StatCard title="Oxygen (SpO2)" value={latestData.spo2} unit="%" icon={Wind} color="var(--info)" status={status} />
                <StatCard title="Temperature" value={latestData.temperature} unit="C" icon={Thermometer} color="var(--success)" status={status} />
            </div>

            <div className="charts-grid mt-4">
                <div className="chart-card glass-panel">
                    <div className="chart-header">
                        <h3>ECG / Heart Rate Monitor</h3>
                        <span className="live-indicator"><span className="dot"></span> {status}</span>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                                <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border-highlight)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Line type="monotone" dataKey="heartRate" stroke="var(--accent)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'var(--accent)', stroke: '#fff' }} isAnimationActive={false} />
                                <Line type="monotone" dataKey="ecg" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-panel">
                    <div className="chart-header">
                        <h3>Oxygen and Temperature Trend</h3>
                    </div>
                    <div className="chart-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <defs>
                                    <linearGradient id="colorSensor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card-hover)', borderColor: 'var(--border-highlight)', borderRadius: '8px' }}
                                />
                                <Area type="monotone" dataKey="spo2" stroke="var(--info)" fillOpacity={1} fill="url(#colorSensor)" strokeWidth={2} isAnimationActive={false} />
                                <Area type="monotone" dataKey="temperature" stroke="var(--success)" fillOpacity={0.35} fill="url(#colorSensor)" strokeWidth={2} isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
