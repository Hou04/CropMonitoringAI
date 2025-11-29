import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Activity,
    Droplets,
    Thermometer,
    Wind,
    AlertTriangle,
    CheckCircle,
    Leaf,
    ArrowUpRight,
    RefreshCw
} from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalFarms: 0,
        totalPlots: 0,
        activeAlerts: 0,
        sensorCount: 0
    });
    const [recentAnomalies, setRecentAnomalies] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDashboardData = async (showToast = false) => {
        try {
            setIsRefreshing(true);
            const [farmsRes, plotsRes, anomaliesRes, recsRes] = await Promise.all([
                api.get('farms/'),
                api.get('plots/'),
                api.get('anomalies/'),
                api.get('recommendations/')
            ]);

            setStats({
                totalFarms: farmsRes.data.length,
                totalPlots: plotsRes.data.length,
                activeAlerts: anomaliesRes.data.length,
                sensorCount: plotsRes.data.length * 3
            });

            setRecentAnomalies(anomaliesRes.data.slice(0, 5));
            setRecommendations(recsRes.data.slice(0, 3));
            setLastUpdated(new Date());

            if (showToast) {
                toast.success('Dashboard updated');
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchDashboardData(false);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-32 bg-card-dark rounded-xl border border-slate-800"></div>
            <div className="h-64 bg-card-dark rounded-xl border border-slate-800"></div>
        </div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
                    <p className="text-slate-400 mt-1">Real-time monitoring of your agricultural assets</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => fetchDashboardData(true)}
                        disabled={isRefreshing}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh data"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={async () => {
                            const minutes = prompt('Enter minutes to process (default 60):') || 60;
                            try {
                                const res = await api.post('run-batch/', { minutes });
                                toast.success(`Batch started! Job ID: ${res.data.job_id}`);
                            } catch (err) {
                                toast.error('Failed to start batch: ' + (err.response?.data?.error || err.message));
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Run Batch ML
                    </button>
                    <div className="text-sm text-slate-500 font-mono">
                        Last updated: <span className="text-blue-400">{getTimeAgo(lastUpdated)}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Farms"
                    value={stats.totalFarms}
                    icon={Leaf}
                    color="text-emerald-400"
                    bg="bg-emerald-400/10"
                    border="border-emerald-400/20"
                />
                <StatCard
                    title="Active Plots"
                    value={stats.totalPlots}
                    icon={Activity}
                    color="text-blue-400"
                    bg="bg-blue-400/10"
                    border="border-blue-400/20"
                />
                <StatCard
                    title="Active Alerts"
                    value={stats.activeAlerts}
                    icon={AlertTriangle}
                    color="text-red-400"
                    bg="bg-red-400/10"
                    border="border-red-400/20"
                />
                <StatCard
                    title="Active Sensors"
                    value={stats.sensorCount}
                    icon={Wind}
                    color="text-purple-400"
                    bg="bg-purple-400/10"
                    border="border-purple-400/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Insights Section */}
                <div className="bg-card-dark rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-8 bg-purple-500 rounded-full shadow-glow-purple"></div>
                            <h2 className="text-lg font-bold text-white">AI Insights</h2>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                        {recommendations.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <p>No recommendations available.</p>
                            </div>
                        ) : (
                            recommendations.map((rec) => (
                                <div key={rec.id} className="p-5 hover:bg-slate-800/30 transition-colors">
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <Leaf className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white mb-1">Recommendation</h3>
                                            <p className="text-slate-300 text-sm leading-relaxed">{rec.message}</p>
                                            <div className="mt-2 flex items-center space-x-2 text-xs text-slate-500">
                                                <span>{new Date(rec.created_at).toLocaleString()}</span>
                                                <span>•</span>
                                                <span className="text-purple-400 font-medium">{rec.priority} Priority</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Alerts Section */}
                <div className="bg-card-dark rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-8 bg-blue-500 rounded-full shadow-glow-blue"></div>
                            <h2 className="text-lg font-bold text-white">Recent Anomalies</h2>
                        </div>
                        <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center transition-colors">
                            View All <ArrowUpRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                        {recentAnomalies.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-white font-medium mb-1">All Systems Operational</h3>
                                <p>No anomalies detected at this time.</p>
                            </div>
                        ) : (
                            recentAnomalies.map((anomaly) => (
                                <div key={anomaly.id} className="p-5 hover:bg-slate-800/30 transition-colors flex items-start space-x-4 group">
                                    <div className={`p-3 rounded-xl ${getSeverityStyles(anomaly.severity)}`}>
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                {anomaly.anomaly_type.replace('_', ' ')}
                                            </h3>
                                            <span className="text-xs font-mono text-slate-500">
                                                {new Date(anomaly.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Detected in plot <span className="text-slate-300 font-medium">{anomaly.plot.name || `Plot #${anomaly.plot.id}`}</span>
                                        </p>
                                        <div className="mt-3 flex items-center space-x-3">
                                            <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${anomaly.confidence * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-blue-400">
                                                {Math.round(anomaly.confidence * 100)}% Confidence
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg, border }) {
    return (
        <div className={`bg-card-dark p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 group relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 p-20 ${bg} blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full translate-x-10 -translate-y-10 pointer-events-none`} />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-white mt-2 tracking-tight">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${bg} ${color} border ${border} shadow-lg`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

function getSeverityStyles(severity) {
    switch (severity) {
        case 'HIGH': return 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-glow-red';
        case 'MEDIUM': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
        case 'LOW': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
        default: return 'bg-slate-800 text-slate-400';
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 30) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}
