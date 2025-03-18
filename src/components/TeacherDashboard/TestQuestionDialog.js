import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TestQuestionDialog = ({ lectureId, onClose, onQuestionAdded }) => {
    const [formData, setFormData] = useState({
        test_question_text: '',
        test_question_answer: '',
        hint: '',
        explanation: '',
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.test_question_text || !formData.test_question_answer) {
            setMessage("Please fill in the required fields.");
            return;
        }
        try {
            const payload = { ...formData, lectures_id: lectureId };
            const res = await axios.post(`${window.baseUrl}/api/test_questions`, payload);
            setMessage("Question added successfully!");
            if (onQuestionAdded) {
                onQuestionAdded(res.data);
            }
            onClose();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error adding question');
            console.error("Error adding test question:", error);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded w-11/12 max-w-md">
                <h2 className="text-2xl font-bold mb-4">Add Test Question</h2>
                {message && <p className="mb-4 text-green-600">{message}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Question Text
                        </label>
                        <textarea
                            name="test_question_text"
                            value={formData.test_question_text}
                            onChange={handleChange}
                            required
                            className="mt-1 w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Correct Answer
                        </label>
                        <input
                            type="text"
                            name="test_question_answer"
                            value={formData.test_question_answer}
                            onChange={handleChange}
                            required
                            className="mt-1 w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Hint
                        </label>
                        <input
                            type="text"
                            name="hint"
                            value={formData.hint}
                            onChange={handleChange}
                            className="mt-1 w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Explanation
                        </label>
                        <textarea
                            name="explanation"
                            value={formData.explanation}
                            onChange={handleChange}
                            className="mt-1 w-full border rounded p-2"
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Add Question
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestQuestionDialog;
