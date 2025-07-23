// app/components/Copilot.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext, FormData } from './FormContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type LLMResponse = {
  message: string;
  updates: Partial<FormData>;
  isSubmissionReady?: boolean; // Flag for when the form is ready to be submitted
};

export default function Copilot() {
  const [input, setInput] = useState<string>('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false); // Tracks if the submission process is complete
  const { formData, updateForm } = useFormContext();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the latest message whenever conversation updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isCompleted) return; // Prevent empty messages, double-sends, or sending after completion

    const userMessage: Message = { role: 'user', content: input };
    setConversation((prev) => [...prev, userMessage]); // Add user message to conversation
    setInput(''); // Clear input field
    setIsLoading(true); // Show loading indicator

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...conversation, userMessage], formData: formData }), // Send full conversation and current form data
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API Error: ${errorData.message || res.statusText}`);
      }

      const data: LLMResponse = await res.json();

      // Update the frontend form with data from the AI
      if (data.updates && Object.keys(data.updates).length > 0) {
        updateForm(data.updates);
      }
      
      // Add AI's response to conversation
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: data.message || '...' },
      ]);

      // If AI indicates submission readiness, trigger the form submit button
      if (data.isSubmissionReady) {
        setIsCompleted(true); // Mark conversation as complete
        setTimeout(() => {
            const submitButton = document.getElementById('agent-form-submit-button') as HTMLButtonElement | null;
            if (submitButton) {
                submitButton.click(); // Programmatically click the form's submit button
                updateForm({ name: '', email: '', linkedin: '', idea: '' }); // Clear all form fields
                setConversation([]); // Clear chat history
                setIsCompleted(false); // Reset completion state to allow new interactions
            } else {
                console.error("Could not find the form's submit button to trigger submission.");
            }
        }, 1500); // Small delay for better UX
      }

    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${err.message || 'Failed to get a response from the AI.'}` },
      ]);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100 shadow-2xl rounded-2xl border border-blue-200 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Your AI Agent Assistant 🤖</h2>
      <div className="flex-grow overflow-y-auto pr-2 mb-4 space-y-4">
        {conversation.length === 0 && (
          // Initial prompt when no conversation has started
          <div className="text-center text-gray-500 italic mt-10">
            Hi! I'm here to help you submit your AI agent idea. Let's start with the basics - what's your name?
          </div>
        )}
        {/* Map through conversation messages and display them */}
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
                  ? 'bg-blue-500 text-white rounded-br-none' // User messages
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200' // Assistant messages
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} /> {/* Div for auto-scrolling to bottom */}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 p-2 bg-white rounded-lg shadow-inner border border-blue-100 mt-auto">
        <input
          type="text"
          className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-800"
          placeholder={isCompleted ? "Idea submitted! Start new chat..." : isLoading ? "Thinking..." : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || isCompleted} // Disable input while loading or after submission
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1"
          disabled={isLoading || isCompleted} // Disable button while loading or after submission
        >
          {isLoading ? (
            // Loading spinner
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
            // Send icon
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