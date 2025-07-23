// app/components/AgentForm.tsx
'use client';

import { useFormContext } from './FormContext';
import { useState } from 'react';

export default function AgentForm() {
  const { formData, updateForm, resetForm } = useFormContext();
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- NEW: Function to check if all required fields are filled ---
  const areAllFieldsFilled = () => {
    // Check if all string fields are non-empty after trimming whitespace
    return (
      formData.name &&
      formData.email &&
      formData.linkedin &&
      formData.idea
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('idle'); // Reset status before a new submission attempt

    // Optional: Add a client-side check here as well, though the button will be disabled
    if (!areAllFieldsFilled()) {
        console.warn("Attempted submission with incomplete fields.");
        return; // Prevent submission if fields are not filled
    }

    console.log('Form Submitted Automatically by Copilot or Manually!', formData);

    try {
      // Simulate an API call for form submission
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      setSubmissionStatus('success'); 

      setTimeout(() => {
        resetForm(); 
        window.location.reload(); 
      }, 2000); 

    } catch (error) {
      console.error('Form submission error:', error);
      setSubmissionStatus('error');
    }
  };

  return (
    <form className="space-y-6 p-8 max-w-lg mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 font-sans transform transition-all duration-300 hover:shadow-3xl">
      <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-6 tracking-tight">Build Your AI Agent</h2>
      
      <div className="relative">
        <input
          className="w-full peer border border-gray-200 p-4 rounded-xl text-gray-800 bg-gray-50 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg shadow-sm"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => updateForm({ name: e.target.value })}
          readOnly
          name="name"
          id="name-field"
        />
        <label htmlFor="name-field" className="absolute left-4 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-focus:-top-3.5 peer-focus:text-purple-600 peer-focus:text-sm cursor-text">
          Name
        </label>
      </div>

      <div className="relative">
        <input
          className="w-full peer border border-gray-200 p-4 rounded-xl text-gray-800 bg-gray-50 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg shadow-sm"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => updateForm({ email: e.target.value })}
          readOnly
          name="email"
          id="email-field"
        />
        <label htmlFor="email-field" className="absolute left-4 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-focus:-top-3.5 peer-focus:text-purple-600 peer-focus:text-sm cursor-text">
          Email
        </label>
      </div>
      
      <div className="relative">
        <input
          className="w-full peer border border-gray-200 p-4 rounded-xl text-gray-800 bg-gray-50 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg shadow-sm"
          placeholder="LinkedIn URL"
          value={formData.linkedin}
          onChange={(e) => updateForm({ linkedin: e.target.value })}
          readOnly
          name="linkedin"
          id="linkedin-field"
        />
        <label htmlFor="linkedin-field" className="absolute left-4 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-focus:-top-3.5 peer-focus:text-purple-600 peer-focus:text-sm cursor-text">
          LinkedIn URL
        </label>
      </div>

      <div className="relative">
        <textarea
          className="w-full peer border border-gray-200 p-4 rounded-xl text-gray-800 bg-gray-50 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-y shadow-sm min-h-[120px]"
          placeholder="AI Agent Idea"
          rows={5}
          value={formData.idea}
          onChange={(e) => updateForm({ idea: e.target.value })}
          readOnly
          name="idea"
          id="idea-field"
        />
        <label htmlFor="idea-field" className="absolute left-4 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-4 peer-focus:-top-3.5 peer-focus:text-purple-600 peer-focus:text-sm cursor-text">
          AI Agent Idea
        </label>
      </div>

      <button
        id="agent-form-submit-button"
        type="submit"
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold shadow-lg transform hover:scale-105"
        // --- MODIFIED: Disable button if not all fields are filled OR if a submission is in progress ---
        disabled={!areAllFieldsFilled() || submissionStatus !== 'idle'}
      >
        Submit Your Idea
      </button>

      {submissionStatus === 'success' && (
        <div className="mt-6 p-5 bg-green-50 text-green-700 rounded-xl text-center font-semibold shadow-md border border-green-200">
          ✨ Thank you, **{formData.name}**! Your AI idea has been submitted successfully! ✨
        </div>
      )}
      {submissionStatus === 'error' && (
        <div className="mt-6 p-5 bg-red-50 text-red-700 rounded-xl text-center font-semibold shadow-md border border-red-200">
          ❌ Failed to submit your idea. Please try again.
        </div>
      )}
    </form>
  );
}
