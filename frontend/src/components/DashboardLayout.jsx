import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Sprout,
    AlertTriangle,
    LogOut,
    Menu,
    X,
    User,
    ChevronRight,
    Database,
    BrainCircuit
} from 'lucide-react';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/farms', icon: Sprout, label: 'Farms' },
        { path: '/plots', icon: Sprout, label: 'Plots' },
        { path: '/sensor-readings', icon: Database, label: 'Sensor Data' },
        { path: '/alerts', icon: AlertTriangle, label: 'Alerts & Anomalies' },
        { path: '/recommendations', icon: BrainCircuit, label: 'AI Recommendations' },
    ];

    return (
        <div className="min-h-screen bg-void flex text-slate-400">
            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-card-dark border-r border-slate-800 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
        `}
            >
                <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mr-3 shadow-glow-blue">
                        <Sprout className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">CropMonitor <span className="text-blue-500">AI</span></span>
                </div>

                <nav className="p-4 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `
      flex items-center justify-between px-4 py-3.5 rounded-xl 
      transition-all duration-200 group
      ${isActive
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-glow-blue'
                                    : 'hover:bg-slate-800/50 hover:text-white border border-transparent'
                                }
    `
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="flex items-center">
                                        <item.icon
                                            className={`w-5 h-5 mr-3 ${isActive
                                                ? 'text-blue-400'
                                                : 'text-slate-500 group-hover:text-white'
                                                }`}
                                        />
                                        <span className="font-medium">{item.label}</span>
                                    </div>

                                    {isActive && (
                                        <ChevronRight className="w-4 h-4 text-blue-500" />
                                    )}
                                </>
                            )}
                        </NavLink>

                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800/50 bg-card-dark">
                    <div className="flex items-center mb-4 p-3 rounded-xl bg-void border border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mr-3 border border-slate-700">
                            <div className="w-full h-full flex items-center justify-center bg-slate-700 rounded-full">
                                <User className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                        <div className="overflow-hidden ml-3">
                            <p className="text-sm font-bold text-white truncate">{user?.username || 'User'}</p>
                            <p className="text-xs text-blue-400 truncate">Premium Plan</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Ambient background glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none" />

                {/* Mobile Header */}
                <header className="lg:hidden bg-card-dark border-b border-slate-800 h-16 flex items-center justify-between px-4 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
                    >
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    <span className="font-bold text-white">CropMonitor AI</span>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
