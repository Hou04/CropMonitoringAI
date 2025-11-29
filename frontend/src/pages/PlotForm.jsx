import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function PlotForm() {
    const { id } = useParams(); // if editing, id will be present
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [formData, setFormData] = useState({
        name: '',
        farm_id: '',
        crop_variety: '',
        area_hectares: ''
    });
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load farms for selection
    useEffect(() => {
        api.get('farms/').then(res => setFarms(res.data)).catch(err => console.error(err));
    }, []);

    // Load existing plot data if editing
    useEffect(() => {
        if (isEdit) {
            api.get(`plots/${id}/`).then(res => {
                const { name, farm, crop_variety, area_hectares } = res.data;
                setFormData({ name, farm_id: farm.id, crop_variety, area_hectares });
            }).catch(err => console.error(err));
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`plots/${id}/`, formData);
            } else {
                await api.post('plots/', formData);
            }
            navigate('/plots');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-card-dark rounded-2xl border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-4">
                {isEdit ? 'Edit Plot' : 'Create New Plot'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-slate-400">Name</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-slate-800 text-white"
                    />
                </div>
                <div>
                    <label className="block text-slate-400">Farm</label>
                    <select
                        name="farm_id"
                        value={formData.farm_id}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-slate-800 text-white"
                    >
                        <option value="" disabled>Select a farm</option>
                        {farms.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-slate-400">Crop Variety</label>
                    <input
                        name="crop_variety"
                        value={formData.crop_variety}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-slate-800 text-white"
                    />
                </div>
                <div>
                    <label className="block text-slate-400">Area (hectares)</label>
                    <input
                        name="area_hectares"
                        type="number"
                        step="0.01"
                        value={formData.area_hectares}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-slate-800 text-white"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </form>
        </div>
    );
}
