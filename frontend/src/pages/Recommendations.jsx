import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BrainCircuit, Filter, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Recommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    // Filters
    const [selectedPlot, setSelectedPlot] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [sortBy, setSortBy] = useState('date');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [recsRes, plotsRes] = await Promise.all([
                api.get('recommendations/'),
                api.get('plots/')
            ]);
            setRecommendations(recsRes.data);
            setPlots(plotsRes.data);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            toast.error('Failed to load recommendations');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Filter and sort recommendations
    const filteredRecs = recommendations
        .filter(rec => !selectedPlot || (rec.anomaly?.plot?.id === parseInt(selectedPlot)))
        .filter(rec => !selectedPriority || rec.priority === selectedPriority)
        .sort((a, b) => {
            if (sortBy === 'date') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'priority') {
                const priority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                return (priority[b.priority] || 0) - (priority[a.priority] || 0);
            }
            if (sortBy === 'confidence') {
                const confidence = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                return (confidence[b.confidence_level] || 0) - (confidence[a.confidence_level] || 0);
            }
            return 0;
        });

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading recommendations...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">AI Recommendations</h1>
                <p className="text-slate-400 mt-1">Agent-generated insights and action items</p>
            </div>

            {/* Filters */}
            <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center space-x-2 mb-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <h2 className="font-semibold text-white">Filters & Sorting</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Plot Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            Filter by Plot
                        </label>
                        <select
                            value={selectedPlot}
                            onChange={(e) => setSelectedPlot(e.target.value)}
                            className="w-full bg-void border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">All Plots</option>
                            {plots.map(plot => (
                                <option key={plot.id} value={plot.id}>{plot.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            Filter by Priority
                        </label>
                        <select
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value)}
                            className="w-full bg-void border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">All Priorities</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-void border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="date">Date (Newest)</option>
                            <option value="priority">Priority</option>
                            <option value="confidence">Confidence</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4 text-sm text-slate-500">
                    Showing <span className="text-white font-medium">{filteredRecs.length}</span> of <span className="text-white font-medium">{recommendations.length}</span> recommendations
                </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
                {filteredRecs.length === 0 ? (
                    <div className="bg-card-dark p-16 rounded-2xl text-center border border-slate-800 shadow-xl">
                        <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                            <BrainCircuit className="w-10 h-10 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Recommendations</h3>
                        <p className="text-slate-500">No AI recommendations match your filters.</p>
                    </div>
                ) : (
                    filteredRecs.map(rec => {
                        const isExpanded = expandedId === rec.id;
                        return (
                            <div
                                key={rec.id}
                                className={`bg-card-dark rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-purple-500/50 shadow-glow-purple ring-1 ring-purple-500/20' : 'border-slate-800 hover:border-slate-700'}`}
                            >
                                {/* Card Header */}
                                <div
                                    className="p-5 cursor-pointer flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                                    onClick={() => toggleExpand(rec.id)}
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                            <BrainCircuit className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="font-bold text-white text-lg">Recommendation #{rec.id}</h3>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getPriorityStyles(rec.priority)}`}>
                                                    {rec.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                                                {rec.message}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="text-right hidden md:block">
                                            <p className="text-xs text-slate-500 font-mono">
                                                {new Date(rec.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-slate-800 bg-slate-900/30 p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left: Message */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Full Message</h4>
                                                <p className="text-slate-300 leading-relaxed">{rec.message}</p>

                                                {rec.anomaly?.plot && (
                                                    <Link
                                                        to={`/plots/${rec.anomaly.plot.id}`}
                                                        className="mt-4 inline-flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                                    >
                                                        View Related Plot <ExternalLink className="w-4 h-4 ml-1" />
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Right: Metadata */}
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Metadata</h4>
                                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-sm">
                                                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                                        <span className="text-slate-500">Priority</span>
                                                        <span className={`font-bold ${getPriorityTextColor(rec.priority)}`}>
                                                            {rec.priority}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                                        <span className="text-slate-500">Confidence</span>
                                                        <span className="font-medium text-white">{rec.confidence_level || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                                        <span className="text-slate-500">Created</span>
                                                        <span className="font-medium text-white">{new Date(rec.created_at).toLocaleString()}</span>
                                                    </div>
                                                    {rec.anomaly && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Related Anomaly</span>
                                                            <span className="font-medium text-blue-400">#{rec.anomaly.id}</span>
                                                        </div>
                                                    )}
                                                </div>
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

function getPriorityStyles(priority) {
    switch (priority) {
        case 'HIGH': return 'bg-red-500/10 text-red-400 border border-red-500/20';
        case 'MEDIUM': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
        case 'LOW': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
}

function getPriorityTextColor(priority) {
    switch (priority) {
        case 'HIGH': return 'text-red-400';
        case 'MEDIUM': return 'text-orange-400';
        case 'LOW': return 'text-blue-400';
        default: return 'text-slate-400';
    }
}
