// client/src/components/GeneralQuestionsInfo.js
import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import {useAuth} from "../../context/AuthContext";

const GeneralQuestionsInfo = () => {
    const navigate = useNavigate();
    const {user, loading, role} = useAuth()

    useEffect(() => {
        if (!loading) {
            if (!user) {

                navigate('/');
            } else if (role && role === 'teacher') {

                navigate('/teacher-dashboard');
            }
        }
    }, [user, loading, navigate, role]);

    const handleStartQuiz = () => {
        // Navigate to the questionnaire page
        navigate('/questionnaire');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
            <h2 className="text-3xl font-bold mb-4">General Questions Overview</h2>
            <p className="mb-6 text-lg">
                Please read the instructions carefully before starting the quiz.
                This questionnaire covers various topics relevant to your stream.
            </p>
            <button
                onClick={handleStartQuiz}
                className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition duration-200"
            >
                Start Quiz
            </button>
        </div>
    );
};

export default GeneralQuestionsInfo;
