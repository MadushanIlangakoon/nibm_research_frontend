import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Teachers = ({ onBack }) => {
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function fetchTeachers() {
            try {
                const res = await axios.get('https://nibm-research-backend.onrender.com/api/teachers');
                setTeachers(res.data);
            } catch (error) {
                setMessage(error.response?.data?.error || 'Error fetching teachers');
            }
        }
        fetchTeachers();
    }, []);

    const handleTeacherClick = (teacher) => {
        setSelectedTeacher(teacher);
    };

    const closeModal = () => {
        setSelectedTeacher(null);
    };

    // Determine teacher photo: use teacher.photo if available; otherwise, use placeholder based on gender.
    const getTeacherPhoto = (teacher) => {
        if (teacher.photo) {
            return teacher.photo;
        } else {
            if (teacher.gender && teacher.gender.toLowerCase() === 'female') {
                return '/TeacherFemalePlaceholder.webp';
            } else {
                return '/TeacherMalePlaceholder.webp';
            }
        }
    };

    // Helper to truncate bio text.
    const truncateText = (text, limit) => {
        if (!text) return '';
        return text.length <= limit ? text : text.slice(0, limit) + '...';
    };

    return (
        <div>
            <button
                onClick={onBack}
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
                &larr; Back
            </button>
            <h2 className="text-2xl font-bold mb-4">Teachers</h2>
            {message && <p className="text-red-500 mt-4">{message}</p>}
            {teachers.length === 0 ? (
                <p className="text-gray-500">No teachers found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {teachers.map((teacher) => (
                        <div
                            key={teacher.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer"
                            onClick={() => handleTeacherClick(teacher)}
                        >
                            <div className="flex justify-center mb-2">
                                <img
                                    src={getTeacherPhoto(teacher)}
                                    alt={teacher.name || 'Teacher'}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            </div>
                            <h4 className="text-md font-bold text-gray-800 text-center mb-1">
                                {teacher.name || 'Unknown Name'}
                            </h4>
                            <p className="text-xs text-gray-600 text-center">
                                {teacher.subjects || 'No subjects'}
                            </p>
                            <p className="text-xs text-gray-500 text-center mt-1">
                                {truncateText(teacher.bio || '', 50)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Teacher Modal */}
            {selectedTeacher && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg w-11/12 max-w-md relative">
                        <button
                            onClick={closeModal}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                        >
                            &times;
                        </button>
                        <div className="flex flex-col items-center">
                            <img
                                src={getTeacherPhoto(selectedTeacher)}
                                alt={selectedTeacher.name || 'Teacher'}
                                className="w-24 h-24 rounded-full object-cover mb-4"
                            />
                            <h3 className="text-xl font-bold mb-2">
                                {selectedTeacher.name || 'Unknown Name'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                                {selectedTeacher.email || 'No email provided'}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                Subjects: {selectedTeacher.subjects || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {selectedTeacher.bio || 'No bio available.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teachers;
