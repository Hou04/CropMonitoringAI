import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Sprout, MapPin, Ruler, ArrowRight, Plus } from 'lucide-react';

export default function PlotList() {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('farms/');
                const farmsData = response.data;
                const plotsResponse = await api.get('plots/');
                const plots = plotsResponse.data;

                const farmsWithPlots = farmsData.map(farm => ({
                    ...farm,
                    plots: plots.filter(plot => plot.farm.id === farm.id)
                }));

                setFarms(farmsWithPlots);
            } catch (error) {
                console.error("Error fetching farms:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-12 text-center text-slate-500 animate-pulse">Loading agricultural data...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Farms & Plots</h1>
                    <p className="text-slate-400 mt-1">Manage your agricultural zones and sensors</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/farms/new')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl transition-all flex items-center font-medium"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Add Farm
                    </button>
                    <button
                        onClick={() => navigate('/plots/new')}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-glow-blue flex items-center font-medium"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Add Plot
                    </button>
                </div>
            </div>

            {farms.map((farm) => (
                <div key={farm.id} className="bg-card-dark rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="bg-slate-900/50 p-6 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <Sprout className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{farm.name}</h2>
                                <div className="flex items-center text-sm text-slate-500 mt-1">
                                    <MapPin className="w-4 h-4 mr-1 text-slate-600" />
                                    {farm.location}
                                </div>
                            </div>
                        </div>
                        <span className="px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold text-slate-300 uppercase tracking-wide">
                            {farm.crop_type || 'Mixed Crops'}
                        </span>
                    </div>

                    <div className="p-6">
                        <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            Active Plots
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {farm.plots && farm.plots.length > 0 ? (
                                farm.plots.map((plot) => (
                                    <Link
                                        key={plot.id}
                                        to={`/plots/${plot.id}`}
                                        className="group block p-5 bg-void border border-slate-800 rounded-xl hover:border-blue-500/50 hover:shadow-glow-blue transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-12 bg-blue-500/5 blur-[40px] rounded-full translate-x-6 -translate-y-6 pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

                                        <div className="flex justify-between items-start mb-3 relative z-10">
                                            <h4 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">
                                                {plot.name}
                                            </h4>
                                            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 relative z-10">
                                            <p className="text-sm text-slate-500">
                                                <span className="text-slate-400 font-medium">Crop:</span> {plot.crop_variety || 'N/A'}
                                            </p>
                                            <div className="flex items-center text-sm text-slate-500">
                                                <Ruler className="w-4 h-4 mr-2 text-slate-600" />
                                                {plot.area_hectares} ha
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12 text-slate-600 bg-void/50 rounded-xl border border-dashed border-slate-800">
                                    No plots added yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
