import Image from 'next/image';

export interface Message {
  persona: {
    name: string;
    avatar: string;
  };
  text: string;
}

const ChatMessage = ({ message }: { message: Message }) => {
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
      </div>
    </div>
  );
};

export default ChatMessage;
