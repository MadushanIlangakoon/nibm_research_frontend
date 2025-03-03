import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactWebcam from 'react-webcam';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const TestQuestionnaire = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Store the initial lectureId so that it remains stable
    const { lectureId } = useParams();

    // Countdown before test starts (for neutral pose recording)
    const [preCountdown, setPreCountdown] = useState(5);
    // Fetched test questions
    const [questions, setQuestions] = useState([]);
    // Test question states
    const [currentIndex, setCurrentIndex] = useState(0);
    const [questionTimer, setQuestionTimer] = useState(10);
    const [progress, setProgress] = useState(0);
    const [studentAnswer, setStudentAnswer] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [submitDisabled, setSubmitDisabled] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const [testFinished, setTestFinished] = useState(false);

    // Media stream & recording refs
    const [userMediaStream, setUserMediaStream] = useState(null);
    const webcamRef = useRef(null);

    // Refs for neutral (pre-test) recording
    const neutralRecorderRef = useRef(null);
    const neutralChunksRef = useRef([]);
    const neutralVideoBlobRef = useRef(null);

    // Refs for per-question recording
    const currentQuestionRecorderRef = useRef(null);
    const currentQuestionChunksRef = useRef([]);
    const questionVideoBlobsRef = useRef([]); // Array to hold each question's video blob

    // Ref for storing metadata for each question video
    const questionMetadataRef = useRef([]);

    // Timer ref for question countdown
    const timerRef = useRef(null);

    console.log("TestQuestionnaire received lectureId:", lectureId);


    // 1. Fetch test questions once both user and the stable lectureId are available.
    // Store the initial lectureId in a ref so that it remains stable.
    useEffect(() => {
        console.log("Inside fetchQuestions effect. user:", user, "lectureId:", lectureId);
        const fetchQuestions = async () => {
            try {
                const res = await axios.get('https://nibm-research-backend.onrender.com/api/test_questions', {
                    params: { lectures_id: lectureId }, // using the key your backend expects
                });
                console.log("Fetched test questions:", res.data);
                setQuestions(res.data);
            } catch (error) {
                console.error("Error fetching test questions:", error);
            }
        };
        if (user && lectureId) {
            console.log("Fetching test questions with lectureId:", lectureId, "and user:", user);
            fetchQuestions();
        } else {
            console.warn("Not fetching test questions: either user or lectureId is not defined.");
        }
    }, [user, lectureId]);

    // 2. Start neutral recording as soon as the userMediaStream is ready.
    useEffect(() => {
        if (userMediaStream) {
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
    }, [userMediaStream]);

    // 3. Handle the 5-second pre-test countdown.
    useEffect(() => {
        if (preCountdown > 0) {
            const timer = setTimeout(() => {
                console.log('PreCountdown:', preCountdown - 1);
                setPreCountdown(preCountdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [preCountdown]);

    // 4. When preCountdown reaches 0, stop neutral recording and start test.
    useEffect(() => {
        if (preCountdown === 0 && !testStarted) {
            console.log('Pre-test countdown finished. Stopping neutral recording and starting test.');
            if (neutralRecorderRef.current && neutralRecorderRef.current.state !== 'inactive') {
                neutralRecorderRef.current.stop();
            }
            setTestStarted(true);
        }
    }, [preCountdown, testStarted]);

    // 5. When test starts, begin recording the first test question.
    useEffect(() => {
        if (testStarted) {
            startQuestionRecording();
        }
    }, [testStarted]);

    // Function: Start per-question recording.
    const startQuestionRecording = () => {
        if (!userMediaStream) {
            console.warn('User media stream not available for question recording');
            return;
        }
        console.log('Starting recording for test question', currentIndex);
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
            console.log('Test question recording started.');
        } catch (err) {
            console.error('Error starting test question MediaRecorder:', err);
        }
    };

    // Function: Stop current question recording and store the blob.
    const stopQuestionRecording = () => {
        return new Promise((resolve) => {
            if (currentQuestionRecorderRef.current && currentQuestionRecorderRef.current.state !== 'inactive') {
                currentQuestionRecorderRef.current.onstop = () => {
                    const blob = new Blob(currentQuestionChunksRef.current, { type: 'video/webm' });
                    questionVideoBlobsRef.current.push(blob);
                    console.log('Recorded test question blob created:', blob.size, 'bytes');
                    resolve();
                };
                currentQuestionRecorderRef.current.stop();
            } else {
                resolve();
            }
        });
    };

    // 6. Per-question timer and progression.
    useEffect(() => {
        if (!testStarted || testFinished) return;
        if (questionTimer > 0) {
            const timerId = setTimeout(() => {
                setQuestionTimer((prevTime) => {
                    const newTime = prevTime - 1;
                    setProgress(((10 - newTime) / 10) * 100);
                    return newTime;
                });
            }, 1000);
            return () => clearTimeout(timerId);
        } else {
            console.log('Test question timer reached zero.');
            if (!hasSubmitted) {
                console.log('Auto-submitting as question timed out.');
                handleSubmit(true);
            }
            moveToNextQuestion();
        }
    }, [questionTimer, testStarted, testFinished]);

    // 7. Move to the next test question (or finish test).
    const moveToNextQuestion = async () => {
        console.log('Moving to next test question');
        await stopQuestionRecording();
        setQuestionTimer(10);
        setProgress(0);
        setStudentAnswer('');
        setHasSubmitted(false);
        setSubmitDisabled(false);
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex((prevIndex) => prevIndex + 1);
            startQuestionRecording();
        } else {
            console.log('Test finished. Finishing last test question recording and uploading videos.');
            setTestFinished(true);
            await stopQuestionRecording();
            await uploadVideos();
        }
    };

    // 8. Submit the current test question's answer and store its metadata.
    const handleSubmit = async (timedOut = false) => {
        if (hasSubmitted) return;
        console.log('Submitting answer for test question', currentIndex, 'timedOut:', timedOut);
        setHasSubmitted(true);
        setSubmitDisabled(true);
        clearTimeout(timerRef.current);
        const currentQuestion = questions[currentIndex];
        if (!currentQuestion) {
            console.error('No current test question available.');
            return;
        }
        const responseTime = timedOut ? 10 : 10 - questionTimer;
        const finalAnswer = timedOut || studentAnswer.trim() === '' ? 'NotAnswered' : studentAnswer;
        const status = timedOut || studentAnswer.trim() === '' ? 'NotAnswered' : 'Answered';
        const normalizedCorrect = currentQuestion.test_question_answer.trim().toLowerCase();
        const normalizedAnswer = finalAnswer.trim().toLowerCase();
        const isCorrect = !timedOut && normalizedAnswer === normalizedCorrect;
        const metadata = {
            student_id: user.auth_id || user.id,
            lecture_id: lectureId,
            question_id: currentQuestion.id,
            is_correct: isCorrect,
            response_time: responseTime,
            timestamp: new Date().toISOString(),
            details: finalAnswer,
        };
        questionMetadataRef.current.push(metadata);
        const payload = {
            student_id: user.auth_id || user.id,
            lecture_id: lectureId,
            question_id: currentQuestion.id,
            student_answer: finalAnswer,
            is_correct: isCorrect,
            status,
            response_time: responseTime,
        };
        try {
            await axios.post('https://nibm-research-backend.onrender.com/api/test_answers', payload);
            console.log('Test answer submitted for question', currentQuestion.id, 'with status', status);
        } catch (error) {
            console.error('Error submitting test answer:', error);
        }
    };

    // 9. Allow submitting by pressing Enter.
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !submitDisabled) {
            e.preventDefault();
            if (studentAnswer.trim() !== '') {
                handleSubmit(false);
            }
        }
    };

    // 10. When test finishes, ensure current recording is stopped.
    useEffect(() => {
        if (testFinished) {
            console.log('Test finished. Ensuring recordings are stopped.');
            stopQuestionRecording();
        }
    }, [testFinished]);

    // 11. Upload videos and metadata to backend.
    const uploadVideos = async () => {
        console.log('Uploading test videos...');
        if (!neutralVideoBlobRef.current) {
            console.error('Neutral video blob not available.');
            return;
        }
        const formData = new FormData();
        formData.append('neutral_video', neutralVideoBlobRef.current, 'neutral.webm');
        questionVideoBlobsRef.current.forEach((blob, index) => {
            formData.append('question_video', blob, `question_${index + 1}.webm`);
        });
        formData.append('question_metadata', JSON.stringify(questionMetadataRef.current));
        try {
            const res = await axios.post('http://localhost:5001/test_questions/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log('Test videos and metadata uploaded successfully:', res.data);
            questionVideoBlobsRef.current = [];
            questionMetadataRef.current = [];
        } catch (uploadError) {
            console.error('Error uploading test videos:', uploadError);
        }
    };

    // 12. Always show the webcam preview.
    const renderWebcamPreview = () => (
        <div className="max-w-2xl mx-auto mb-4 relative">
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
            {preCountdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <h2 className="text-4xl text-white font-bold">Starting in {preCountdown}...</h2>
                </div>
            )}
        </div>
    );

    if (!user) {
        return <div>Please log in to take the test questionnaire.</div>;
    }

    if (testFinished) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
                <h2 className="text-3xl font-bold mb-4">Test Finished!</h2>
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
    console.log('Render debug:', {
        testStarted,
        questionsLength: questions.length,
        currentIndex,
        currentQuestion,
    });

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {renderWebcamPreview()}
            {preCountdown === 0 && currentQuestion && (
                <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
                    <div className="flex justify-between items-center mb-4">
                        <div className="w-full h-2 bg-gray-300 rounded">
                            <div className="h-full bg-blue-500 rounded" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="ml-4 text-lg font-bold">{questionTimer}s</div>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{currentQuestion.test_question_text}</h2>
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

export default TestQuestionnaire;
