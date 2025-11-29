import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import { ArrowLeft, Droplets, Thermometer, Wind, RefreshCw, ZoomOut, Sparkles } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin
);

export default function PlotDetail() {
    const { id } = useParams();
    const [plot, setPlot] = useState(null);
    const [readings, setReadings] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isGenerating, setIsGenerating] = useState(false);

    // Refs for chart zoom reset
    const moistureChartRef = useRef(null);
    const tempChartRef = useRef(null);
    const humidityChartRef = useRef(null);

    const fetchData = async (showToast = false) => {
        try {
            setIsRefreshing(true);
            const [plotRes, readingsRes, anomaliesRes] = await Promise.all([
                api.get(`plots/${id}/`),
                api.get(`sensor-readings/?plot=${id}`),
                api.get(`anomalies/?plot=${id}`)
            ]);

            setPlot(plotRes.data);
            const sortedReadings = readingsRes.data.sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            setReadings(sortedReadings);
            setAnomalies(anomaliesRes.data);
            setLastUpdated(new Date());

            if (showToast) {
                toast.success('Plot data updated');
            }
        } catch (error) {
            console.error("Error fetching plot details:", error);
            toast.error('Failed to load plot data');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchData(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [id]);

    const resetZoom = () => {
        [moistureChartRef, tempChartRef, humidityChartRef].forEach(ref => {
            if (ref.current) {
                ref.current.resetZoom();
            }
        });
        toast.success('Chart zoom reset');
    };

    const generateTestData = async () => {
        setIsGenerating(true);
        try {
            const response = await api.post(
                `plots/${id}/generate-test-data/`,
                { days: 7, readings_per_hour: 2 }
            );

            toast.success(
                `Generated ${response.data.count} sensor readings! Charts will update shortly.`,
                { duration: 4000 }
            );

            // Refresh data after generation
            await fetchData(true);
        } catch (error) {
            console.error('Error generating test data:', error);
            toast.error(
                error.response?.data?.error || 'Failed to generate test data',
                { duration: 4000 }
            );
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading plot details...</div>;
    if (!plot) return <div className="p-12 text-center text-red-400">Plot not found</div>;

    const getSensorData = (type) => {
        return readings.filter(r => r.sensor_type === type);
    };

    const moistureData = getSensorData('MOI');
    const tempData = getSensorData('TMP');
    const humidityData = getSensorData('HUM');

    // Dark Theme Chart Options with Zoom
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#94a3b8',
                    font: { family: 'sans-serif' }
                }
            },
            tooltip: {
                backgroundColor: '#0f1623',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                borderColor: '#1e293b',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode: 'xy',
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#64748b',
                    font: { size: 11 },
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                grid: {
                    color: '#1e293b',
                },
                ticks: {
                    color: '#64748b',
                    font: { size: 11 }
                }
            }
        }
    };

    const createChartData = (data, label, color, bgColor) => {
        return {
            labels: data.map(r => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            datasets: [
                {
                    label: label,
                    data: data.map(r => r.value),
                    borderColor: color,
                    backgroundColor: bgColor,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                }
            ],
        };
    };

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 30) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/plots" className="p-2.5 bg-card-dark border border-slate-800 rounded-xl hover:border-blue-500/50 hover:text-blue-400 transition-all text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{plot.name}</h1>
                        <p className="text-slate-400">
                            {plot.crop_variety} • <span className="text-slate-500">{plot.area_hectares} hectares</span>
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={isRefreshing}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh data"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={resetZoom}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
                        title="Reset chart zoom"
                    >
                        <ZoomOut className="w-4 h-4" />
                        <span>Reset Zoom</span>
                    </button>
                    <div className="text-sm text-slate-500 font-mono">
                        Last updated: <span className="text-blue-400">{getTimeAgo(lastUpdated)}</span>
                    </div>
                </div>
            </div>

            {/* Current Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 flex items-center space-x-4 shadow-lg">
                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <Droplets className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Soil Moisture</p>
                        <p className="text-2xl font-bold text-white mt-1">
                            {moistureData.length > 0 ? `${moistureData[moistureData.length - 1].value}%` : '--'}
                        </p>
                    </div>
                </div>

                <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 flex items-center space-x-4 shadow-lg">
                    <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <Thermometer className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Temperature</p>
                        <p className="text-2xl font-bold text-white mt-1">
                            {tempData.length > 0 ? `${tempData[tempData.length - 1].value}°C` : '--'}
                        </p>
                    </div>
                </div>

                <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 flex items-center space-x-4 shadow-lg">
                    <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <Wind className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Humidity</p>
                        <p className="text-2xl font-bold text-white mt-1">
                            {humidityData.length > 0 ? `${humidityData[humidityData.length - 1].value}%` : '--'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Zoom Instructions */}
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-sm text-blue-300">
                    <strong>💡 Tip:</strong> Scroll to zoom, drag to pan. Use the "Reset Zoom" button to return to default view.
                </p>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Moisture Chart */}
                <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <Droplets className="w-5 h-5 mr-2 text-blue-400" />
                        Soil Moisture History
                    </h3>
                    <div className="h-72">
                        {moistureData.length > 0 ? (
                            <Line
                                ref={moistureChartRef}
                                options={commonOptions}
                                data={createChartData(moistureData, 'Moisture (%)', '#3b82f6', 'rgba(59, 130, 246, 0.1)')}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                                <p>No data available</p>
                                <button
                                    onClick={generateTestData}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    <span>{isGenerating ? 'Generating...' : 'Generate Sample Data'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Temperature Chart */}
                <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <Thermometer className="w-5 h-5 mr-2 text-orange-400" />
                        Temperature History
                    </h3>
                    <div className="h-72">
                        {tempData.length > 0 ? (
                            <Line
                                ref={tempChartRef}
                                options={commonOptions}
                                data={createChartData(tempData, 'Temperature (°C)', '#f97316', 'rgba(249, 115, 22, 0.1)')}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                                <p>No data available</p>
                                <button
                                    onClick={generateTestData}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    <span>{isGenerating ? 'Generating...' : 'Generate Sample Data'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Humidity Chart */}
                <div className="bg-card-dark p-6 rounded-2xl border border-slate-800 shadow-xl lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <Wind className="w-5 h-5 mr-2 text-purple-400" />
                        Humidity History
                    </h3>
                    <div className="h-72">
                        {humidityData.length > 0 ? (
                            <Line
                                ref={humidityChartRef}
                                options={commonOptions}
                                data={createChartData(humidityData, 'Humidity (%)', '#a855f7', 'rgba(168, 85, 247, 0.1)')}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                                <p>No data available</p>
                                <button
                                    onClick={generateTestData}
                                    disabled={isGenerating}
                                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    <span>{isGenerating ? 'Generating...' : 'Generate Sample Data'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
