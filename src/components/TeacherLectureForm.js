// TeacherLectureForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import moment from 'moment-timezone';
import { useNavigate } from 'react-router-dom';

const TeacherLectureForm = ({ user, course_id }) => {
    const navigate = useNavigate();
    const [lectureForm, setLectureForm] = useState({
        title: '',
        description: '',
        scheduled_at: '',
    });
    const [message, setMessage] = useState('');

    const createLecture = async (e) => {
        e.preventDefault();

        if (!user || !user.id) {
            setMessage("User is not authenticated.");
            return;
        }
        if (!course_id) {
            setMessage("Course ID is missing.");
            return;
        }

        // Lookup teacher's integer ID using the user's UUID
        const { data: teacherRow, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (teacherError || !teacherRow) {
            setMessage("Unable to find teacher info.");
            return;
        }

        const teacherId = teacherRow.id;

        // Generate a meeting room URL using our custom video call page
        const roomName = `meeting-${Date.now()}`;
        const video_call_url = `http://localhost:3000/meeting/${roomName}`;

        // Convert scheduled_at to Sri Lankan time.
        const scheduled_at_srilanka = moment
            .tz(lectureForm.scheduled_at, "Asia/Colombo")
            .format();

        const payload = {
            course_id,
            teacher_id: teacherId,
            title: lectureForm.title,
            description: lectureForm.description,
            scheduled_at: scheduled_at_srilanka,
            video_call_url,
        };

        console.log("Creating lecture with payload:", payload);

        try {
            const res = await axios.post('https://nibm-research-backend.onrender.com/api/lectures', payload);
            console.log("Lecture created response:", res.data);
            setMessage('Lecture scheduled/started successfully!');
            setLectureForm({ title: '', description: '', scheduled_at: '' });
        } catch (error) {
            console.error("Error scheduling lecture:", error.response || error);
            setMessage(error.response?.data?.error || 'Error scheduling lecture');
        }
    };

    return (
        <div className="p-4 border rounded">
            <h3 className="text-xl font-bold mb-4">Schedule/Start Lecture</h3>
            <form onSubmit={createLecture} className="space-y-4">
                <input
                    type="text"
                    placeholder="Lecture Title"
                    className="border p-2 w-full"
                    value={lectureForm.title}
                    onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                    required
                />
                <textarea
                    placeholder="Description"
                    className="border p-2 w-full"
                    value={lectureForm.description}
                    onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                />
                <input
                    type="datetime-local"
                    className="border p-2 w-full"
                    value={lectureForm.scheduled_at}
                    onChange={(e) => setLectureForm({ ...lectureForm, scheduled_at: e.target.value })}
                    required
                />
                <button type="submit" className="bg-green-500 text-white p-2">
                    Create Lecture
                </button>
            </form>
            {message && <p className="mt-2 text-green-600">{message}</p>}
        </div>
    );
};

export default TeacherLectureForm;
