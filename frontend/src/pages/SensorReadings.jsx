import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Droplets, Thermometer, Wind, Database, Calendar, Filter, RefreshCw, Download } from 'lucide-react';

export default function SensorReadings() {
    const [readings, setReadings] = useState([]);
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedPlot, setSelectedPlot] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [hours, setHours] = useState(24);
    const [page, setPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        fetchPlots();
    }, []);

    useEffect(() => {
        if (selectedPlot) {
            fetchReadings();
        }
    }, [selectedPlot, selectedType, hours]);

    const fetchPlots = async () => {
        try {
            const res = await api.get('plots/');
            setPlots(res.data);
            if (res.data.length > 0) {
                setSelectedPlot(res.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching plots:', error);
        }
    };

    const fetchReadings = async () => {
        setLoading(true);
        try {
            let url = `sensor-readings/?plot=${selectedPlot}&hours=${hours}`;
            if (selectedType) {
                url += `&sensor_type=${selectedType}`;
            }

            const res = await api.get(url);
            setReadings(res.data);
            setPage(1);
        } catch (error) {
            console.error('Error fetching readings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSensorIcon = (type) => {
        switch (type) {
            case 'MOI': return <Droplets className="w-4 h-4 text-blue-400" />;
            case 'TMP': return <Thermometer className="w-4 h-4 text-red-400" />;
            case 'HUM': return <Wind className="w-4 h-4 text-green-400" />;
            default: return <Database className="w-4 h-4 text-slate-400" />;
        }
    };

    const getSensorLabel = (type) => {
        switch (type) {
            case 'MOI': return 'Moisture';
            case 'TMP': return 'Temperature';
            case 'HUM': return 'Humidity';
            default: return type;
        }
    };

    const getSensorUnit = (type) => {
        switch (type) {
            case 'MOI': return '%';
            case 'TMP': return '°C';
            case 'HUM': return '%';
            default: return '';
        }
    };

    const getSensorColor = (type) => {
        switch (type) {
            case 'MOI': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'TMP': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'HUM': return 'bg-green-500/10 text-green-400 border-green-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const paginatedReadings = readings.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(readings.length / itemsPerPage);

    const exportCSV = () => {
        if (readings.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['Timestamp', 'Sensor Type', 'Value', 'Unit', 'Source'];
        const rows = readings.map(r => [
            new Date(r.timestamp).toISOString(),
            getSensorLabel(r.sensor_type),
            parseFloat(r.value).toFixed(2),
            getSensorUnit(r.sensor_type),
            r.source || 'manual'
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sensor_readings_${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(`Exported ${readings.length} readings`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Sensor Readings</h1>
                <p className="text-slate-400 mt-1">Raw sensor data with filtering and pagination</p>
            </div>

            {/* Filters */}
            <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center space-x-2 text-slate-400 mb-4">
                    <Filter className="w-5 h-5" />
                    <h2 className="font-semibold text-white">Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Plot Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            Select Plot
                        </label>
                        <select
                            value={selectedPlot}
                            onChange={(e) => setSelectedPlot(e.target.value)}
                            className="w-full bg-void border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            {plots.map(plot => (
                                <option key={plot.id} value={plot.id}>
                                    {plot.name} ({plot.farm?.name})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sensor Type */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            Sensor Type
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full bg-void border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="">All Types</option>
                            <option value="MOI">Moisture</option>
                            <option value="TMP">Temperature</option>
                            <option value="HUM">Humidity</option>
                        </select>
                    </div>

                    {/* Time Range */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                            Time Range
                        </label>
                        <select
                            value={hours}
                            onChange={(e) => setHours(parseInt(e.target.value))}
                            className="w-full bg-void border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value={1}>Last 1 hour</option>
                            <option value={6}>Last 6 hours</option>
                            <option value={24}>Last 24 hours</option>
                            <option value={72}>Last 3 days</option>
                            <option value={168}>Last 7 days</option>
                        </select>
                    </div>

                    {/* Refresh Button */}
                    <div className="flex items-end">
                        <button
                            onClick={fetchReadings}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {/* Export Button */}
                    <div className="flex items-end">
                        <button
                            onClick={exportCSV}
                            disabled={readings.length === 0}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
                    <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Total Readings</p>
                        <p className="text-2xl font-bold text-white mt-1">{readings.length}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Current Page</p>
                        <p className="text-2xl font-bold text-white mt-1">{page} / {totalPages || 1}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Showing</p>
                        <p className="text-2xl font-bold text-white mt-1">{paginatedReadings.length}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Time Range</p>
                        <p className="text-2xl font-bold text-white mt-1">{hours}h</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-card-dark p-16 rounded-2xl text-center border border-slate-800">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading sensor data...</p>
                </div>
            ) : readings.length === 0 ? (
                <div className="bg-card-dark p-16 rounded-2xl text-center border border-slate-800">
                    <Database className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Readings Found</h3>
                    <p className="text-slate-500">No sensor data available for the selected filters.</p>
                </div>
            ) : (
                <div className="bg-card-dark rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800 bg-void/30">
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Timestamp
                                    </th>
                                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Sensor Type
                                    </th>
                                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Value
                                    </th>
                                    <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Source
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {paginatedReadings.map((reading, idx) => (
                                    <tr
                                        key={reading.id}
                                        className="hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2 text-slate-300">
                                                <Calendar className="w-4 h-4 text-slate-500" />
                                                <span className="font-mono text-sm">
                                                    {new Date(reading.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                {getSensorIcon(reading.sensor_type)}
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSensorColor(reading.sensor_type)}`}>
                                                    {getSensorLabel(reading.sensor_type)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-xl font-bold text-white">
                                                {parseFloat(reading.value).toFixed(2)}
                                            </span>
                                            <span className="text-slate-500 ml-1">
                                                {getSensorUnit(reading.sensor_type)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded text-xs font-medium ${reading.source === 'simulator'
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                }`}>
                                                {reading.source || 'manual'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-void border border-slate-700 rounded-lg text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>

                            <div className="flex items-center space-x-2">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${page === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-void border border-slate-700 text-slate-400 hover:bg-slate-800'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && <span className="text-slate-500">...</span>}
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-void border border-slate-700 rounded-lg text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
