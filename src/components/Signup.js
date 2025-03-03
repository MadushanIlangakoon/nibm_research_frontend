// client/src/components/Signup.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        role: 'student',
        name: '',
        email: '',
        password: '',
        gender: '',
        stream: '' // new field for stream selection
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://192.168.1.2:5000/api/auth/signup', formData);
            setMessage(res.data.message);
            // Redirect to login after signup
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 via-white-300 to-blue-200 text-gray-900">
            <div className="max-w-lg w-full p-8 bg-gray-100 rounded-lg shadow-lg relative">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-semibold text-blue-600">Signup</h2>
                    <p className="text-sm text-gray-500 mt-2">Create your account to get started</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md mb-4">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full p-3 mt-2 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full p-3 mt-2 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full p-3 mt-2 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {formData.role === 'student' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 mt-2 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Stream</label>
                                <select
                                    name="stream"
                                    value={formData.stream}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 mt-2 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Stream</option>
                                    <option value="commerce">Commerce</option>
                                    <option value="arts">Arts</option>
                                    <option value="physical-science">Physical Science</option>
                                    <option value="bio-science">Bio Science</option>
                                    <option value="tech">Tech</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full p-3 mt-2 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition duration-200"
                    >
                        Signup
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/" className="text-blue-600 hover:underline">
                            Login
                        </Link>
                    </p>
                </div>

                <div className="absolute top-4 right-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="h-10 w-10 text-blue-600"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default Signup;
