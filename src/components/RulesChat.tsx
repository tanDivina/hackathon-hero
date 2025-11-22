import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Sparkles, Bot } from 'lucide-react';
import { CyberCard } from './CyberCard';
import { databaseService } from '../services/database';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RulesChatProps {
  projectId?: string;
  onAskQuestion: (question: string, rulesContext: string) => Promise<string>;
  isPro: boolean;
  onUpgradeClick: () => void;
}

const SUGGESTION_PROMPTS = [
  'What are the judging criteria?',
  'Who are the sponsors?',
  'What is the deadline?',
  'Are there any tech stack requirements?'
];

export const RulesChat: React.FC<RulesChatProps> = ({
  projectId,
  onAskQuestion,
  isPro,
  onUpgradeClick
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rulesContext, setRulesContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId && isPro) {
      loadRulesContext();
      loadChatHistory();
    } else {
      setMessages([]);
    }
  }, [projectId, isPro]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRulesContext = async () => {
    if (!projectId) return;
    const rulesData = await databaseService.getRulesData(projectId);
    if (rulesData) {
      const context = `
FULL HACKATHON RULES DOCUMENT:
${rulesData.rules_text}

PARSED KEY INFORMATION:
- Deadline: ${rulesData.deadline}
- Sponsors: ${rulesData.sponsors.join(', ')}
- Judging Criteria: ${rulesData.judging_criteria.join(', ')}
- Prizes: ${(rulesData.prizes || []).join(', ')}
      `.trim();
      setRulesContext(context);
    }
  };

  const loadChatHistory = async () => {
    if (!projectId) return;
    const history = await databaseService.getChatHistory(projectId);
    setMessages(history.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at)
    })));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isPro || !projectId || !rulesContext) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      await databaseService.saveChatMessage(projectId, 'user', userMessage.content);

      const response = await onAskQuestion(userMessage.content, rulesContext);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      await databaseService.saveChatMessage(projectId, 'assistant', response);
    } catch (error) {
      console.error('Failed to get response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <CyberCard
      icon={<MessageCircle size={32} strokeWidth={1.5} />}
      title="Rules Chat"
      description="Ask questions about the hackathon rules and get instant answers."
      badge={isPro ? 'PRO' : undefined}
    >
      {!isPro ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-yellow/20 to-accent-cyan/20 border border-accent-yellow/30 px-4 py-2 mb-4">
            <Sparkles size={20} className="text-accent-yellow" />
            <span className="text-sm font-mono text-gray-300">PRO FEATURE</span>
          </div>
          <p className="text-gray-400 mb-4">
            Chat with an AI about your hackathon rules to get strategic insights and clarifications.
          </p>
          <button
            onClick={onUpgradeClick}
            className="bg-accent-yellow text-black px-6 py-2 font-mono font-bold hover:bg-yellow-300 transition-colors"
          >
            UPGRADE TO PRO
          </button>
        </div>
      ) : !projectId ? (
        <div className="text-center py-8 text-gray-500 font-mono">
          Select or create a project to start chatting
        </div>
      ) : !rulesContext ? (
        <div className="text-center py-8 text-gray-500 font-mono">
          Parse hackathon rules first to enable chat
        </div>
      ) : (
        <div className="relative flex flex-col h-[500px] bg-gradient-to-b from-black/40 to-black/20 border border-accent-cyan/20 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.1)]">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="text-center mb-4">
                  <Bot className="mx-auto mb-3 text-accent-cyan" size={48} strokeWidth={1.5} />
                  <p className="text-gray-400 text-sm">Ask anything about your hackathon rules</p>
                </div>
                <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  {SUGGESTION_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(prompt)}
                      className="group bg-black/60 border border-gray-800 hover:border-accent-cyan/50 px-4 py-3 rounded-lg text-left transition-all hover:shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                    >
                      <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                        {prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center">
                        <Bot size={18} className="text-accent-cyan" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-accent-cyan/20 border border-accent-cyan/40 rounded-tr-sm'
                          : 'bg-gray-900/60 border border-gray-800 rounded-tl-sm'
                      }`}
                    >
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-yellow/20 border border-accent-yellow/40 flex items-center justify-center">
                        <span className="text-accent-yellow text-xs font-bold">YOU</span>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center">
                      <Bot size={18} className="text-accent-cyan" />
                    </div>
                    <div className="bg-gray-900/60 border border-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse"></span>
                        <span className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-800/50">
            <div className="relative flex items-center gap-2 bg-black/80 border border-gray-700 rounded-full px-4 py-2.5 shadow-lg hover:border-accent-cyan/50 focus-within:border-accent-cyan focus-within:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about deadlines, criteria, sponsors..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-gray-200 text-sm placeholder:text-gray-600 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-green hover:bg-accent-green/80 border border-accent-green flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(50,255,150,0.6)]"
              >
                <Send size={16} className="text-black" />
              </button>
            </div>
          </div>
        </div>
      )}
    </CyberCard>
  );
};
