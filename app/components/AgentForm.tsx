// app/components/AgentForm.tsx
'use client';

import React from 'react';
import { useFormContext } from '../context/FormContext';

export default function AgentForm() {
  const { formData, updateForm } = useFormContext();

  return (
    <form className="space-y-4 p-4 max-w-xl mx-auto">
      <div>
        <label className="block text-gray-700 font-medium mb-2">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateForm({ name: e.target.value })}
          className="w-full border border-gray-300 p-2 rounded"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateForm({ email: e.target.value })}
          className="w-full border border-gray-300 p-2 rounded"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">LinkedIn</label>
        <input
          type="url"
          value={formData.linkedin}
          onChange={(e) => updateForm({ linkedin: e.target.value })}
          className="w-full border border-gray-300 p-2 rounded"
          placeholder="https://linkedin.com/in/yourprofile"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">AI Agent Idea</label>
        <textarea
          rows={4}
          value={formData.aiIdea}
          onChange={(e) => updateForm({ aiIdea: e.target.value })} // ✅ FIXED here
          className="w-full border border-gray-300 p-2 rounded"
          placeholder="Describe your AI agent idea..."
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
}
