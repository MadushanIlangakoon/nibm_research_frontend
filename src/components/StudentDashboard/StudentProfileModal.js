import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { supabase } from '../../supabaseClient';

const StudentProfileModal = ({ student, onClose, onProfileUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [formData, setFormData] = useState({
        name: student.name || '',
        gender: student.gender || '',
        stream: student.stream || '',
        photo: student.photo || '',
    });
    const [personalization, setPersonalization] = useState(student.personalization || false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // Fetch latest student data from Supabase based on auth_id
    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('*')
                    .eq('auth_id', student.auth_id)
                    .single();
                if (error) {
                    setError(error.message);
                    return;
                }
                setFormData({
                    name: data.name || '',
                    gender: data.gender || '',
                    stream: data.stream || '',
                    photo: data.photo || '',
                });
                setPersonalization(data.personalization || false);
                console.log("Fetched student data:", data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchStudent();
    }, [student.auth_id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Photo upload handler using Supabase Storage
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        console.log("Selected file:", file);

        const fileExt = file.name.split('.').pop();
        const fileName = `${student.auth_id}-${Date.now()}.${fileExt}`;
        const filePath = `${student.auth_id}/${fileName}`;
        console.log("Uploading file to path:", filePath);

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);
        if (uploadError) {
            console.error("Upload error:", uploadError.message);
            setError(uploadError.message);
            setUploading(false);
            return;
        }
        console.log("File uploaded successfully.");

        const { data: publicData, error: publicUrlError } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
        if (publicUrlError) {
            console.error("Public URL error:", publicUrlError.message);
            setError(publicUrlError.message);
            setUploading(false);
            return;
        }
        console.log("Retrieved public URL:", publicData.publicUrl);

        setFormData((prevData) => {
            const updatedData = { ...prevData, photo: publicData.publicUrl };
            console.log("Updated formData with photo URL:", updatedData);
            return updatedData;
        });
        setUploading(false);
    };

    // Remove photo by clearing its URL
    const handleRemovePhoto = () => {
        setFormData((prevData) => {
            const updatedData = { ...prevData, photo: '' };
            console.log("Removed photo from formData:", updatedData);
            return updatedData;
        });
    };

    // Toggle personalization setting
    const handlePersonalizationToggle = async () => {
        const newPersonalization = !personalization;
        setPersonalization(newPersonalization);
        try {
            await axios.put(`${window.baseUrl}/api/students/profile`, {
                auth_id: student.auth_id,
                personalization: newPersonalization,
            });
            if (!newPersonalization) {
                await axios.post(`${window.mlUrl}/api/archive/delete_student_csvs`, {
                    student_id: student.id,
                });
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Personalization update failed');
            setPersonalization(!newPersonalization);
        }
    };

    const handleSave = async () => {
        try {
            const res = await axios.put(`${window.baseUrl}/api/students/profile`, {
                auth_id: student.auth_id,
                name: formData.name,
                gender: formData.gender,
                stream: formData.stream,
                photo: formData.photo,
                personalization,
            });
            console.log("Profile updated response:", res.data);
            onProfileUpdated(res.data);
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving profile:", err.response?.data?.error || err.message);
            setError(err.response?.data?.error || 'Update failed');
        }
    };

    const handleDeleteProfile = async () => {
        try {
            await axios.delete(`${window.baseUrl}/api/students/profile`, {
                data: { auth_id: student.auth_id },
            });
            await supabase.auth.signOut();
            onProfileUpdated(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete account');
        }
    };

    const renderDeleteDialog = () => (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-red-600">Warning</h2>
                <p className="text-red-600 mb-6">
                    Deleting your account will permanently remove all your data, and you will not be able to log back in.
                    This action cannot be undone.
                </p>
                <button
                    onClick={handleDeleteProfile}
                    className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
                >
                    Delete My Account
                </button>
                <button
                    onClick={() => setShowDeleteDialog(false)}
                    className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    const getPhoto = () => {
        if (formData.photo) return formData.photo;
        if (formData.gender && formData.gender.toLowerCase() === 'female') {
            return '/girl_placeholder.webp';
        }
        return '/boy_placeholder.webp';
    };

    const modalContent = (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            {showDeleteDialog && renderDeleteDialog()}
            <div className="bg-white rounded-lg w-11/12 max-w-lg p-6 relative">
                {/* Header */}
                <div className="flex justify-end items-center mb-6">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 mr-2 text-gray-600 hover:text-gray-800"
                        title={isEditing ? 'Cancel Editing' : 'Edit Profile'}
                    >
                        {isEditing ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L9 17.5H5v-4L16.732 4.732z" />
                            </svg>
                        )}
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-600 hover:text-gray-800" title="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                        <img
                            src={getPhoto()}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-blue-600"
                        />
                        {isEditing && (
                            <div className="absolute bottom-0 right-0 flex flex-col items-center space-y-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="bg-gray-400 p-1 rounded-full cursor-pointer shadow"
                                />
                                {formData.photo && (
                                    <button
                                        onClick={handleRemovePhoto}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Always show personalization toggle */}
                    <div className="flex items-center justify-center space-x-2">
                        <p className="text-gray-700 font-semibold">Personalization:</p>
                        <button
                            onClick={handlePersonalizationToggle}
                            type="button"
                            className={`w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                                personalization ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                        >
                            <div
                                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                                    personalization ? 'translate-x-8' : ''
                                }`}
                            ></div>
                        </button>
                    </div>
                    {isEditing && <p className="text-sm text-gray-600">{student.email}</p>}
                    {isEditing ? (
                        <form className="w-full space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="flex flex-col">
                                    <label htmlFor="name" className="mb-1 font-medium text-gray-700">Name</label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Name"
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="gender" className="mb-1 font-medium text-gray-700">Gender</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="stream" className="mb-1 font-medium text-gray-700">Stream</label>
                                <select
                                    id="stream"
                                    name="stream"
                                    value={formData.stream}
                                    onChange={handleChange}
                                    className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    <option value="">Select Stream</option>
                                    <option value="commerce">Commerce</option>
                                    <option value="arts">Arts</option>
                                    <option value="physical-science">Physical Science</option>
                                    <option value="bio-science">Bio Science</option>
                                    <option value="tech">Tech</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="bio" className="mb-1 font-medium text-gray-700">Bio</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Enter your bio"
                                    className="p-2 border rounded w-full h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            {error && <p className="text-red-500">{error}</p>}
                            <button
                                type="button"
                                onClick={handleSave}
                                className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                                {uploading ? 'Uploading...' : 'Save'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center">
                            <div className="flex items-center justify-center">
                                <p className="text-lg font-bold">{formData.name}</p>
                                <span className="px-2">-</span>
                                <p className="text-lg">{formData.gender}</p>
                            </div>
                            <div className="mt-2">
                                <p className="text-md text-gray-600">{formData.stream}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-4 right-4">
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 opacity-80 hover:opacity-100 transition"
                    >
                        Delete My Account
                    </button>
                </div>
            </div>
        </div>
    );

    const modalRoot = document.getElementById('modal-root') || document.body;
    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default StudentProfileModal;
