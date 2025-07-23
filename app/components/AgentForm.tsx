// app/components/AgentForm.tsx
'use client';

import { useFormContext } from './FormContext';
import { useState } from 'react';

export default function AgentForm() {
  const { formData, updateForm, resetForm } = useFormContext();
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('idle');

    console.log('Form Submitted Automatically by Copilot or Manually!', formData);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmissionStatus('success');
      resetForm();

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Form submission error:', error);
      setSubmissionStatus('error');
    }
  };

  return (
    <form className="space-y-5 p-6 max-w-xl mx-auto bg-white rounded-xl shadow-xl border border-gray-100 font-sans"> {/* Increased padding, shadow, rounded, and added font-sans */}
      <input
        className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm" // Adjusted padding, rounded, added shadow-sm
        placeholder="Name"
        value={formData.name}
        onChange={(e) => updateForm({ name: e.target.value })}
        readOnly
        name="name"
      />
      <input
        className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => updateForm({ email: e.target.value })}
        readOnly
        name="email"
      />
      <input
        className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
        placeholder="LinkedIn URL"
        value={formData.linkedin}
        onChange={(e) => updateForm({ linkedin: e.target.value })}
        readOnly
        name="linkedin"
      />
      <textarea
        className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-y shadow-sm" // Adjusted padding, rounded, added shadow-sm
        placeholder="AI Agent Idea"
        rows={5}
        value={formData.idea}
        onChange={(e) => updateForm({ idea: e.target.value })}
        readOnly
        name="idea"
      />
      <button
        id="agent-form-submit-button"
        type="submit"
        className="w-full bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-md hover:shadow-lg" // Adjusted padding, rounded, focus ring, font size/weight
        disabled={submissionStatus === 'idle' ? false : true}
      >
        Submit Your Idea
      </button>

      {submissionStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-center font-medium shadow-sm"> {/* Adjusted padding, rounded, added font-medium, shadow-sm */}
          Thank you, **{formData.name}**! Your AI idea has been submitted successfully.
        </div>
      )}
      {submissionStatus === 'error' && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg text-center font-medium shadow-sm"> {/* Adjusted padding, rounded, added font-medium, shadow-sm */}
          Failed to submit your idea. Please try again.
        </div>
      )}
    </form>
  );
}
