import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Sprout, MapPin, Ruler, Plus, Edit, Trash2 } from 'lucide-react';

export default function FarmList() {
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFarms();
    }, []);

    const fetchFarms = async () => {
        try {
            const response = await api.get('farms/');
            setFarms(response.data);
        } catch (error) {
            console.error('Error fetching farms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this farm?')) {
            try {
                await api.delete(`farms/${id}/`);
                setFarms(farms.filter(f => f.id !== id));
            } catch (error) {
                console.error('Error deleting farm:', error);
                alert('Failed to delete farm');
            }
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-500 animate-pulse">Loading farms...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Farm Management</h1>
                    <p className="text-slate-400 mt-1">Manage your agricultural properties</p>
                </div>
                <button
                    onClick={() => navigate('/farms/new')}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-glow-blue flex items-center font-medium"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add Farm
                </button>
            </div>

            {farms.length === 0 ? (
                <div className="text-center py-24 bg-card-dark rounded-2xl border border-slate-800">
                    <Sprout className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-500 mb-2">No Farms Yet</h3>
                    <p className="text-slate-600 mb-6">Create your first farm to get started</p>
                    <button
                        onClick={() => navigate('/farms/new')}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-all inline-flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Create Farm
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {farms.map((farm) => (
                        <div
                            key={farm.id}
                            className="bg-card-dark rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:border-blue-500/50 transition-all group"
                        >
                            <Link
                                to={`/farms/${farm.id}`}
                                className="bg-slate-900/50 p-6 border-b border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors block"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <Sprout className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{farm.name}</h2>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold text-slate-300 uppercase tracking-wide">
                                    {farm.crop_type || 'Mixed Crops'}
                                </span>
                            </Link>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center text-sm text-slate-400">
                                    <MapPin className="w-4 h-4 mr-2 text-slate-600" />
                                    {farm.location}
                                </div>
                                <div className="flex items-center text-sm text-slate-400">
                                    <Ruler className="w-4 h-4 mr-2 text-slate-600" />
                                    {farm.area_hectares} hectares
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-slate-800">
                                    <button
                                        onClick={() => navigate(`/farms/${farm.id}/edit`)}
                                        className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-all"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(farm.id)}
                                        className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
