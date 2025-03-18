import React, { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../../supabaseClient";

const TestQuestionTable = ({ lectureId, onEdit }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch questions by lecture ID when component mounts or lectureId changes.
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                console.log("Fetching questions for lectureId:", lectureId);
                const res = await axios.get(
                    `${window.baseUrl}/api/test_questions?lectures_id=${lectureId}`
                );
                setQuestions(res.data);
            } catch (error) {
                console.error("Error fetching test questions:", error);
            } finally {
                setLoading(false);
            }
        };

        if (lectureId) {
            fetchQuestions();
        }
    }, [lectureId]);

    // Realtime subscription to test_questions table changes for the given lecture.
    useEffect(() => {
        if (!lectureId) return;

        const channel = supabase
            .channel(`test_questions_${lectureId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "test_questions",
                    filter: `lectures_id=eq.${lectureId}`,
                },
                (payload) => {
                    console.log("INSERT event received:", payload);
                    setQuestions((prev) => [...prev, payload.new]);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "test_questions",
                    filter: `lectures_id=eq.${lectureId}`,
                },
                (payload) => {
                    console.log("UPDATE event received:", payload);
                    setQuestions((prev) =>
                        prev.map((q) => (q.id === payload.new.id ? payload.new : q))
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "test_questions",
                    filter: `lectures_id=eq.${lectureId}`,
                },
                (payload) => {
                    console.log("DELETE event received:", payload);
                    setQuestions((prev) => prev.filter((q) => q.id !== payload.old.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [lectureId]);

    // Handler to delete a question.
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${window.baseUrl}/api/test_questions/${id}`);
            setQuestions((prevQuestions) =>
                prevQuestions.filter((q) => q.id !== id)
            );
        } catch (error) {
            console.error("Error deleting question:", error);
        }
    };

    if (loading)
        return (
            <div className="p-4 text-center text-gray-700">
                Loading questions...
            </div>
        );

    return (
        <div className="p-4 mt-14 mb-12 mx-4">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Test Questions
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow rounded-lg">
                    <thead className="bg-gray-200">
                    <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Question
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Answer
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Hint
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Explanation
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {questions.map((question) => (
                        <tr
                            key={question.id}
                            className="border-t hover:bg-gray-50 transition-colors"
                        >
                            <td className="px-4 py-2 text-gray-800">
                                {question.test_question_text}
                            </td>
                            <td className="px-4 py-2 text-gray-800">
                                {question.test_question_answer}
                            </td>
                            <td className="px-4 py-2 text-gray-800">{question.hint}</td>
                            <td className="px-4 py-2 text-gray-800">
                                {question.explanation}
                            </td>
                            <td className="px-4 py-2 text-center space-x-2">
                                <button
                                    onClick={() => onEdit(question)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(question.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded transition"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TestQuestionTable;
