// app/components/Copilot.tsx
'use client';

import { useState, useContext, useRef, useEffect } from 'react';
// Import useFormContext for clean usage
import { useFormContext, FormData } from './FormContext'; // <-- Import FormData here

// Type for individual messages in the conversation
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Define the shape of the LLM response we expect
type LLMResponse = {
  message: string;
  updates: Partial<FormData>; // <-- Corrected this line
};

export default function Copilot() {
  const [input, setInput] = useState<string>('');
  const [conversation, setConversation] = useState<Message[]>([
    { role: 'assistant', content: '👋 Hi! I’m your AI assistant. Tell me a bit about yourself.' },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Use the custom useFormContext hook
  const { formData, updateForm } = useFormContext(); // <-- Use the custom hook

  // Ref for auto-scrolling chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the bottom of the chat when conversation updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user's message to conversation
    const userMessage: Message = { role: 'user', content: input };
    const newMessages: Message[] = [...conversation, userMessage];
    setConversation(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Fetch response from your Next.js API route
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }), // Send the whole conversation history
      });

      if (!res.ok) {
        // Read error details if the response is not OK
        const errorData = await res.json();
        throw new Error(`LLM API failed: ${errorData.error || res.statusText}`);
      }

      // Parse the JSON response directly. It should match LLMResponse type.
      const data: LLMResponse = await res.json();

      // Apply updates to the form data
      if (data.updates && Object.keys(data.updates).length > 0) {
        updateForm(data.updates);
      }

      // Add assistant's message to conversation
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: data.message || 'No message from assistant.' },
      ]);

    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      // Display a user-friendly error message in the chat
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Failed to get a response. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow-md rounded-xl mt-8">
      <h2 className="text-xl font-bold mb-4">🤖 AI Copilot</h2>

      {/* Chat messages display area */}
      <div className="space-y-2 mb-4 max-h-96 overflow-y-auto border p-2 rounded-md bg-gray-50">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${
              msg.role === 'assistant'
                ? 'bg-blue-100 text-blue-900 self-start mr-auto'
                : 'bg-gray-200 text-gray-800 self-end ml-auto'
            } max-w-[80%]`}
            style={{ wordWrap: 'break-word' }}
          >
            {msg.content}
          </div>
        ))}
        {/* Loading indicator */}
        {isLoading && (
          <div className="text-sm text-gray-500 animate-pulse mt-2">Assistant is typing...</div>
        )}
        {/* Empty div for auto-scrolling */}
        <div ref={chatEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors"
          disabled={isLoading}
        >
          Send
        </button>
      </form>

      {/* Display of extracted form data */}
      <div className="mt-6 text-sm text-gray-700 space-y-1 p-3 border rounded-md bg-gray-50">
        <h3 className="font-semibold text-base mb-2">Form Data Collected:</h3>
        <div><strong>Name:</strong> {formData.name || '—'}</div>
        <div><strong>Email:</strong> {formData.email || '—'}</div>
        <div><strong>LinkedIn:</strong> {formData.linkedin || '—'}</div>
        <div><strong>AI Idea:</strong> {formData.idea || '—'}</div>
      </div>
    </div>
  );
}