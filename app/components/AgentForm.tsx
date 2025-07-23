// app/components/AgentForm.tsx
'use client';

import { useFormContext } from './FormContext';
import { useState } from 'react'; // Import useState for notification

export default function AgentForm() {
  const { formData, updateForm } = useFormContext();
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Function to handle the actual form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default page reload
    setSubmissionStatus('idle'); // Reset status before new attempt

    console.log('Form Submitted Automatically by Copilot!', formData);
    // Here you would typically send the data to a server, e.g., using another fetch call.
    // Simulate an API call
    try {
      // Replace with your actual API call, e.g.:
      // const response = await fetch('/api/submit-form', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // if (!response.ok) {
      //   throw new Error('Form submission failed.');
      // }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      setSubmissionStatus('success');
      // Optionally, clear the form after successful submission
      // updateForm({ name: '', email: '', linkedin: '', idea: '' });
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmissionStatus('error');
    }
  };

  return (
    <form className="space-y-4 p-4 max-w-xl mx-auto bg-white rounded-lg shadow-md" onSubmit={handleFormSubmit}>
      <input
        className="w-full border border-gray-300 p-2 rounded-md text-gray-800 bg-gray-50 focus:outline-none focus:border-blue-500"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => updateForm({ name: e.target.value })}
        readOnly
        name="name" // Added name attribute
      />
      <input
        className="w-full border border-gray-300 p-2 rounded-md text-gray-800 bg-gray-50 focus:outline-none focus:border-blue-500"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => updateForm({ email: e.target.value })}
        readOnly
        name="email" // Added name attribute
      />
      <input
        className="w-full border border-gray-300 p-2 rounded-md text-gray-800 bg-gray-50 focus:outline-none focus:border-blue-500"
        placeholder="LinkedIn URL"
        value={formData.linkedin}
        onChange={(e) => updateForm({ linkedin: e.target.value })}
        readOnly
        name="linkedin" // Added name attribute
      />
      <textarea
        className="w-full border border-gray-300 p-2 rounded-md text-gray-800 bg-gray-50 focus:outline-none focus:border-blue-500 resize-y"
        placeholder="AI Agent Idea"
        rows={5}
        value={formData.idea}
        onChange={(e) => updateForm({ idea: e.target.value })}
        readOnly
        name="idea" // Added name attribute
      />
      <button
        id="agent-form-submit-button"
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={submissionStatus === 'idle' ? false : true} // Disable while submitting or after status is set
      >
        Submit Your Idea
      </button>

      {submissionStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md text-center">
          Thank you, **{formData.name}**! Your AI idea has been submitted successfully.
        </div>
      )}
      {submissionStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md text-center">
          Failed to submit your idea. Please try again.
        </div>
      )}
    </form>
  );
}
