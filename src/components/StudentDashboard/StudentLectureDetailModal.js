import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentLectureDetailModal = ({ lecture, onClose }) => {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg w-11/12 max-w-lg p-6 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl"
                    title="Close"
                >
                    &times;
                </button>
                <h3 className="text-2xl font-bold mb-4">{lecture.title}</h3>
                <p className="mb-4 text-gray-700">{lecture.description}</p>
                <p className="mb-4 text-sm text-gray-500">
                    {lecture.started_at
                        ? `Started at: ${new Date(lecture.started_at).toLocaleString()}`
                        : `Scheduled at: ${new Date(lecture.scheduled_at).toLocaleString()}`}
                </p>
                {lecture.started_at ? (
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => navigate(`/lecture/${lecture.id}`)}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Join Room
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-200"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentLectureDetailModal;
