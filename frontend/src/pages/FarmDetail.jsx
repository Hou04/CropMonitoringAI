import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Sprout, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

export default function FarmDetail() {
    const { id } = useParams();
    const [farm, setFarm] = useState(null);
    const [plots, setPlots] = useState([]);
    const [stats, setStats] = useState({
        totalPlots: 0,
        totalSensors: 0,
        activeAnomalies: 0,
        avgArea: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFarmData();
    }, [id]);

    const fetchFarmData = async () => {
        try {
            const [farmRes, plotsRes, anomaliesRes] = await Promise.all([
                api.get(`farms/${id}/`),
                api.get(`plots/?farm=${id}`),
                api.get('anomalies/')
            ]);

            setFarm(farmRes.data);
            setPlots(plotsRes.data);

            // Calculate stats
            const totalArea = plotsRes.data.reduce((sum, p) => sum + parseFloat(p.area_hectares || 0), 0);
            const farmAnomalies = anomaliesRes.data.filter(a =>
                plotsRes.data.some(p => p.id === a.plot.id)
            );

            setStats({
                totalPlots: plotsRes.data.length,
                totalSensors: plotsRes.data.length * 3,
                activeAnomalies: farmAnomalies.length,
                avgArea: plotsRes.data.length > 0 ? (totalArea / plotsRes.data.length).toFixed(2) : 0
            });
        } catch (error) {
            console.error('Error fetching farm data:', error);
            toast.error('Failed to load farm details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading farm details...</div>;
    if (!farm) return <div className="p-12 text-center text-red-400">Farm not found</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link to="/farms" className="p-2.5 bg-card-dark border border-slate-800 rounded-xl hover:border-blue-500/50 hover:text-blue-400 transition-all text-slate-400">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">{farm.name}</h1>
                    <div className="flex items-center space-x-2 text-slate-400 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{farm.location}</span>
                    </div>
                </div>
            </div>

            {/* Farm Info Card */}
            <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-4">Farm Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Crop Type</p>
                        <div className="flex items-center space-x-2">
                            <Sprout className="w-4 h-4 text-emerald-400" />
                            <p className="text-white font-medium">{farm.crop_type || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Area</p>
                        <p className="text-white font-medium">{farm.total_area_hectares} hectares</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Owner</p>
                        <p className="text-white font-medium">{farm.owner_name || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Plots"
                    value={stats.totalPlots}
                    icon={Activity}
                    color="text-blue-400"
                    bg="bg-blue-400/10"
                />
                <StatCard
                    title="Active Sensors"
                    value={stats.totalSensors}
                    icon={TrendingUp}
                    color="text-emerald-400"
                    bg="bg-emerald-400/10"
                />
                <StatCard
                    title="Active Anomalies"
                    value={stats.activeAnomalies}
                    icon={AlertTriangle}
                    color="text-red-400"
                    bg="bg-red-400/10"
                />
                <StatCard
                    title="Avg Plot Size"
                    value={`${stats.avgArea}ha`}
                    icon={Sprout}
                    color="text-purple-400"
                    bg="bg-purple-400/10"
                />
            </div>

            {/* Plots List */}
            <div className="bg-card-dark rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-lg font-bold text-white">Plots in this Farm</h2>
                    <p className="text-slate-400 text-sm mt-1">{plots.length} plot(s) total</p>
                </div>

                <div className="divide-y divide-slate-800/50">
                    {plots.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <p>No plots found for this farm.</p>
                            <Link
                                to="/plots/new"
                                className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Add First Plot
                            </Link>
                        </div>
                    ) : (
                        plots.map(plot => (
                            <Link
                                key={plot.id}
                                to={`/plots/${plot.id}`}
                                className="p-5 hover:bg-slate-800/30 transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <Sprout className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                            {plot.name}
                                        </h3>
                                        <p className="text-sm text-slate-400 mt-0.5">
                                            {plot.crop_variety} • {plot.area_hectares} hectares
                                        </p>
                                    </div>
                                </div>
                                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-blue-400 rotate-180 transition-colors" />
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg }) {
    return (
        <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{title}</p>
                    <p className="text-2xl font-bold text-white mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${bg}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
        </div>
    );
}
