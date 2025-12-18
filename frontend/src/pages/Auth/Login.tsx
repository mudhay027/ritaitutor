import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/store';
import { login } from '../../services/auth';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { setUser, setToken } = useStore();
    const [error, setError] = useState('');

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string().required('Required'),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                const data = await login(values);
                setToken(data.token);
                setUser(data.user);
                navigate(data.user.role === 'Staff' ? '/staff' : '/student');
            } catch (err: any) {
                setError(err.response?.data || 'Login failed');
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
                <h2 className="text-3xl font-bold text-center mb-8 text-primary-900">Welcome Back</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            {...formik.getFieldProps('email')}
                            className="glass-input w-full"
                            placeholder="you@example.com"
                        />
                        {formik.touched.email && formik.errors.email && (
                            <div className="text-red-500 text-xs mt-1">{formik.errors.email}</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            {...formik.getFieldProps('password')}
                            className="glass-input w-full"
                            placeholder="••••••••"
                        />
                        {formik.touched.password && formik.errors.password && (
                            <div className="text-red-500 text-xs mt-1">{formik.errors.password}</div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={formik.isSubmitting}
                        className="btn-primary w-full flex justify-center items-center gap-2"
                    >
                        {formik.isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary-600 hover:underline font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
