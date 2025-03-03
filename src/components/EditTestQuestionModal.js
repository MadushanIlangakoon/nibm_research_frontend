import React, { useState, useEffect } from "react";
import axios from "axios";

const EditTestQuestionModal = ({ question, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        test_question_text: "",
        test_question_answer: "",
        hint: "",
        explanation: "",
    });
    const [message, setMessage] = useState("");

    // Pre-populate form fields when question changes.
    useEffect(() => {
        if (question) {
            setFormData({
                test_question_text: question.test_question_text || "",
                test_question_answer: question.test_question_answer || "",
                hint: question.hint || "",
                explanation: question.explanation || "",
            });
        }
    }, [question]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Call your update endpoint (adjust URL if necessary)
            const res = await axios.put("http://localhost:5000/api/test_questions", {
                id: question.id,
                ...formData,
                lectures_id: question.lectures_id,
            });
            setMessage("Question updated successfully!");
            // Pass the updated question back to the parent (for updating state)
            onUpdate(res.data);
            // Optionally, close the modal after a short delay:
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Error updating question:", error);
            setMessage("Error updating question.");
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded w-11/12 max-w-md">
                <h2 className="text-2xl font-bold mb-4">Edit Test Question</h2>
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
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTestQuestionModal;
