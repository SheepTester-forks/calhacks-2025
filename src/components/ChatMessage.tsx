import Image from 'next/image';
import { ChatTurn } from '@/lib/types';

const ChatMessage = ({ message }: { message: ChatTurn }) => {
  return (
    <div className="flex items-start space-x-4 p-2">
      <Image
        src={message.persona.avatar}
        alt={message.persona.name}
        width={40}
        height={40}
        className="rounded-full"
      />
      <div>
        <p className="font-bold">{message.persona.name}</p>
        <p>{message.text}</p>
        {message.audioUrl && (
          <audio controls src={message.audioUrl} className="mt-2 w-full" />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;