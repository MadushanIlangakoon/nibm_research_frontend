import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';

const Chat = ({ lecture_id, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const channelRef = useRef(null);

    // Fetch existing messages
    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('lecture_id', lecture_id)
            .order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching chat messages:', error);
        } else {
            setMessages(data);
        }
    };

    // Scroll to the bottom on message update
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        fetchMessages();

        // Set up realtime subscription using supabase.channel API (v2)
        channelRef.current = supabase
            .channel(`chat_messages_channel_${lecture_id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `lecture_id=eq.${lecture_id}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                }
            )
            .subscribe();

        // Subscribe to UPDATE events for deletions
        channelRef.current.on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'chat_messages',
                filter: `lecture_id=eq.${lecture_id}`,
            },
            (payload) => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === payload.new.id ? { ...msg, message: payload.new.message } : msg
                    )
                );
            }
        );

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [lecture_id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending a message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const { error } = await supabase
            .from('chat_messages')
            .insert([
                {
                    lecture_id,
                    sender_id: user.id,
                    sender_name: user.name,
                    message: newMessage.trim(),
                },
            ]);
        if (error) {
            console.error('Error sending message:', error);
        } else {
            setNewMessage('');
        }
    };

    // Handle deleting a message (mark it as deleted)
    const deleteMessage = async (msgId) => {
        const { error } = await supabase
            .from('chat_messages')
            .update({ message: 'This message was deleted' })
            .eq('id', msgId);
        if (error) {
            console.error('Error deleting message:', error);
        } else {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === msgId ? { ...msg, message: 'This message was deleted' } : msg
                )
            );
        }
    };

    return (
        <div className="max-w-full mx-auto bg-white rounded-lg  p-1 mt-12">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Session Chat
            </h3>
            <div className="border border-gray-200 rounded-md p-4 mb-4 h-64 overflow-y-auto bg-gray-50">
                {messages.map((msg) => (
                    <div key={msg.id} className="flex justify-between items-center mb-2">
                        <div className="text-gray-800">
                            <span className="font-semibold">{msg.sender_name || msg.sender_id}:</span> {msg.message}
                        </div>
                        {/* Show delete button only if current user is sender and message is not deleted */}
                        {msg.sender_id === user.id && msg.message !== 'This message was deleted' && (
                            <button onClick={() => deleteMessage(msg.id)} className="text-sm text-red-500 hover:text-red-600 transition-colors">
                                Delete
                            </button>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-l-md p-3 mt-8 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 mt-8 rounded-r-md flex items-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.94 10.94a.75.75 0 010-1.88l12-5.25a.75.75 0 01.97.97l-5.25 12a.75.75 0 01-1.38-.01L2.94 10.94z" />
                    </svg>
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
