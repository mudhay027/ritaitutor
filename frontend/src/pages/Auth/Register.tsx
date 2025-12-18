import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/auth';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            role: 'Student',
            staffCode: '',
        },
        validationSchema: Yup.object({
            name: Yup.string().required('Required'),
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string().min(6, 'Must be at least 6 characters').required('Required'),
            staffCode: Yup.string().when('role', {
                is: 'Staff',
                then: (schema) => schema.length(6, 'Must be exactly 6 digits').required('Required'),
                otherwise: (schema) => schema.required('Required'),
            }),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                await register(values);
                navigate('/login');
            } catch (err: any) {
                setError(err.response?.data || 'Registration failed');
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
                <h2 className="text-3xl font-bold text-center mb-8 text-primary-900">Create Account</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            {...formik.getFieldProps('name')}
                            className="glass-input w-full"
                            placeholder="John Doe"
                        />
                        {formik.touched.name && formik.errors.name && (
                            <div className="text-red-500 text-xs mt-1">{formik.errors.name}</div>
                        )}
                    </div>

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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select
                            {...formik.getFieldProps('role')}
                            className="glass-input w-full"
                        >
                            <option value="Student">Student</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {formik.values.role === 'Staff' ? 'Create your Staff Code (6 digits)' : 'Enter Staff Code'}
                        </label>
                        <input
                            type="text"
                            {...formik.getFieldProps('staffCode')}
                            className="glass-input w-full"
                            placeholder={formik.values.role === 'Staff' ? '123456' : 'Enter code provided by teacher'}
                            maxLength={formik.values.role === 'Staff' ? 6 : undefined}
                        />
                        {formik.touched.staffCode && formik.errors.staffCode && (
                            <div className="text-red-500 text-xs mt-1">{formik.errors.staffCode}</div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={formik.isSubmitting}
                        className="btn-primary w-full flex justify-center items-center gap-2"
                    >
                        {formik.isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-600 hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
