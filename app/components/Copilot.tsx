// app/components/Copilot.tsx
'use client';

import { useState, useContext, useRef, useEffect } from 'react';
import { useFormContext, FormData } from './FormContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Update the response type to include the new flag
type LLMResponse = {
  message: string;
  updates: Partial<FormData>;
  isSubmissionReady?: boolean;
};

export default function Copilot() {
  // --- Add these useState declarations ---
  const [input, setInput] = useState<string>('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // --- End of added states ---

  const [isCompleted, setIsCompleted] = useState<boolean>(false); // New state to disable chat after submission
  const { formData, updateForm } = useFormContext();
  const chatEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  // Effect to scroll to the bottom of the chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isCompleted) return;

    const userMessage: Message = { role: 'user', content: input };
    setConversation((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...conversation, userMessage], formData: formData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API Error: ${errorData.message || res.statusText}`);
      }

      const data: LLMResponse = await res.json();

      if (data.updates && Object.keys(data.updates).length > 0) {
        updateForm(data.updates);
      }
      
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: data.message || '...' },
      ]);

      // --- This is the new logic for auto-submission ---
      if (data.isSubmissionReady) {
        setIsCompleted(true); // Disable the chat input
        // Use a short delay to allow the user to read the final message
        setTimeout(() => {
            // Find the submit button by its ID and programmatically click it
            const submitButton = document.getElementById('agent-form-submit-button') as HTMLButtonElement | null;
            if (submitButton) {
                submitButton.click();
            } else {
                console.error("Could not find the form's submit button.");
            }
        }, 1500); // 1.5-second delay
      }

    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${err.message || 'Failed to get a response.'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // The JSX is mostly the same, but we will disable the input form when completed.
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100 shadow-2xl rounded-2xl border border-blue-200 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Your AI Copilot 🤖</h2>
      <div className="flex-grow overflow-y-auto pr-2 mb-4 space-y-4">
        {conversation.length === 0 && (
          <div className="text-center text-gray-500 italic mt-10">
            Start by telling me your name!
          </div>
        )}
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-xl shadow ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 p-2 bg-white rounded-lg shadow-inner border border-blue-100 mt-auto">
        <input
          type="text"
          className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800"
          placeholder={isCompleted ? "Thank you!" : isLoading ? "Please wait..." : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || isCompleted} // Disable if loading or if the process is complete
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1"
          disabled={isLoading || isCompleted} // Disable if loading or if the process is complete
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <>
              Send
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.105 2.188A.5.5 0 002.5 3v11.905c0 .546.7 1.054 1.144.75l10.134-6.08a.5.5 0 000-.84L3.644 2.438a.5.5 0 00-.539-.25z" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}