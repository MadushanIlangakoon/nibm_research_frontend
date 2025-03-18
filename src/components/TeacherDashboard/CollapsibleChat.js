import React, { useState } from 'react';
import Chat from './Chat';
import { motion, AnimatePresence } from 'framer-motion';

const CollapsibleChat = ({ lecture_id, user }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="flex items-center space-x-2 bg-blue-700 hover:bg-gray-800 text-white px-4 py-2 rounded shadow transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>Chat</span>
                </button>
            )}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, translateY: 50 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0, translateY: 50 }}
                        transition={{ duration: 0.3 }}
                        className="w-96 h-[500px] bg-white rounded-lg shadow-lg overflow-hidden fixed bottom-4 right-4"
                    >
                        <div className="sticky top-0 z-20 flex items-center justify-between bg-gray-800 text-white px-4 py-2 h-12">
                            <span className="font-bold">Live Chat</span>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="hover:text-gray-300 focus:outline-none"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 h-full overflow-y-auto">
                            <Chat lecture_id={lecture_id} user={user} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CollapsibleChat;
