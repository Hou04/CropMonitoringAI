import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    AlertTriangle,
    CheckCircle,
    BrainCircuit,
    ChevronDown,
    ChevronUp,
    Download
} from 'lucide-react';

export default function Alerts() {
    const [anomalies, setAnomalies] = useState([]);
    const [recommendations, setRecommendations] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [anomaliesRes, recommendationsRes] = await Promise.all([
                api.get('anomalies/'),
                api.get('recommendations/')
            ]);

            setAnomalies(anomaliesRes.data);

            const recMap = {};
            recommendationsRes.data.forEach(rec => {
                if (rec.anomaly && rec.anomaly.id) {
                    recMap[rec.anomaly.id] = rec;
                }
            });
            setRecommendations(recMap);

        } catch (error) {
            console.error("Error fetching alerts:", error);
            toast.error('Failed to load alerts');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleResolve = async (e, anomalyId) => {
        e.stopPropagation(); // Prevent row expansion when clicking button
        try {
            await api.patch(`anomalies/${anomalyId}/`, { resolved: true });
            toast.success('Anomaly marked as resolved');
            // Refresh data after resolving
            await fetchData();
        } catch (err) {
            console.error('Error resolving anomaly', err);
            toast.error('Failed to resolve anomaly');
        }
    };

    const exportCSV = () => {
        if (anomalies.length === 0) {
            toast.error('No anomalies to export');
            return;
        }

        const headers = ['ID', 'Type', 'Severity', 'Plot', 'Timestamp', 'Confidence', 'Resolved'];
        const rows = anomalies.map(a => [
            a.id,
            a.anomaly_type,
            a.severity,
            a.plot?.name || `ID #${a.plot?.id}`,
            new Date(a.timestamp).toISOString(),
            (a.confidence * 100).toFixed(0) + '%',
            a.resolved ? 'Yes' : 'No'
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `anomalies_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(`Exported ${anomalies.length} anomalies`);
    };

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading alerts...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">System Alerts</h1>
                    <p className="text-slate-400 mt-1">AI-detected anomalies and recommendations</p>
                </div>
                <button
                    onClick={exportCSV}
                    disabled={anomalies.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                </button>
            </div>

            <div className="space-y-4">
                {anomalies.length === 0 ? (
                    <div className="bg-card-dark p-16 rounded-2xl text-center border border-slate-800 shadow-xl">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-glow-green">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">All Systems Operational</h3>
                        <p className="text-slate-500">No anomalies detected at this time.</p>
                    </div>
                ) : (
                    anomalies.map(anomaly => {
                        const rec = recommendations[anomaly.id];
                        const isExpanded = expandedId === anomaly.id;

                        return (
                            <div
                                key={anomaly.id}
                                className={`bg-card-dark rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-500/50 shadow-glow-blue ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                            >
                                {/* Card Header / Summary Row */}
                                <div
                                    className="p-5 cursor-pointer flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                                    onClick={() => toggleExpand(anomaly.id)}
                                >
                                    <div className="flex items-center space-x-5">
                                        <div className={`p-3.5 rounded-xl ${getSeverityStyles(anomaly.severity)}`}>
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-3">
                                                <h3 className="font-bold text-white text-lg">{anomaly.anomaly_type.replace('_', ' ')}</h3>
                                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                                                    {new Date(anomaly.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1">
                                                Plot: <span className="font-medium text-slate-300">{anomaly.plot?.name || `ID #${anomaly.plot?.id}`}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        <div className="text-right hidden md:block">
                                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Confidence</p>
                                            <p className="font-bold text-blue-400 text-lg">{Math.round(anomaly.confidence * 100)}%</p>
                                        </div>

                                        {!anomaly.resolved && (
                                            <button
                                                onClick={(e) => handleResolve(e, anomaly.id)}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs transition-colors"
                                            >
                                                Mark Resolved
                                            </button>
                                        )}

                                        <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-slate-800 bg-slate-900/30 p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                            {/* Left Column: Tech Details */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Technical Details</h4>
                                                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 text-sm">
                                                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                                        <span className="text-slate-500">Severity</span>
                                                        <span className={`font-bold ${getSeverityTextColor(anomaly.severity)}`}>{anomaly.severity}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                                        <span className="text-slate-500">Sensor Type</span>
                                                        <span className="font-medium text-white">{anomaly.details?.sensor_type || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                                        <span className="text-slate-500">Trigger Value</span>
                                                        <span className="font-medium text-white">{anomaly.details?.trigger_value || 'N/A'}</span>
                                                    </div>
                                                    {anomaly.details?.z_score && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Z-Score</span>
                                                            <span className="font-medium text-blue-400">{anomaly.details.z_score}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Column: AI Analysis */}
                                            <div>
                                                <div className="flex items-center mb-4 space-x-2">
                                                    <BrainCircuit className="w-5 h-5 text-purple-400" />
                                                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Agent Analysis</h4>
                                                </div>
                                                {rec ? (
                                                    <div className="bg-purple-500/5 border border-purple-500/20 p-5 rounded-xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-12 bg-purple-500/10 blur-[40px] rounded-full translate-x-4 -translate-y-4 pointer-events-none" />
                                                        <p className="font-bold text-purple-200 mb-3 text-lg">Recommendation</p>
                                                        <p className="text-sm text-purple-300/80 leading-relaxed">{rec.message}</p>
                                                        <div className="mt-4 pt-4 border-t border-purple-500/20 grid grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <span className="text-purple-500">Priority:</span>
                                                                <span className="ml-2 font-bold text-purple-300">{rec.priority}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-purple-500">Confidence:</span>
                                                                <span className="ml-2 font-bold text-purple-300">{rec.confidence_level || 'N/A'}</span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <span className="text-purple-500">Generated:</span>
                                                                <span className="ml-2 font-mono text-purple-400">{new Date(rec.created_at).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-800/50 border border-slate-800 p-5 rounded-xl text-slate-500 text-sm italic flex items-center justify-center h-32">
                                                        Waiting for agent analysis...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// Helper Functions
function getSeverityStyles(severity) {
    switch (severity) {
        case 'HIGH': return 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-glow-red';
        case 'MEDIUM': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
        case 'LOW': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
        default: return 'bg-slate-800 text-slate-400';
    }
}

function getSeverityTextColor(severity) {
    switch (severity) {
        case 'HIGH': return 'text-red-400';
        case 'MEDIUM': return 'text-orange-400';
        case 'LOW': return 'text-yellow-400';
        default: return 'text-slate-400';
    }
}