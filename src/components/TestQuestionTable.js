import React, { useState, useEffect } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";

const TestQuestionTable = ({ lectureId, onEdit }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch questions by lecture ID when component mounts or lectureId changes.
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                console.log("Fetching questions for lectureId:", lectureId);
                const res = await axios.get(
                    `http://localhost:5000/api/test_questions?lectures_id=${lectureId}`
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

        // Create a realtime channel for test_questions changes filtered by lectures_id.
        const channel = supabase
            .channel(`test_questions_${lectureId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'test_questions',
                    filter: `lectures_id=eq.${lectureId}`,
                },
                (payload) => {
                    console.log('INSERT event received:', payload);
                    setQuestions((prev) => [...prev, payload.new]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'test_questions',
                    filter: `lectures_id=eq.${lectureId}`,
                },
                (payload) => {
                    console.log('UPDATE event received:', payload);
                    setQuestions((prev) =>
                        prev.map((q) => (q.id === payload.new.id ? payload.new : q))
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'test_questions',
                    filter: `lectures_id=eq.${lectureId}`,
                },
                (payload) => {
                    console.log('DELETE event received:', payload);
                    setQuestions((prev) =>
                        prev.filter((q) => q.id !== payload.old.id)
                    );
                }
            )
            .subscribe();

        // Cleanup on unmount or when lectureId changes.
        return () => {
            supabase.removeChannel(channel);
        };
    }, [lectureId]);

    // Handler to delete a question.
    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/test_questions/${id}`);
            setQuestions((prevQuestions) =>
                prevQuestions.filter((q) => q.id !== id)
            );
        } catch (error) {
            console.error("Error deleting question:", error);
        }
    };

    if (loading) return <div>Loading questions...</div>;

    return (
        <div className="p-4 ml-8 mt-14 mb-12">
            <h3 className="text-xl font-bold mb-2">Test Questions</h3>
            <table className="table-auto w-6/12 border-collapse">
                <thead>
                <tr>
                    <th className="border p-2">Question</th>
                    <th className="border p-2">Answer</th>
                    <th className="border p-2">Hint</th>
                    <th className="border p-2">Explanation</th>
                    <th className="border p-2">Actions</th>
                </tr>
                </thead>
                <tbody>
                {questions.map((question) => (
                    <tr key={question.id}>
                        <td className="border p-2">{question.test_question_text}</td>
                        <td className="border p-2">{question.test_question_answer}</td>
                        <td className="border p-2">{question.hint}</td>
                        <td className="border p-2">{question.explanation}</td>
                        <td className="border p-2 space-x-2">
                            <button
                                onClick={() => onEdit(question)}
                                className="bg-blue-500 text-white px-2 py-1 rounded"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(question.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default TestQuestionTable;
