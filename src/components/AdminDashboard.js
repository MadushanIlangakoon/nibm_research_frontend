// client/src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const streams = ['iq', 'general', 'tech', 'commerce', 'physical-science', 'bio_science', 'arts'];

const AdminDashboard = () => {
    const [questions, setQuestions] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        question_text: '',
        hint: '',
        correct_answer: '',
        explanation: '',
        stream: streams[0],
    });
    const [message, setMessage] = useState('');

    const fetchQuestions = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/general_questions');
            setQuestions(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleInputChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/general_questions', formData);
            setMessage('Question added successfully!');
            setModalOpen(false);
            fetchQuestions();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error adding question');
        }
    };

    const handleUpdateQuestion = async (e) => {
        e.preventDefault();
        try {
            await axios.put('http://localhost:5000/api/general_questions', formData);
            setMessage('Question updated successfully!');
            setModalOpen(false);
            fetchQuestions();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error updating question');
        }
    };

    const handleDeleteQuestion = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/general_questions/${id}`);
            setMessage('Question deleted successfully!');
            fetchQuestions();
        } catch (error) {
            setMessage(error.response?.data?.error || 'Error deleting question');
        }
    };

    const handleEditQuestion = (question) => {
        setFormData({
            id: question.id,
            question_text: question.question_text,
            hint: question.hint,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            stream: question.stream,
        });
        setModalOpen(true);
    };

    return (
        <div className="p-4">
            <h2 className="text-3xl font-bold mb-4">Admin Dashboard</h2>
            <p className="mb-4">Welcome, Admin!</p>
            <button
                onClick={() => {
                    setFormData({
                        question_text: '',
                        hint: '',
                        correct_answer: '',
                        explanation: '',
                        stream: streams[0],
                    });
                    setModalOpen(true);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
            >
                Add Question
            </button>

            {message && <p className="text-green-600 mb-4">{message}</p>}

            {/* Modal for Add/Edit */}
            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded w-11/12 max-w-md">
                        <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit Question' : 'Add Question'}</h3>
                        <form onSubmit={formData.id ? handleUpdateQuestion : handleAddQuestion}>
                            <input
                                type="text"
                                name="question_text"
                                placeholder="Question Text"
                                value={formData.question_text}
                                onChange={handleInputChange}
                                className="border p-2 w-full mb-2"
                                required
                            />
                            <input
                                type="text"
                                name="hint"
                                placeholder="Hint"
                                value={formData.hint}
                                onChange={handleInputChange}
                                className="border p-2 w-full mb-2"
                            />
                            <input
                                type="text"
                                name="correct_answer"
                                placeholder="Correct Answer"
                                value={formData.correct_answer}
                                onChange={handleInputChange}
                                className="border p-2 w-full mb-2"
                                required
                            />
                            <textarea
                                name="explanation"
                                placeholder="Explanation"
                                value={formData.explanation}
                                onChange={handleInputChange}
                                className="border p-2 w-full mb-2"
                            />
                            <select
                                name="stream"
                                value={formData.stream}
                                onChange={handleInputChange}
                                className="border p-2 w-full mb-4"
                                required
                            >
                                {streams.map((s) => (
                                    <option key={s} value={s}>{s.toUpperCase()}</option>
                                ))}
                            </select>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="mr-2 px-4 py-2 border rounded"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                                    {formData.id ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Display questions by stream */}
            {streams.map((stream) => {
                const streamQuestions = questions.filter(q => q.stream === stream);
                return (
                    <div key={stream} className="mb-8">
                        <h3 className="text-2xl font-bold mb-4">{stream.toUpperCase()} Questions</h3>
                        {streamQuestions.length === 0 ? (
                            <p>No questions found for {stream.toUpperCase()}.</p>
                        ) : (
                            <table className="min-w-full bg-white border">
                                <thead>
                                <tr>
                                    <th className="py-2 px-4 border">Question</th>
                                    <th className="py-2 px-4 border">Hint</th>
                                    <th className="py-2 px-4 border">Correct Answer</th>
                                    <th className="py-2 px-4 border">Explanation</th>
                                    <th className="py-2 px-4 border">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {streamQuestions.map((question) => (
                                    <tr key={question.id}>
                                        <td className="py-2 px-4 border">{question.question_text}</td>
                                        <td className="py-2 px-4 border">{question.hint}</td>
                                        <td className="py-2 px-4 border">{question.correct_answer}</td>
                                        <td className="py-2 px-4 border">{question.explanation}</td>
                                        <td className="py-2 px-4 border">
                                            <button
                                                onClick={() => handleEditQuestion(question)}
                                                className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuestion(question.id)}
                                                className="bg-red-500 text-white px-2 py-1 rounded"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AdminDashboard;
