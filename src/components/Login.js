import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import axios from "axios";
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    // Immediately redirect if a session already exists
    useEffect(() => {
        console.log("Login useEffect: user:", user, "loading:", loading);
        if (!loading && user) {
            console.log("User already logged in, redirecting:", user);
            const role = user.role || 'student';
            if (role === 'teacher') {
                console.log("Redirecting to teacher-dashboard");
                navigate('/teacher-dashboard');
            } else if (role === 'admin') {
                console.log("Redirecting to admin-dashboard");
                navigate('/admin-dashboard');
            } else {
                console.log("Redirecting to student-dashboard");
                navigate('/student-dashboard');
            }
        }
    }, [user, loading, navigate]);

    const handleChange = (e) => {
        console.log("handleChange:", e.target.name, e.target.value);
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        console.log("Submitting login with formData:", formData);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            console.log("Login response:", res.data);
            const { role, access_token, refresh_token } = res.data;
            console.log("Extracted role:", role);
            if (!access_token || !refresh_token) {
                setError('No valid tokens returned from the server');
                return;
            }

            // Set session in Supabase
            const { error: setSessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
            });
            console.log("Result from supabase.auth.setSession:", setSessionError);
            if (setSessionError) {
                setError('Failed to sync with Supabase: ' + setSessionError.message);
                return;
            }

            // Force a session re-fetch
            const { data: { session: newSession } } = await supabase.auth.getSession();
            console.log("New session after setSession:", newSession);

            if (newSession && newSession.user) {
                console.log("Session exists, now redirecting based on role:", role);
                if (role === 'teacher') {
                    navigate('/teacher-dashboard');
                } else if (role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/student-dashboard');
                }
            } else {
                console.log("No session found after setSession, forcing redirect via window.location");
                window.location.href = role === 'teacher' ? '/teacher-dashboard' : role === 'admin' ? '/admin-dashboard' : '/student-dashboard';
            }
        } catch (err) {
            console.error("Login error caught:", err);
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 via-white-300 to-blue-200">
            <div className="bg-gray-100 p-8 rounded-lg shadow-lg w-full sm:w-96">
                <h2 className="text-center text-2xl font-bold text-blue-600 mb-4">Login</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-blue-600 font-semibold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-blue-600 font-semibold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition duration-300"
                    >
                        Login
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                        <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">
                            Forgot Password?
                        </Link>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-blue-600 hover:text-blue-700">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
