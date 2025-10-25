'use client';

import { useState, useEffect } from 'react';
import ChatMessage, { Message } from './ChatMessage';
import { startChatSimulation, ChatTurn } from '@/services/janitor';
import { AdAnalysis } from '@/services/reka';

interface ChatWindowProps {
  analysis: AdAnalysis | null;
}

const ChatWindow = ({ analysis }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (analysis && !isSimulating) {
      setIsSimulating(true);
      startChatSimulation(analysis, (turn: ChatTurn) => {
        setMessages((prev) => [...prev, turn]);
      });
    }
  }, [analysis, isSimulating]);

  return (
    <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto flex flex-col space-y-2">
      {messages.length === 0 && !isSimulating && (
        <p className="text-center text-gray-500">
          Waiting for analysis to start simulation...
        </p>
      )}
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} />
      ))}
      {isSimulating && messages.length < 3 && (
         <div className="text-center text-gray-500">Simulation in progress...</div>
      )}
    </div>
  );
};

export default ChatWindow;