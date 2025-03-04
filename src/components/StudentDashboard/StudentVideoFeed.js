// client/src/components/StudentVideoFeed.js
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const StudentVideoFeed = () => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [recording, setRecording] = useState(false);

    // Function to start a 5-second recording, send it, then wait 5 seconds before the next recording.
    const startRecording = () => {
        if (!streamRef.current) return;

        const options = { mimeType: 'video/webm' };
        const mediaRecorder = new MediaRecorder(streamRef.current, options);
        let chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        mediaRecorder.onstop = async () => {
            // Combine the recorded chunks into a single Blob.
            const blob = new Blob(chunks, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('video', blob, 'clip.webm');
            // Optionally, add additional parameters:
            formData.append('gender', 'female');
            formData.append('stream', 'tech');
            formData.append('inference_interval', '5');

            try {
                const res = await axios.post('http://localhost:5001/inference/process_video', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                console.log("Video clip uploaded successfully:", res.data);
            } catch (error) {
                console.error("Error uploading video clip:", error);
            }
            // Wait for 5 seconds before starting the next recording.
            setTimeout(() => {
                startRecording();
            }, 5000);
        };

        // Start recording and set state.
        mediaRecorder.start();
        setRecording(true);

        // Stop recording after 5 seconds.
        setTimeout(() => {
            mediaRecorder.stop();
            setRecording(false);
        }, 5000);
    };

    useEffect(() => {
        async function initWebcam() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                // Start recording immediately after obtaining the stream.
                startRecording();
            } catch (err) {
                console.error("Error accessing webcam:", err);
            }
        }
        initWebcam();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div>
            <h3>Your Video Feed</h3>
            <video ref={videoRef} style={{ width: '400px' }} autoPlay muted />
            <p>{recording ? "Recording 5-second clip..." : "Waiting to record next clip..."}</p>
        </div>
    );
};

export default StudentVideoFeed;
