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
    const [emailError, setEmailError] = useState('');

    useEffect(() => {
        if (!loading && user && user.role && user.role !== "authenticated") {
            const role = user.role;
            if (role === "teacher") {
                navigate('/teacher-dashboard');
            } else if (role === "admin") {
                navigate('/admin-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        }
    }, [user, loading, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if(e.target.name === 'email') {
            setEmailError('');
        }
    };

    // Validate email with a check for '@' and a basic regex.
    const validateEmail = () => {
        const { email } = formData;
        if (!email.includes('@')) {
            setEmailError("Email must contain '@' symbol.");
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setEmailError('Please enter a valid email address.');
            } else {
                setEmailError('');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email || emailError) {
            if (!formData.email) {
                setEmailError('Email is required.');
            }
            return;
        }
        console.log(window.baseUrl)

        try {
            const res = await axios.post(`${window.baseUrl}/api/auth/login`, formData);
            const { role, access_token, refresh_token } = res.data;
            if (!access_token || !refresh_token) {
                setError('No valid tokens returned from the server');
                return;
            }

            const { error: setSessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
            });
            if (setSessionError) {
                setError('Failed to sync with Supabase: ' + setSessionError.message);
                return;
            }

            const { data: { session: newSession } } = await supabase.auth.getSession();

            if (newSession && newSession.user) {
                if (role === 'teacher') {
                    navigate('/teacher-dashboard');
                } else if (role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/student-dashboard');
                }
            } else {
                window.location.href = role === 'teacher' ? '/teacher-dashboard' : role === 'admin' ? '/admin-dashboard' : '/student-dashboard';
            }
        } catch (err) {
            console.error("Login error caught:", err);
            setError('Your email or password is wrong');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 via-white-300 to-blue-200">
            <div className="bg-gray-100 p-8 rounded-lg shadow-lg w-full sm:w-96">
                <h2 className="text-center text-2xl font-bold text-blue-600 mb-4">Login</h2>

                {/* Credential error container styling */}
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 shadow-sm">
                        {error}
                    </div>
                )}

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
                            onBlur={validateEmail}
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {/* Email error appears below the input, using previous popup styling */}
                        {emailError && (
                            <div className="mt-2 bg-yellow-100 text-yellow-800 text-xs p-2 rounded shadow">
                                {emailError}
                            </div>
                        )}
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
