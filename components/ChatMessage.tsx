
import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { GeminiIcon } from '../constants';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = message.parts.map(p => p.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (text: string) => {
    // @ts-ignore - marked is loaded via CDN
    const html = window.marked.parse(text);
    return { __html: html };
  };

  return (
    <div className={`flex gap-3 md:gap-4 p-4 lg:px-8 mb-2 max-w-4xl mx-auto w-full group animate-message`}>
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
            U
          </div>
        ) : (
          <GeminiIcon className="w-8 h-8 drop-shadow-md" />
        )}
      </div>
      
      <div className="flex-1 space-y-3 overflow-hidden">
        {message.parts.map((part, idx) => (
          <div key={idx} className="space-y-3">
            {part.inlineData && (
              <div className="rounded-xl overflow-hidden max-w-sm border border-[#3c4043] shadow-lg">
                <img 
                  src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                  alt="User uploaded content"
                  className="w-full object-cover"
                />
              </div>
            )}
            {part.text && (
              <div className="relative">
                <div 
                  className={`markdown-content text-sm md:text-base leading-relaxed text-[#e3e3e3]`}
                  dangerouslySetInnerHTML={renderContent(part.text)}
                />
                {isStreaming && idx === message.parts.length - 1 && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse align-middle rounded-full" />
                )}
              </div>
            )}
          </div>
        ))}

        {!isUser && !isStreaming && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2">
            <button 
              onClick={handleCopy}
              className="p-2 hover:bg-[#2a2b2d] rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {message.groundingSources && message.groundingSources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#3c4043]">
            <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Sources
            </h4>
            <div className="flex flex-wrap gap-2">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#1e1f20] hover:bg-[#2a2b2d] rounded-full border border-[#3c4043] transition-all flex items-center gap-2 max-w-xs text-xs"
                >
                  <span className="font-medium text-blue-400 truncate">{new URL(source.uri).hostname}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
