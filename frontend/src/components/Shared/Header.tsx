import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/store';
import { LogOut, User, BookOpen } from 'lucide-react';

const Header = () => {
    const { user, logout } = useStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="fixed top-0 w-full z-50 glass-card rounded-none border-x-0 border-t-0 px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary-700">
                    <BookOpen className="w-8 h-8" />
                    <span>AI Tutor</span>
                </Link>

                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2 text-slate-600">
                                <User className="w-5 h-5" />
                                <span className="font-medium">{user.name} ({user.role})</span>
                            </div>

                            {user.role === 'Staff' && (
                                <Link to="/staff" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
                                    Dashboard
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-4">
                            <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium">Login</Link>
                            <Link to="/register" className="btn-primary py-1 px-4 text-sm">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
