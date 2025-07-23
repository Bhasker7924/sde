// app/components/AgentForm.tsx
'use client'; // Essential for client-side functionality and hooks

import { useFormContext } from './FormContext';
import React from 'react'; // Explicitly import React if not implicitly handled by your Next.js config

// This component uses a default export, which is common for single-component files.
export default function AgentForm() {
  const { formData, updateForm } = useFormContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateForm({ [name]: value });
  };

  // Check if all fields are complete for enabling the submit button
  const isFormComplete = formData.name && formData.email && formData.email.includes('@') && formData.linkedin && formData.idea;

  // Handles form submission (useful if the user clicks the button directly)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormComplete) {
        console.log("Agent Form submitted manually:", formData);
        // In a real application, you'd send formData to your backend here.
        // For this demo, the Copilot also triggers this button.
    } else {
        console.log("Form is incomplete. Cannot submit.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Your Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="e.g., John Doe"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Contact Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="e.g., john.doe@example.com"
        />
      </div>

      <div>
        <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
          LinkedIn Profile URL
        </label>
        <input
          type="url"
          id="linkedin"
          name="linkedin"
          value={formData.linkedin}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="e.g., https://linkedin.com/in/yourprofile"
        />
      </div>

      <div>
        <label htmlFor="idea" className="block text-sm font-medium text-gray-700">
          AI Agent Idea Description
        </label>
        <textarea
          id="idea"
          name="idea"
          value={formData.idea}
          onChange={handleChange}
          rows={5}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Describe your AI agent's purpose, key features, and what problem it solves..."
        ></textarea>
      </div>

      <button
        type="submit"
        id="agent-form-submit-button" // ID for Copilot to click programmatically
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ${
          !isFormComplete ? 'opacity-50 cursor-not-allowed' : '' // Disable if form is not complete
        }`}
        disabled={!isFormComplete}
      >
        Submit AI Agent Idea
      </button>
    </form>
  );
}