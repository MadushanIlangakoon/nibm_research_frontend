import React, {useState, useEffect, useRef} from "react";
import {useParams, useNavigate} from "react-router-dom";
import axios from "axios";
import Peer from "simple-peer";
import io from "socket.io-client";
import TestQuestionTable from "./TestQuestionTable";
import EditTestQuestionModal from "./EditTestQuestionModal";
import TestQuestionnaire from "./TestQuestionnaire";
import PredictionGraph from "./PredictionGraph";
import {useAuth} from "../../context/AuthContext";
import {supabase} from "../../supabaseClient";

// Vertical bar from red(0%) to green(100%).
const PredictionBar = ({percentage}) => {
    const clamped = Math.min(Math.max(percentage, 0), 100);
    const red = Math.round(255 * (1 - clamped / 100));
    const green = Math.round(255 * (clamped / 100));
    const backgroundColor = `rgb(${red}, ${green}, 0)`;
    return (
        <div className="w-4 h-24 bg-gray-200 flex items-end" title={`${clamped.toFixed(2)}%`}>
            <div style={{height: `${clamped}%`, backgroundColor}} className="w-full"/>
        </div>
    );
};

const LecturePage = () => {
    const {lectureId} = useParams();
    const navigate = useNavigate();
    const {user, role} = useAuth(); // "teacher" or "student"

    const [lecture, setLecture] = useState(null);
    const [loading, setLoading] = useState(true);
    const [meetingStarted, setMeetingStarted] = useState(false);
    const [peers, setPeers] = useState([]);
    const [localStream, setLocalStream] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showTestQuiz, setShowTestQuiz] = useState(false);
    const [selectedLectureId, setSelectedLectureId] = useState(null);

    const [combinedPrediction, setCombinedPrediction] = useState(null);
    const [combinedPredictionHistory, setCombinedPredictionHistory] = useState([]);
    const [perStudentPredictions, setPerStudentPredictions] = useState({});
    const [students, setStudents] = useState([]);
    const [peerNames, setPeerNames] = useState({});
    const [expectedStudents, setExpectedStudents] = useState([]);
    const [showDrawer, setShowDrawer] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);
    const meetingContainerRef = useRef();

    // Teacher meeting start time reference (used for snapshots)
    const meetingStartTimeRef = useRef(null);

    // Per-student statistics (also holds prediction snapshots)
    const studentStatsRef = useRef({});

    // Fetch expected students
    useEffect(() => {
        const fetchExpectedStudents = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/students");
                setExpectedStudents(response.data);
            } catch (error) {
                console.error("Error fetching expected students:", error);
            }
        };
        fetchExpectedStudents();
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const handleStartQuiz = () => {
        navigate(`/test_questionnaire/${lecture.id}`);
        setShowTestQuiz(true);
    };

    const handleEdit = (question) => setEditingQuestion(question);
    const handleModalClose = () => setEditingQuestion(null);
    const handleUpdate = (updatedQuestion) => console.log("Updated question:", updatedQuestion);

    // If not meeting, clear local video.
    useEffect(() => {
        if (!meetingStarted && userVideo.current) {
            userVideo.current.pause();
            userVideo.current.srcObject = null;
        }
    }, [meetingStarted]);

    //
    // Gracefully leave the meeting (both teacher & student)
    //
    const handleLeave = async () => {
        if (socketRef.current) {
            socketRef.current.emit("leave-room");
            peersRef.current.forEach((peerObj) => {
                if (peerObj.peer && !peerObj.peer.destroyed) {
                    peerObj.peer.destroy();
                }
            });
            peersRef.current = [];
            setPeers([]);
            await new Promise((resolve) => setTimeout(resolve, 500));
            socketRef.current.disconnect();
        }
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }
        if (userVideo.current) {
            userVideo.current.pause();
            userVideo.current.srcObject = null;
        }
        setMeetingStarted(false);
    };

    //
    // Log & send stats at end (includes prediction snapshots)
    //
    const logAndSendStats = async (meetingEndTime) => {
        console.log("==== Meeting Statistics Per Student ====");
        let totalGaze = 0;
        let studentCount = 0;
        for (const [studentId, stats] of Object.entries(studentStatsRef.current)) {
            const endTime = stats.endTime ? stats.endTime : meetingEndTime;
            const totalDuration = (endTime - stats.joinTime) / 1000;
            const activeTime = stats.activeFrames / 3;
            const avgPrediction = stats.predictionCount > 0 ? (stats.predictionSum / stats.predictionCount) : 0;
            const gazeDuration = stats.gazeFrames / 3;
            totalGaze += gazeDuration;
            studentCount += 1;
            const snapshots = stats.predictionSnapshots || [];
            const studentName = peerNames[studentId] || studentId;
            console.log(
                `Student ${studentName}: Joined=${new Date(stats.joinTime).toLocaleTimeString()}, Ended=${new Date(endTime).toLocaleTimeString()}, Duration=${totalDuration.toFixed(2)}s, ActiveTime=${activeTime.toFixed(2)}s, AvgPred=${avgPrediction.toFixed(2)}, Highest=${stats.highest_prediction?.toFixed(2) || "N/A"}, Lowest=${stats.lowest_prediction?.toFixed(2) || "N/A"}, Gaze=${gazeDuration.toFixed(2)}s`,
                "Snapshots:", snapshots
            );
            const payload = {
                lecture_id: lecture.id,
                student_id: studentId,
                join_time: new Date(stats.joinTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                total_duration: totalDuration,
                active_time: activeTime,
                avg_prediction: avgPrediction,
                highest_prediction: stats.highest_prediction || 0,
                lowest_prediction: stats.lowest_prediction || 0,
                gaze_duration: gazeDuration,
                prediction_time_series: snapshots,
            };

            try {
                await axios.post("http://localhost:5000/api/lecture_statistics", payload);
            } catch (err) {
                console.error("Error sending stats for student", studentId, err);
            }
        }

        const averageGazeDuration = studentCount > 0 ? totalGaze / studentCount : 0;
        try {
            await axios.patch("http://localhost:5000/api/lectures/update_average_gaze", {
                lecture_id: lecture.id,
                average_gaze_duration: averageGazeDuration,
            });
            console.log("Updated lecture average gaze duration:", averageGazeDuration);
        } catch (err) {
            console.error("Error updating lecture average gaze duration:", err);
        }
    };

    //
    // End meeting: teacher ends meeting, logs stats, then leaves.
    //
    const handleEndMeeting = async () => {
        const ended_at = Date.now();
        try {
            await axios.post("http://localhost:5000/api/lectures/end", {
                lecture_id: lecture.id,
                ended_at: new Date(ended_at).toISOString(),
            });
            setLecture({...lecture, ended_at: new Date(ended_at).toISOString()});
            if (socketRef.current) {
                socketRef.current.emit("meeting-ended", {ended_at: new Date(ended_at).toISOString()});
            }
            if (role === "teacher") {
                await logAndSendStats(ended_at);
            }
            handleLeave();
        } catch (error) {
            console.error("Error ending the lecture:", error);
        }
    };

    //
    // Reattach local stream when exiting fullscreen
    //
    useEffect(() => {
        if (localStream && userVideo.current && !isFullScreen) {
            userVideo.current.pause();
            userVideo.current.srcObject = localStream;
            userVideo.current.load();
            userVideo.current.play().catch((err) => console.error("Play error:", err));
        }
    }, [isFullScreen, localStream]);

    //
    // Fetch lecture details
    //
    useEffect(() => {
        async function fetchLecture() {
            try {
                const res = await axios.get(`http://localhost:5000/api/lectures/${lectureId}`);
                setLecture(res.data);
            } catch (err) {
                console.error("Error fetching lecture details:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchLecture();
    }, [lectureId]);

    //
    // Main meeting logic
    //
    useEffect(() => {
        if (!meetingStarted || !lecture) return;

        // For teacher, record meeting start time
        if (role === "teacher") {
            meetingStartTimeRef.current = Date.now();
        }

        socketRef.current = io.connect("http://localhost:5000", {transports: ["websocket"]});

        socketRef.current.on("connect", () => {
            console.log("Socket connected with id:", socketRef.current.id);
            socketRef.current.emit("test_event", {test: "hello"});
        });

        socketRef.current.on("meeting-ended", (data) => {
            console.log("Meeting ended event received", data);
            setLecture((prev) => ({...prev, ended_at: data.ended_at}));
            handleLeave();
        });

        socketRef.current.on("inference_result", (data) => {
            console.log("Received inference result:", data);
            if (!data.error) {
                if (data.combined !== undefined) {
                    setCombinedPrediction(data.combined);
                    setCombinedPredictionHistory((prev) => [...prev, data.combined.percentage]);
                }
                if (data.perStudent) {
                    setPerStudentPredictions((prev) => {
                        const updated = {...prev};
                        Object.keys(data.perStudent).forEach((studentID) => {
                            const pred = data.perStudent[studentID];
                            const stats = studentStatsRef.current[studentID];
                            if (stats) {
                                stats.activeFrames += 1;
                                stats.predictionSum += pred.percentage;
                                stats.predictionCount += 1;
                                if (pred.isLooking) {
                                    stats.gazeFrames += 1;
                                }
                                if (stats.highest_prediction == null || pred.percentage > stats.highest_prediction) {
                                    stats.highest_prediction = pred.percentage;
                                }
                                if (stats.lowest_prediction == null || pred.percentage < stats.lowest_prediction) {
                                    stats.lowest_prediction = pred.percentage;
                                }
                                // Teacher takes snapshots every 30 frames
                                stats.frameCount = (stats.frameCount || 0) + 1;
                                if (stats.frameCount % 30 === 0) {
                                    const now = Date.now();
                                    const elapsedSec = (now - meetingStartTimeRef.current) / 1000;
                                    stats.predictionSnapshots = stats.predictionSnapshots || [];
                                    stats.predictionSnapshots.push({
                                        time: elapsedSec,
                                        prediction: parseFloat(pred.percentage) || 0,
                                    });
                                }
                            }
                            if (updated[studentID]) {
                                updated[studentID].history.push(pred.percentage);
                                updated[studentID].latest = pred;
                            } else {
                                updated[studentID] = {history: [pred.percentage], latest: pred};
                            }
                        });
                        return updated;
                    });
                }
            }
        });

        // Access camera & mic
        navigator.mediaDevices
            .getUserMedia({video: true, audio: true})
            .then((stream) => {
                setLocalStream(stream);
                if (userVideo.current) {
                    userVideo.current.pause();
                    userVideo.current.srcObject = stream;
                    userVideo.current.oncanplay = () => {
                        userVideo.current.play().catch((err) => console.error("Play error:", err));
                    };
                }

                // IMPORTANT: For teacher, include the stream in the payload so that students can see teacher's feed.
                if (role === "student") {
                    const payload = {
                        room: lecture.video_call_url,
                        student: {
                            id: user.id,
                            name: user.name,
                            gender: user.gender,
                            stream: user.stream,
                        },
                    };
                    console.log("Student joining with payload:", payload);
                    socketRef.current.emit("join-room", payload);
                } else {
                    // For teacher, include the local stream in the payload
                    const payload = {room: lecture.video_call_url, teacher: true, stream: stream};
                    console.log("Teacher joining with payload:", payload);
                    socketRef.current.emit("join-room", payload);
                }

                socketRef.current.on("all-users", (users) => {
                    console.log("All users received:", users);
                    const peersArray = [];
                    users.forEach((userID) => {
                        const peer = createPeer(userID, socketRef.current.id, stream);
                        const videoRef = React.createRef();
                        console.log("Creating peer connection to:", userID);
                        const peerObj = {peerID: userID, studentID: null, peer, videoRef};
                        peersRef.current.push(peerObj);
                        peersArray.push(peerObj);
                    });
                    setPeers(peersArray);
                });

                socketRef.current.on("student-joined", async (studentDetails) => {
                    try {
                        await axios.post(`http://localhost:5000/api/lectures/${lecture.id}/participants`, {
                            student_id: studentDetails.id,
                        });
                    } catch (err) {
                        console.error("Error adding participant:", err);
                    }
                    console.log("Received student-joined event:", studentDetails);
                    setStudents((prev) => {
                        const exists = prev.some((s) => s.id === studentDetails.id);
                        return exists
                            ? prev.map((s) => (s.id === studentDetails.id ? studentDetails : s))
                            : [...prev, studentDetails];
                    });
                    setPeerNames((prev) => ({...prev, [studentDetails.id]: studentDetails.name}));

                    if (!studentStatsRef.current[studentDetails.id]) {
                        studentStatsRef.current[studentDetails.id] = {
                            joinTime: Date.now(),
                            activeFrames: 0,
                            predictionSum: 0,
                            predictionCount: 0,
                            gazeFrames: 0,
                            highest_prediction: undefined,
                            lowest_prediction: undefined,
                            endTime: null,
                            frameCount: 0,
                            predictionSnapshots: [],
                        };
                    }

                    const existingPeerIndex = peersRef.current.findIndex(
                        (peerObj) => peerObj.studentID === studentDetails.id
                    );
                    if (existingPeerIndex !== -1) {
                        const oldPeerObj = peersRef.current[existingPeerIndex];
                        oldPeerObj.peer.destroy();
                        peersRef.current.splice(existingPeerIndex, 1);
                        setPeers((prev) => prev.filter((peerObj) => peerObj.studentID !== studentDetails.id));
                        console.log("Removed stale peer for", studentDetails.name);
                    }

                    if (studentDetails.socketID && stream) {
                        const peer = createPeer(studentDetails.socketID, socketRef.current.id, stream);
                        const videoRef = React.createRef();
                        console.log("Creating peer connection for:", studentDetails.socketID);
                        const newPeerObj = {
                            peerID: studentDetails.socketID,
                            studentID: studentDetails.id,
                            peer,
                            videoRef,
                            name: studentDetails.name,
                            gender: studentDetails.gender,
                            stream: studentDetails.stream,
                        };
                        peersRef.current.push(newPeerObj);
                        setPeers((prev) => [...prev, newPeerObj]);
                    }
                });

                socketRef.current.on("user-disconnected", (socketID) => {
                    console.log("User disconnected event received for socket:", socketID);
                    setTimeout(() => {
                        const index = peersRef.current.findIndex((peerObj) => peerObj.peerID === socketID);
                        if (index !== -1) {
                            const removedPeer = peersRef.current[index];
                            if (removedPeer.videoRef.current) {
                                removedPeer.videoRef.current.pause();
                                removedPeer.videoRef.current.srcObject = null;
                            }
                            removedPeer.peer.destroy();
                            peersRef.current.splice(index, 1);
                            setPeers((prev) => prev.filter((p) => p.peerID !== socketID));
                            if (removedPeer.studentID) {
                                if (studentStatsRef.current[removedPeer.studentID]) {
                                    studentStatsRef.current[removedPeer.studentID].endTime = Date.now();
                                }
                                setStudents((prev) =>
                                    prev.filter((student) => student.id !== removedPeer.studentID)
                                );
                            }
                        }
                    }, 100);
                });

                socketRef.current.on("user-joined", (userID) => {
                    console.log("User joined event received:", userID);
                    const peer = addPeer(userID, stream);
                    const videoRef = React.createRef();
                    console.log("Creating peer connection for (non-initiator):", userID);
                    const peerObj = {peerID: userID, studentID: null, peer, videoRef};
                    peersRef.current.push(peerObj);
                    setPeers((prev) => [...prev, peerObj]);
                });

                socketRef.current.on("user-signal", (payload) => {
                    console.log("Received user-signal:", payload);
                    let item = peersRef.current.find((p) => p.peerID === payload.callerID);
                    if (!item && role === "student") {
                        console.log("Student creating peer connection on-demand for:", payload.callerID);
                        const peer = addPeer(payload.callerID, stream);
                        const videoRef = React.createRef();
                        item = {peerID: payload.callerID, studentID: null, peer, videoRef};
                        peersRef.current.push(item);
                        setPeers((prev) => [...prev, item]);
                    }
                    if (item && !item.peer.destroyed) {
                        const pc = item.peer._pc;
                        if (payload.signal.type === "answer" && pc && pc.signalingState === "stable") {
                            console.log("Skipping answer signal; connection already stable");
                            return;
                        }
                        try {
                            item.peer.signal(payload.signal);
                        } catch (err) {
                            console.error("Error signaling peer:", err);
                        }
                    }
                });

                socketRef.current.on("receiving-returned-signal", (payload) => {
                    console.log("Received returning signal:", payload);
                    const item = peersRef.current.find((p) => p.peerID === payload.id);
                    if (item && !item.peer.destroyed) {
                        const pc = item.peer._pc;
                        if (payload.signal.type === "answer" && pc && pc.signalingState === "stable") {
                            console.log("Skipping returned answer signal; connection already stable");
                            return;
                        }
                        try {
                            item.peer.signal(payload.signal);
                        } catch (err) {
                            console.error("Error signaling returned signal:", err);
                        }
                    }
                });
            })
            .catch((err) => console.error("Error accessing user media:", err));

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (localStream) {
                localStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [meetingStarted, lecture, role]);

    //
    // Teacher sends frames ~5 FPS for inference.
    //
    useEffect(() => {
        if (!meetingStarted || role !== "teacher" || !socketRef.current) return;
        const intervalId = setInterval(() => {
            peersRef.current.forEach(({videoRef, peerID, studentID, name, gender, stream}) => {
                const videoEl = videoRef.current;
                if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
                    const canvas = document.createElement("canvas");
                    canvas.width = videoEl.videoWidth;
                    canvas.height = videoEl.videoHeight;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                    const imageData = canvas.toDataURL("image/jpeg", 0.8);
                    const idToUse = studentID || peerID;
                    socketRef.current.emit("inference_frame", {
                        image: imageData,
                        studentID: idToUse,
                        gender: gender,
                        stream: stream,
                        studentName: name || peerNames[idToUse],
                    });
                }
            });
        }, 200);
        return () => clearInterval(intervalId);
    }, [meetingStarted, role, peerNames]);

    // Create Peer (initiator)
    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({initiator: true, trickle: true, stream});
        peer.on("signal", (signal) => {
            console.log(`Peer (initiator) signaling to ${userToSignal}:`, signal);
            socketRef.current.emit("sending-signal", {userToSignal, callerID, signal});
        });
        peer.on("stream", (remoteStream) => {
            console.log("Received remote stream from", userToSignal);
        });
        peer.on("error", (err) => {
            if (err.message.toLowerCase().includes("abort") || err.message.toLowerCase().includes("closed")) {
                console.warn("Peer error ignored:", err.message);
            } else {
                console.error("Peer error:", err);
            }
        });
        return peer;
    }

    // Add Peer (non-initiator)
    function addPeer(newUserID, stream) {
        const peer = new Peer({initiator: false, trickle: true, stream});
        peer.on("signal", (signal) => {
            console.log(`Peer (non-initiator) signaling to ${newUserID}:`, signal);
            socketRef.current.emit("returning-signal", {signal, callerID: newUserID});
        });
        peer.on("stream", (remoteStream) => {
            console.log("Received remote stream from", newUserID);
        });
        peer.on("error", (err) => {
            if (err.message.toLowerCase().includes("abort") || err.message.toLowerCase().includes("closed")) {
                console.warn("Peer error ignored:", err.message);
            } else {
                console.error("Peer error:", err);
            }
        });
        return peer;
    }

    const filteredPeers =
        role === "teacher"
            ? peers.filter((peerObj) => peerObj.peerID !== socketRef.current?.id)
            : peers;

    if (loading) {
        return <div>Loading lecture details...</div>;
    }

    const attentiveCount = Object.keys(perStudentPredictions).filter(
        (studentID) => perStudentPredictions[studentID].latest?.isLooking
    ).length;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {meetingStarted ? (
                <div
                    ref={meetingContainerRef}
                    className={`w-full flex flex-col md:flex-row bg-black bg-opacity-80 relative ${isFullScreen ? "h-screen" : "h-[50vh]"}`}
                >
                    {/* Local feed */}
                    <div className="w-full md:w-[50%] p-2 relative flex items-center justify-center">
                        <div className="w-full h-full bg-gray-900 rounded overflow-hidden relative">
                            <video ref={userVideo} className="w-full h-full object-cover" autoPlay playsInline muted/>
                            <div
                                className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                                {user.name}
                            </div>
                            <div className="absolute bottom-2 right-2 flex space-x-2">
                                <button
                                    onClick={() => {
                                        localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
                                        setIsAudioMuted((prev) => !prev);
                                    }}
                                    className="bg-gray-800 bg-opacity-70 text-white px-2 py-1 rounded text-xs"
                                >
                                    {isAudioMuted ? "Unmute" : "Mute"}
                                </button>
                                <button
                                    onClick={() => {
                                        localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
                                        setIsVideoMuted((prev) => !prev);
                                    }}
                                    className="bg-gray-800 bg-opacity-70 text-white px-2 py-1 rounded text-xs"
                                >
                                    {isVideoMuted ? "Video On" : "Video Off"}
                                </button>
                                <button onClick={handleLeave}
                                        className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                                    Leave
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Remote feeds */}
                    <div className="w-full md:w-[50%] p-2 flex items-center justify-center">
                        {filteredPeers.length > 0 ? (
                            filteredPeers.map((peerObj, index) => {
                                let label = "Teacher/Student";
                                let percValue = 0;
                                if (role === "teacher") {
                                    const persistentID = peerObj.studentID || peerObj.peerID;
                                    const studentName = peerObj.name || peerNames[persistentID] || "Student";
                                    const studentPred = perStudentPredictions[persistentID];
                                    if (studentPred && studentPred.latest && typeof studentPred.latest.percentage !== "undefined") {
                                        const rawPerc = studentPred.latest.percentage;
                                        percValue = parseFloat(rawPerc);
                                        label = `${studentName} (${!isNaN(percValue) ? percValue.toFixed(2) : "N/A"}%)`;
                                    } else {
                                        label = studentName;
                                    }
                                } else {
                                    label = "Teacher";
                                }
                                return (
                                    <div key={index}
                                         className="w-full h-full bg-gray-900 rounded overflow-hidden flex flex-col">
                                        <Video peer={peerObj.peer} videoRef={peerObj.videoRef} label={label}
                                               isRemote={true} predictionPercentage={percValue} role={role}/>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-white">No other participants</div>
                        )}
                    </div>

                    {/* Drawer toggle */}
                    {role === "teacher" && (
                        <button
                            onClick={() => setShowDrawer(!showDrawer)}
                            className="absolute top-4 right-4 bg-gray-800 bg-opacity-70 p-2 rounded focus:outline-none z-50"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    )}

                    {/* Drawer content */}
                    {role === "teacher" && showDrawer && (
                        <div
                            className="absolute right-0 top-0 h-full w-64 bg-white shadow z-50 transform transition-transform duration-300">
                            <div className="p-4 h-full overflow-y-auto relative">
                                <button onClick={() => setShowDrawer(false)}
                                        className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 focus:outline-none">
                                    ✕
                                </button>
                                {combinedPrediction && (
                                    <div className="mb-4">
                                        <p className="text-lg text-gray-800">
                                            Combined Comprehension: <span
                                            className="font-bold">{combinedPrediction.percentage}%</span>
                                        </p>
                                        <PredictionGraph data={combinedPredictionHistory}/>
                                    </div>
                                )}
                                {students.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold mb-1">Screen Looking</h3>
                                        <p className="text-gray-700">
                                            {attentiveCount} / {students.length}
                                        </p>
                                    </div>
                                )}
                                {lecture && (
                                    <div className="p-4 bg-gray-100 rounded">
                                        <h3 className="text-lg font-bold mb-2">Attendance</h3>
                                        <div className="mb-2">
                                            <h4 className="text-sm font-semibold">Expected Students</h4>
                                            <ul className="list-disc ml-4">
                                                {expectedStudents && expectedStudents.length > 0 ? (
                                                    expectedStudents.map((student, idx) => (
                                                        <li key={idx} className="text-sm">
                                                            {student.name} (ID: {student.id})
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-sm">No expected students found.</li>
                                                )}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold">Attendees</h4>
                                            <ul className="list-disc ml-4">
                                                {students && students.length > 0 ? (
                                                    students.map((student, idx) => (
                                                        <li key={idx} className="text-sm">
                                                            {student.name} (ID: {student.id})
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-sm">No attendees yet.</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className="w-full h-[50vh] bg-black bg-opacity-70 flex flex-col items-center justify-center text-white p-4">
                    <h2 className="mb-4 text-3xl font-bold">{lecture?.title}</h2>
                    <p className="mb-4 text-center max-w-2xl">{lecture?.description}</p>
                    {lecture?.ended_at ? (
                        <p className="text-xl">This meeting has ended.</p>
                    ) : (
                        <button
                            onClick={() => setMeetingStarted(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-xl hover:bg-blue-700 transition duration-200"
                        >
                            Start Meeting
                        </button>
                    )}
                </div>
            )}

            {/* Lecture details */}
            <div className="p-6 bg-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{lecture?.title}</h2>
                    <p className="mt-2 text-gray-700">{lecture?.description}</p>
                </div>
                {role === "teacher" && lecture && !lecture.ended_at && (
                    <button
                        onClick={handleEndMeeting}
                        className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                        End Meeting
                    </button>
                )}
            </div>

            {role === "teacher" && lecture && (
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

            {showTestQuiz ? (
                <TestQuestionnaire lectureId={selectedLectureId}/>
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
        </div>
    );
};

const Video = ({peer, videoRef, label, isRemote, predictionPercentage, role}) => {
    useEffect(() => {
        peer.on("stream", (stream) => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch((err) => console.error("Play error:", err));
            }
        });
    }, [peer, videoRef]);

    return (
        <div className="relative">
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                {...(isRemote ? {} : {muted: true})}
            />
            {role === "teacher" &&(
                <div className="absolute bottom-20  left-2 flex items-center space-x-2">

                    {typeof predictionPercentage === "number" && (
                        <PredictionBar percentage={predictionPercentage}/>
                    )}

                    <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs mt-14">
      {label}
    </span>

                </div>
            )}
            {role === "student" &&(
                <div className="absolute bottom-20  left-2 flex items-center space-x-2">

                    <span className="bg-black bg-opacity-60 text-white px-2 py-2 rounded text-xs -mt-10">
      {label}
    </span>

                </div>
            )}
        </div>
    );
};

export default LecturePage;
