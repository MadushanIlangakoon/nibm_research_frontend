import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${window.baseUrl}/api/auth/forgot-password`,
                JSON.stringify({ email }),  // Ensure correct JSON format
                { headers: { 'Content-Type': 'application/json' } } // Set correct headers
            );
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset email');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 via-white-300 to-blue-200 text-gray-900">
            <div className="max-w-lg w-full p-8 bg-gray-100 rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-semibold text-blue-600">Forgot Password</h2>
                    <p className="text-sm text-gray-500 mt-2">Enter your email to reset your password</p>
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
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 mt-2 border rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition duration-200"
                    >
                        Send Reset Email
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        <Link to="/" className="text-blue-600 hover:underline">
                            Back to Login
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
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
