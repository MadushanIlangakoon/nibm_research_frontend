import React, { useState } from 'react';
import axios from 'axios';

const StudentProfileModal = ({ student, onClose, onProfileUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: student.name || '',
        gender: student.gender || '',
        stream: student.stream || '',
        photo: student.photo || '',
    });
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Simulated photo upload handler.
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        // Simulate photo upload by generating a temporary URL.
        const photoUrl = URL.createObjectURL(file);
        setFormData({ ...formData, photo: photoUrl });
        setUploading(false);
    };

    const handleSave = async () => {
        try {
            const res = await axios.put('http://192.168.1.2:5000/api/students/profile', {
                auth_id: student.auth_id, // assuming student has auth_id field
                name: formData.name,
                gender: formData.gender,
                stream: formData.stream,
                photo: formData.photo,
            });
            onProfileUpdated(res.data);
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Update failed');
        }
    };

    // Determine photo URL: use student's photo if available; otherwise, use placeholder.
    const getPhoto = () => {
        if (formData.photo) return formData.photo;
        if (formData.gender && formData.gender.toLowerCase() === 'female') {
            return '/girl_placeholder.webp';
        }
        return '/boy_placeholder.webp';
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg w-11/12 max-w-2xl p-8 relative">
                {/* Header: Close button and Edit/Cancel icon */}
                <div className="flex justify-end items-center">
                    {/* Edit/Canel Button */}
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 mr-2 text-gray-600 hover:text-gray-800"
                        title={isEditing ? "Cancel Editing" : "Edit Profile"}
                    >
                        {isEditing ? (
                            // Cancel icon (an X)
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            // Pencil icon
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L9 17.5H5v-4L16.732 4.732z" />
                            </svg>
                        )}
                    </button>
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-600 hover:text-gray-800"
                        title="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-6">
                        <img
                            src={getPhoto()}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-blue-600"
                        />
                        {isEditing && (
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="absolute bottom-0 right-0 bg-white p-1 rounded-full cursor-pointer shadow"
                            />
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{student.email}</p>
                    <div className="flex w-3/12 justify-around mb-4">
                        {isEditing ? (
                            <>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="p-2 border rounded w-1/2"
                                    placeholder="Name"
                                />
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="p-2 border rounded w-1/2"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </>
                        ) : (
                            <>
                                <p className="text-lg font-bold">{formData.name}</p>
                                <p className="text-lg">{formData.gender}</p>
                            </>
                        )}
                    </div>
                    <div className="w-full mb-4 text-center">
                        {isEditing ? (
                            <select
                                name="stream"
                                value={formData.stream}
                                onChange={handleChange}
                                className="p-2 border rounded w-full"
                            >
                                <option value="">Select Stream</option>
                                <option value="commerce">Commerce</option>
                                <option value="arts">Arts</option>
                                <option value="physical-science">Physical Science</option>
                                <option value="bio-science">Bio Science</option>
                                <option value="tech">Tech</option>
                            </select>
                        ) : (
                            <p className="text-sm text-gray-600">{formData.stream}</p>
                        )}
                    </div>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    {isEditing && (
                        <button
                            onClick={handleSave}
                            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {uploading ? 'Uploading...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentProfileModal;
