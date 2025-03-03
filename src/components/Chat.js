import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Chat = ({ lecture_id, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/chat/${lecture_id}`);
            setMessages(res.data);
        } catch (error) {
            console.error('Error fetching messages');
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [lecture_id]);

    const sendMessage = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/chat', {
                lecture_id,
                sender_id: user.id,
                message: newMessage,
            });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            console.error('Error sending message');
        }
    };

    return (
        <div className="border p-4 mt-4">
            <h3 className="font-bold mb-2">Chat</h3>
            <div className="h-40 overflow-y-scroll border p-2 mb-2">
                {messages.map((msg) => (
                    <div key={msg.id} className="mb-1">
                        <strong>{msg.sender_id}:</strong> {msg.message}
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage} className="flex">
                <input
                    type="text"
                    className="border p-2 flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    required
                />
                <button type="submit" className="bg-blue-500 text-white p-2 ml-2">Send</button>
            </form>
        </div>
    );
};

export default Chat;
