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
        stream: ''
    });
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState('');
    // use message state to trigger the modal
    const [message, setMessage] = useState('');
    // showModal flag
    const [showModal, setShowModal] = useState(false);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agreed) {
            setError('You must agree to the Terms and Conditions before signing up.');
            return;
        }
        try {
            const res = await axios.post(`${window.baseUrl}/api/auth/signup`, formData);
            // set message from response (or use custom message)
            const confirmationMessage = "A confirmation email has been sent to your email. Please confirm it and log in again using your username and password.";
            setMessage(confirmationMessage);
            setShowModal(true);
            // Optionally, clear form or any other state
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

                    {/* Terms and Conditions Checkbox */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="terms"
                            name="terms"
                            checked={agreed}
                            onChange={() => setAgreed(!agreed)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                            I agree to the{' '}
                            <a href="/terms" className="text-blue-600 hover:underline">
                                Terms and Conditions
                            </a>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={!agreed}
                        className={`w-full py-3 rounded-md shadow-md transition duration-200 ${
                            agreed
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        }`}
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
            </div>

            {/* Modal for confirmation */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-gray-900 opacity-50"></div>
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-blue-600 mb-4">Signup Successful</h3>
                        <p className="text-gray-700 mb-6">
                            A confirmation email has been sent to your email. Please confirm it and log in again using your username and password.
                        </p>
                        <button
                            onClick={() => {
                                setShowModal(false);
                                // Optionally navigate to login page if desired:
                                navigate('/');
                            }}
                            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Signup;
