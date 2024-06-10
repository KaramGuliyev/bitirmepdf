import { cn } from "@/lib/utils";
import { Message } from "ai/react";
import { Loader2 } from "lucide-react";
import React from "react";

type Props = {
  isLoading: boolean;
  messages: Message[];
};

// Функция для преобразования текста с **жирным** текстом
const renderTextWithBold = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const MessageList = ({ messages, isLoading }: Props) => {
  if (isLoading) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!messages) return <></>;

  return (
    <div id="message-container" className="flex flex-col gap-2 px-4 mb-1">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex", {
            "justify-end pl-10 my-1": message.role === "user",
            "justify-start pr-10 my-1": message.role === "assistant",
          })}
        >
          <div
            className={cn(
              "rounded-lg px-3 text-sm py-1.5 shadow-md ring-1 ring-gray-900/10",
              {
                "bg-blue-600 text-white": message.role === "user",
              }
            )}
          >
            {message.content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {renderTextWithBold(line)}
                <br />
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
