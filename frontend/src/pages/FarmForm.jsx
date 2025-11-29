import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function FarmForm() {
    const { id } = useParams(); // if editing, id will be present
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        crop_type: '',
        area_hectares: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            // fetch existing farm data
            api.get(`farms/${id}/`).then(res => {
                const { name, location, crop_type, area_hectares } = res.data;
                setFormData({ name, location, crop_type, area_hectares });
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
                await api.put(`farms/${id}/`, formData);
            } else {
                await api.post('farms/', formData);
            }
            navigate('/farms');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-card-dark rounded-2xl border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-4">
                {isEdit ? 'Edit Farm' : 'Create New Farm'}
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
                    <label className="block text-slate-400">Location</label>
                    <input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        className="w-full p-2 rounded bg-slate-800 text-white"
                    />
                </div>
                <div>
                    <label className="block text-slate-400">Crop Type</label>
                    <input
                        name="crop_type"
                        value={formData.crop_type}
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
