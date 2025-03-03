// client/src/components/LecturePage.js
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Peer from "simple-peer";
import io from "socket.io-client";
import TestQuestionTable from "./TestQuestionTable";
import EditTestQuestionModal from "./EditTestQuestionModal";
import TestQuestionnaire from "./TestQuestionnaire";
import PredictionGraph from "./PredictionGraph";

const LecturePage = () => {
    const { lectureId } = useParams();
    const navigate = useNavigate();
    const [lecture, setLecture] = useState(null);
    const [loading, setLoading] = useState(true);
    const [meetingStarted, setMeetingStarted] = useState(false);
    const [peers, setPeers] = useState([]);
    const [teacherStream, setTeacherStream] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [predictionHistory, setPredictionHistory] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const meetingContainerRef = useRef();
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [showTestQuiz, setShowTestQuiz] = useState(false);
    const [selectedLectureId, setSelectedLectureId] = useState(null);

    // Debug: log prediction history whenever it updates.
    useEffect(() => {
        console.log("Prediction history updated:", predictionHistory);
    }, [predictionHistory]);

    // Listen for fullscreen changes.
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const handleStartQuiz = () => {
        navigate(`/test_questionnaire/${lecture.id}`);
        setShowTestQuiz(true);
        setSelectedLectureId(lecture.id);
    };

    const handleEdit = (question) => {
        setEditingQuestion(question);
    };

    const handleModalClose = () => {
        setEditingQuestion(null);
    };

    const handleUpdate = (updatedQuestion) => {
        console.log("Updated question:", updatedQuestion);
    };

    useEffect(() => {
        if (teacherStream && userVideo.current && !isFullScreen) {
            userVideo.current.pause();
            userVideo.current.srcObject = teacherStream;
            userVideo.current.load();
            userVideo.current.play().catch((err) => console.error("Play error:", err));
        }
    }, [isFullScreen, teacherStream]);

    useEffect(() => {
        async function fetchLecture() {
            try {
                const res = await axios.get(`https://nibm-research-backend.onrender.com/api/lectures/${lectureId}`);
                setLecture(res.data);
            } catch (err) {
                console.error("Error fetching lecture details:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLecture();
    }, [lectureId]);

    // Meeting initialization (signaling for video call) and registering inference result listener.
    useEffect(() => {
        if (!meetingStarted || !lecture) return;

        // Connect to Node server on port 5000.
        socketRef.current = io.connect("https://nibm-research-backend.onrender.com");

        socketRef.current.on("connect", () => {
            console.log("Socket connected with id:", socketRef.current.id);
            // (Optional test)
            socketRef.current.emit("test_event", { test: "hello" });
        });

        socketRef.current.on("test_response", (data) => {
            console.log("Received test response:", data);
        });

        // Register inference_result listener immediately after connection.
        socketRef.current.on("inference_result", (data) => {
            console.log("Received inference result:", data);
            if (data.error) {
                console.error("Inference error:", data.error);
            } else {
                setPrediction(data.percentage);
                setPredictionHistory((prev) => [...prev, data.percentage]);
            }
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setTeacherStream(stream);
                if (userVideo.current) {
                    userVideo.current.pause();
                    userVideo.current.srcObject = stream;
                    userVideo.current.oncanplay = () => {
                        userVideo.current.play().catch((err) => console.error("Play error:", err));
                    };
                }
                socketRef.current.emit("join-room", lecture.video_call_url);

                socketRef.current.on("all-users", (users) => {
                    console.log("All users received:", users);
                    const peersArray = [];
                    users.forEach((userID) => {
                        const peer = createPeer(userID, socketRef.current.id, stream);
                        peersRef.current.push({ peerID: userID, peer });
                        peersArray.push(peer);
                    });
                    setPeers(peersArray);
                });

                socketRef.current.on("user-joined", (userID) => {
                    console.log("User joined:", userID);
                    const peer = addPeer(userID, stream);
                    peersRef.current.push({ peerID: userID, peer });
                    setPeers((existingPeers) => [...existingPeers, peer]);
                });

                socketRef.current.on("user-signal", (payload) => {
                    const item = peersRef.current.find((p) => p.peerID === payload.callerID);
                    if (item) {
                        item.peer.signal(payload.signal);
                    }
                });

                socketRef.current.on("receiving-returned-signal", (payload) => {
                    const item = peersRef.current.find((p) => p.peerID === payload.id);
                    if (item) {
                        item.peer.signal(payload.signal);
                    }
                });
            })
            .catch((err) => console.error("Error accessing user media:", err));

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (teacherStream) {
                teacherStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [meetingStarted, lecture]);

    // Stream frames from teacher's video to Node for inference.
    useEffect(() => {
        if (!meetingStarted || !userVideo.current || !socketRef.current) return;
        const intervalId = setInterval(() => {
            if (userVideo.current.videoWidth && userVideo.current.videoHeight) {
                const canvas = document.createElement("canvas");
                canvas.width = userVideo.current.videoWidth;
                canvas.height = userVideo.current.videoHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(userVideo.current, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL("image/jpeg", 0.5);
                console.log("Emitting inference_frame");
                socketRef.current.emit("inference_frame", { image: imageData });
            }
        }, 400); // ~20 fps
        return () => clearInterval(intervalId);
    }, [meetingStarted, userVideo, socketRef]);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream,
        });
        peer.on("signal", (signal) => {
            socketRef.current.emit("sending-signal", { userToSignal, callerID, signal });
        });
        return peer;
    }

    function addPeer(newUserID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream,
        });
        peer.on("signal", (signal) => {
            socketRef.current.emit("returning-signal", { signal, callerID: newUserID });
        });
        return peer;
    }

    const toggleAudio = () => {
        if (!teacherStream) return;
        teacherStream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsAudioMuted(!isAudioMuted);
    };

    const toggleVideo = () => {
        if (!teacherStream) return;
        teacherStream.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        setIsVideoMuted(!isVideoMuted);
    };

    const leaveMeeting = () => {
        if (socketRef.current) socketRef.current.disconnect();
        if (teacherStream) teacherStream.getTracks().forEach((track) => track.stop());
        setMeetingStarted(false);
        setIsFullScreen(false);
    };

    const handleFullScreen = () => {
        if (meetingContainerRef.current) {
            if (!document.fullscreenElement) {
                meetingContainerRef.current.requestFullscreen().catch((err) =>
                    console.error("Failed to enter fullscreen mode:", err)
                );
            } else {
                document.exitFullscreen().then(() => {
                    if (teacherStream && userVideo.current) {
                        userVideo.current.srcObject = teacherStream;
                        userVideo.current.load();
                        userVideo.current.play().catch((err) => console.error("Play error:", err));
                    }
                }).catch((err) =>
                    console.error("Failed to exit fullscreen mode:", err)
                );
            }
        }
    };

    if (loading) return <div>Loading lecture details...</div>;

    return (
        <div className="min-h-screen flex flex-col">
            {meetingStarted ? (
                <div
                    ref={meetingContainerRef}
                    className={`w-full ${isFullScreen ? "h-screen" : "h-[50vh]"} bg-black bg-opacity-70 flex relative`}
                >
                    <button
                        onClick={handleFullScreen}
                        className="absolute top-4 left-4 z-50 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded"
                    >
                        Full Screen
                    </button>
                    {isFullScreen ? (
                        <div className="w-full h-full relative">
                            <video
                                ref={userVideo}
                                className="w-full h-full object-cover"
                                autoPlay
                                playsInline
                                muted
                            />
                            <div className="absolute bottom-4 left-4 flex space-x-2">
                                <button
                                    onClick={toggleAudio}
                                    className="bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded"
                                >
                                    {isAudioMuted ? "Unmute Mic" : "Mute Mic"}
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    className="bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded"
                                >
                                    {isVideoMuted ? "Turn Video On" : "Turn Video Off"}
                                </button>
                            </div>
                            <button
                                onClick={leaveMeeting}
                                className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded"
                            >
                                Leave Meeting
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="w-2/5 p-4 relative">
                                <video
                                    ref={userVideo}
                                    className="w-full h-full object-cover rounded"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                <div className="absolute bottom-4 left-4 flex space-x-2">
                                    <button
                                        onClick={toggleAudio}
                                        className="bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded"
                                    >
                                        {isAudioMuted ? "Unmute Mic" : "Mute Mic"}
                                    </button>
                                    <button
                                        onClick={toggleVideo}
                                        className="bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded"
                                    >
                                        {isVideoMuted ? "Turn Video On" : "Turn Video Off"}
                                    </button>
                                </div>
                                <button
                                    onClick={leaveMeeting}
                                    className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded"
                                >
                                    Leave Meeting
                                </button>
                            </div>
                            <div className="w-3/5 p-4 overflow-auto">
                                <div className={`grid gap-4 ${peers.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                                    {peers.map((peer, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-900 rounded overflow-hidden"
                                            style={{ height: "calc(50vh - 2rem)" }}
                                        >
                                            <Video peer={peer} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="w-full h-[50vh] bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-4">
                    <h2 className="mb-4 text-3xl font-bold">{lecture.title}</h2>
                    <p className="mb-4 text-center max-w-2xl">{lecture.description}</p>
                    <button
                        onClick={() => setMeetingStarted(true)}
                        className="px-6 py-3 bg-blue-600 border border-blue-500 hover:bg-blue-600 text-white rounded shadow-xl"
                    >
                        Start Meeting
                    </button>
                </div>
            )}

            <div className="p-6 bg-gray-100">
                <h2 className="text-3xl font-bold text-gray-800">{lecture.title}</h2>
                <p className="mt-2 text-gray-700">{lecture.description}</p>
                {prediction && (
                    <div className="mt-4">
                        <p className="text-xl text-gray-800">
                            Comprehension: <span className="font-bold">{prediction}%</span>
                        </p>
                        <PredictionGraph data={predictionHistory} />
                    </div>
                )}
            </div>
            {showTestQuiz ? (
                <TestQuestionnaire lectureId={selectedLectureId} />
            ) : (
                <div className="bg-gray-100 p-6">
                    <h2 className="text-3xl font-bold mb-4">Test Questions Overview</h2>
                    <button
                        onClick={handleStartQuiz}
                        className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition duration-200"
                    >
                        Start Quiz
                    </button>
                </div>
            )}
            {lecture && (
                <TestQuestionTable
                    lectureId={lecture.id}
                    onEdit={(question) => {
                        console.log("Edit question:", question);
                        handleEdit(question);
                    }}
                />
            )}
            {editingQuestion && (
                <EditTestQuestionModal
                    question={editingQuestion}
                    onClose={handleModalClose}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

const Video = ({ peer }) => {
    const videoRef = useRef();
    useEffect(() => {
        peer.on("stream", stream => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(err => console.error("Play error:", err));
            }
        });
    }, [peer]);

    return (
        <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
        />
    );
};

export default LecturePage;
