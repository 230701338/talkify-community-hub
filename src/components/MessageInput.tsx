
import React, { KeyboardEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PaperclipIcon, SendIcon, SmileIcon } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ value, onChange, onSend, onTyping }) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    
    // Trigger typing effect if handler provided
    if (onTyping) {
      onTyping();
    }
  };

  return (
    <div className="border-t p-3 bg-white dark:bg-slate-950">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="shrink-0">
          <PaperclipIcon className="h-5 w-5" />
        </Button>
        
        <Input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1"
        />
        
        <Button variant="ghost" size="icon" className="shrink-0">
          <SmileIcon className="h-5 w-5" />
        </Button>
        
        <Button 
          onClick={onSend} 
          disabled={!value.trim()} 
          size="icon"
          className="bg-talkify-primary hover:bg-talkify-hover text-white shrink-0"
        >
          <SendIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
