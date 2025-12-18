import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ManagePdfs from './pages/Staff/ManagePdfs';
import UploadPdf from './pages/Staff/UploadPdf';
import AskPage from './pages/Student/AskPage';
import { useStore } from './store/store';
import { useEffect, useState } from 'react';
import { getMe } from './services/auth';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, role }: { children: JSX.Element, role?: string }) => {
    const { user, token } = useStore();

    if (!token) return <Navigate to="/login" />;
    if (role && user && user.role !== role) return <Navigate to="/" />;

    return children;
};

function App() {
    const { setUser, token } = useStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const userData = await getMe();
                    setUser(userData);
                } catch {
                    // Token invalid
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token, setUser]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/staff"
                    element={
                        <ProtectedRoute role="Staff">
                            <ManagePdfs />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/upload"
                    element={
                        <ProtectedRoute role="Staff">
                            <UploadPdf />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/student"
                    element={
                        <ProtectedRoute>
                            <AskPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/student" />} />
            </Routes>
        </Router>
    );
}

export default App;
