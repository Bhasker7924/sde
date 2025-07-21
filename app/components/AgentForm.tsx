'use client';

import { useFormContext } from './FormContext';

export default function AgentForm() {
  const { formData, updateForm } = useFormContext();

  return (
    <form className="space-y-4 bg-white text-black p-6 rounded-lg shadow-md">
      <input
        className="w-full border border-gray-300 p-2 rounded"
        placeholder="Your Name"
        value={formData.name}
        onChange={(e) => updateForm({ name: e.target.value })}
      />
      <input
        className="w-full border border-gray-300 p-2 rounded"
        placeholder="Your Email"
        value={formData.email}
        onChange={(e) => updateForm({ email: e.target.value })}
      />
      <input
        className="w-full border border-gray-300 p-2 rounded"
        placeholder="LinkedIn Profile URL"
        value={formData.linkedin}
        onChange={(e) => updateForm({ linkedin: e.target.value })}
      />
      <textarea
        className="w-full border border-gray-300 p-2 rounded"
        placeholder="Describe your AI Agent idea"
        rows={4}
        value={formData.idea}
        onChange={(e) => updateForm({ idea: e.target.value })}
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
    </form>
  );
}
