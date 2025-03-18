import React, { useState, useEffect, useRef } from 'react';
import ReactWebcam from 'react-webcam';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const Questionnaire = () => {
    const { user, loading, role } = useAuth();
    const navigate = useNavigate();

    // Determine if we should record video based on user's personalization flag.
    const shouldRecord = user?.personalization === true;

    // Countdown before quiz starts (for neutral pose recording)
    const [preCountdown, setPreCountdown] = useState(5);
    // Fetched questions
    const [questions, setQuestions] = useState([]);
    // Quiz / question states
    const [currentIndex, setCurrentIndex] = useState(0);
    const [questionTimer, setQuestionTimer] = useState(10);
    const [progress, setProgress] = useState(0);
    const [studentAnswer, setStudentAnswer] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);

    // Media stream & recording refs (only used if shouldRecord is true)
    const [userMediaStream, setUserMediaStream] = useState(null);
    const webcamRef = useRef(null);

    // Refs for neutral (pre-quiz) recording
    const neutralRecorderRef = useRef(null);
    const neutralChunksRef = useRef([]);
    const neutralVideoBlobRef = useRef(null);

    // Refs for per-question recording
    const questionVideoBlobsRef = useRef([]); // Array to hold each question's video blob
    const currentQuestionRecorderRef = useRef(null);
    const currentQuestionChunksRef = useRef([]);

    // Ref for storing metadata for each question video
    const questionMetadataRef = useRef([]);

    // Timer ref for question countdown
    const timerRef = useRef(null);


    useEffect(() => {
        if (!loading) {
            if (!user) {

                navigate('/');
            } else if (role && role === 'teacher') {

                navigate('/teacher-dashboard');
            }
        }
    }, [user, loading, navigate, role]);

    // 1. Fetch questions once the user is available
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const stream = user?.stream || 'general';
                const res = await axios.get(`${window.baseUrl}/api/general_questions`, {
                    params: { stream },
                });
                console.log('Fetched questions:', res.data);
                setQuestions(res.data);
            } catch (error) {
                console.error('Error fetching questions:', error);
            }
        };
        if (user) {
            fetchQuestions();
        }
    }, [user]);

    // 2. Start neutral recording as soon as the userMediaStream is ready (only if shouldRecord)
    useEffect(() => {
        if (shouldRecord && userMediaStream) {
            console.log('Starting neutral recording...');
            try {
                const neutralRecorder = new MediaRecorder(userMediaStream, { mimeType: 'video/webm' });
                neutralRecorderRef.current = neutralRecorder;
                neutralRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        neutralChunksRef.current.push(event.data);
                    }
                };
                neutralRecorder.onstop = () => {
                    const neutralBlob = new Blob(neutralChunksRef.current, { type: 'video/webm' });
                    neutralVideoBlobRef.current = neutralBlob;
                    console.log('Neutral video blob created:', neutralBlob.size, 'bytes');
                };
                neutralRecorder.start();
                console.log('Neutral recording started.');
            } catch (err) {
                console.error('Error starting neutral MediaRecorder:', err);
            }
        }
    }, [userMediaStream, shouldRecord]);

    // 3. Handle the 5-second pre-quiz countdown
    useEffect(() => {
        if (preCountdown > 0) {
            const timer = setTimeout(() => {
                console.log('PreCountdown:', preCountdown - 1);
                setPreCountdown(preCountdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [preCountdown]);

    // 4. When preCountdown reaches 0, stop neutral recording (if recording) and start quiz
    useEffect(() => {
        if (preCountdown === 0 && !quizStarted) {
            console.log('Pre-quiz countdown finished.');
            if (shouldRecord && neutralRecorderRef.current && neutralRecorderRef.current.state !== 'inactive') {
                console.log('Stopping neutral recording.');
                neutralRecorderRef.current.stop();
            }
            setQuizStarted(true);
        }
    }, [preCountdown, quizStarted, shouldRecord]);

    // 5. When quiz starts, start recording the first question (if recording)
    useEffect(() => {
        if (quizStarted && shouldRecord) {
            startQuestionRecording();
        }
    }, [quizStarted, shouldRecord]);

    // 6. Start per-question recording.
    const startQuestionRecording = () => {
        if (!shouldRecord) return;
        if (!userMediaStream) {
            console.warn('User media stream not available for question recording');
            return;
        }
        console.log('Starting recording for question', currentIndex);
        try {
            const recorder = new MediaRecorder(userMediaStream, { mimeType: 'video/webm' });
            currentQuestionRecorderRef.current = recorder;
            currentQuestionChunksRef.current = [];
            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    currentQuestionChunksRef.current.push(event.data);
                }
            };
            recorder.start();
            console.log('Question recording started.');
        } catch (err) {
            console.error('Error starting question MediaRecorder:', err);
        }
    };

    // Stop current question recording and store the blob
    const stopQuestionRecording = () => {
        return new Promise((resolve) => {
            if (shouldRecord && currentQuestionRecorderRef.current && currentQuestionRecorderRef.current.state !== 'inactive') {
                currentQuestionRecorderRef.current.onstop = () => {
                    const blob = new Blob(currentQuestionChunksRef.current, { type: 'video/webm' });
                    questionVideoBlobsRef.current.push(blob);
                    console.log('Recorded question blob created:', blob.size, 'bytes');
                    resolve();
                };
                currentQuestionRecorderRef.current.stop();
            } else {
                resolve();
            }
        });
    };

    // 7. Per-question timer and progression
    useEffect(() => {
        if (!quizStarted || quizFinished) return;
        if (questionTimer > 0) {
            timerRef.current = setTimeout(() => {
                setQuestionTimer(questionTimer - 1);
                setProgress(((10 - (questionTimer - 1)) / 10) * 100);
            }, 1000);
        } else {
            console.log('Question timer reached zero.');
            if (!hasSubmitted) {
                console.log('Auto-submitting as question timed out.');
                handleSubmit(true);
            }
            moveToNextQuestion();
        }
        return () => clearTimeout(timerRef.current);
    }, [questionTimer, quizStarted, quizFinished, hasSubmitted]);

    // 8. Move to the next question (or finish quiz)
    const moveToNextQuestion = async () => {
        console.log('Moving to next question');
        await stopQuestionRecording();
        setQuestionTimer(10);
        setProgress(0);
        setStudentAnswer('');
        setHasSubmitted(false);
        setSubmitDisabled(false);
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(currentIndex + 1);
            if (shouldRecord) startQuestionRecording();
        } else {
            console.log('Quiz finished.');
            setQuizFinished(true);
            await stopQuestionRecording();
            if (shouldRecord) await uploadVideos();
            await updateGeneralQuestionsFlag();
        }
    };

    // 9. Submit the current question's answer and store its metadata
    const handleSubmit = async (timedOut = false) => {
        if (hasSubmitted) return;
        console.log('Submitting answer for question', currentIndex, 'timedOut:', timedOut);
        setHasSubmitted(true);
        setSubmitDisabled(true);
        clearTimeout(timerRef.current);
        const currentQuestion = questions[currentIndex];
        const responseTime = timedOut ? 10 : 10 - questionTimer;
        const finalAnswer = timedOut || studentAnswer.trim() === '' ? 'NotAnswered' : studentAnswer;
        const status = timedOut || studentAnswer.trim() === '' ? 'NotAnswered' : 'Answered';
        const normalizedCorrect = currentQuestion.correct_answer.trim().toLowerCase();
        const normalizedAnswer = finalAnswer.trim().toLowerCase();
        const isCorrect = !timedOut && normalizedAnswer === normalizedCorrect;
        // Store metadata for this question video
        const metadata = {
            student_id: user.id || user.auth_id,
            gender: user.gender || 'unknown',
            question_id: currentQuestion.id,
            stream: user?.stream || 'general',
            is_correct: isCorrect,
            response_time: responseTime,
            timestamp: responseTime,
            details: finalAnswer,
        };
        questionMetadataRef.current.push(metadata);
        // Optionally submit the answer to your API
        const payload = {
            student_id: user.id || user.auth_id,
            question_id: currentQuestion.id,
            student_answer: finalAnswer,
            is_correct: isCorrect,
            status,
            response_time: responseTime,
        };
        try {
            await axios.post(`${window.baseUrl}/api/general_answers`, payload);
            console.log('Answer submitted for question', currentQuestion.id, 'with status', status);
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    };

    // 10. Allow submitting by pressing Enter
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !submitDisabled) {
            e.preventDefault();
            if (studentAnswer.trim() !== '') {
                handleSubmit(false);
            }
        }
    };

    // 11. When quiz finishes, ensure current recording is stopped.
    useEffect(() => {
        if (quizFinished) {
            console.log('Quiz finished. Ensuring recordings are stopped.');
            stopQuestionRecording();
        }
    }, [quizFinished]);

    // 12. Upload videos and metadata to backend.
    const uploadVideos = async () => {
        console.log('Uploading videos...');
        if (!neutralVideoBlobRef.current) {
            console.error('Neutral video blob not available.');
            return;
        }
        const formDataObj = new FormData();
        formDataObj.append('neutral_video', neutralVideoBlobRef.current, 'neutral.webm');
        questionVideoBlobsRef.current.forEach((blob, index) => {
            formDataObj.append('question_video', blob, `question_${index + 1}.webm`);
        });
        formDataObj.append('question_metadata', JSON.stringify(questionMetadataRef.current));
        try {
            const res = await axios.post(`${window.mlUrl}/general_questions/upload`, formDataObj, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Videos and metadata uploaded successfully:', res.data);
            questionVideoBlobsRef.current = [];
            questionMetadataRef.current = [];
        } catch (uploadError) {
            console.error('Error uploading videos:', uploadError);
        }
    };

    // 13. Update the student's did_general_questions flag to true
    const updateGeneralQuestionsFlag = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .update({ did_general_questions: true })
                .eq('auth_id', user.auth_id || user.id);
            if (error) {
                console.error('Error updating general questions flag:', error);
            } else {
                console.log('General questions flag updated:', data);
            }
        } catch (err) {
            console.error('Error updating general questions flag:', err);
        }
    };

    // 14. Render webcam preview and countdown.
    // If shouldRecord is false, we simply show a placeholder container with the countdown.
    const renderWebcamPreview = () => {
        return (
            <div className="max-w-2xl mx-auto mb-4 relative">
                {shouldRecord ? (
                    <ReactWebcam
                        audio={true}
                        ref={webcamRef}
                        onUserMedia={(stream) => {
                            console.log('Got user media stream:', stream);
                            setUserMediaStream(stream);
                        }}
                        videoConstraints={{ facingMode: 'user' }}
                        className="w-full rounded shadow"
                    />
                ) : (
                    <div className="w-full h-64 bg-gray-200 rounded shadow"></div>
                )}
                {preCountdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <h2 className="text-4xl text-white font-bold">Starting in {preCountdown}...</h2>
                    </div>
                )}
            </div>
        );
    };

    if (!user) {
        return <div>Please log in to take the questionnaire.</div>;
    }

    if (quizFinished) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
                <h2 className="text-3xl font-bold mb-4">Quiz Finished!</h2>
                <p>Your responses have been submitted.</p>
                <button
                    onClick={() => navigate('/student-dashboard')}
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {renderWebcamPreview()}
            {preCountdown === 0 && (
                <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
                    <div className="flex justify-between items-center mb-4">
                        <div className="w-full h-2 bg-gray-300 rounded">
                            <div className="h-full bg-blue-500 rounded" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="ml-4 text-lg font-bold">{questionTimer}s</div>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{currentQuestion.question_text}</h2>
                    {currentQuestion.hint && (
                        <p className="text-sm text-gray-600 mb-4">Hint: {currentQuestion.hint}</p>
                    )}
                    <input
                        type="text"
                        value={studentAnswer}
                        onChange={(e) => setStudentAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Your Answer"
                        className="w-full p-3 border rounded mb-4"
                        disabled={submitDisabled}
                    />
                    <button
                        onClick={() => {
                            if (studentAnswer.trim() !== '' && !submitDisabled) {
                                handleSubmit(false);
                            }
                        }}
                        className={`w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-700 transition ${submitDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={submitDisabled || studentAnswer.trim() === ''}
                    >
                        Submit Answer
                    </button>
                </div>
            )}
        </div>
    );
};

export default Questionnaire;
