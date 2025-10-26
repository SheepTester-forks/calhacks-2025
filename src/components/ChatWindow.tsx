import ChatMessage from './ChatMessage';
import { ChatTurn } from '@/lib/types';

interface ChatWindowProps {
  chat: ChatTurn[] | null;
  isSimulating: boolean;
}

const ChatWindow = ({ chat, isSimulating }: ChatWindowProps) => {
  return (
    <div className="flex h-96 flex-col space-y-2 overflow-y-auto rounded bg-gray-100 p-4">
      {isSimulating && (!chat || chat.length === 0) && (
        <p className="text-center text-gray-500">
          Simulation in progress...
        </p>
      )}
      {!isSimulating && (!chat || chat.length === 0) && (
        <p className="text-center text-gray-500">
          Waiting for analysis to start simulation...
        </p>
      )}
      {chat?.map((turn, i) => (
        <ChatMessage key={i} message={turn} />
      ))}
    </div>
  );
};

export default ChatWindow;