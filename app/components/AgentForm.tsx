'use client';

import { useFormContext } from './FormContext';

export default function AgentForm() {
  const { formData, updateForm } = useFormContext();
const { name, email, linkedin, idea } = formData;
return (
  <form className="space-y-4">
    <input
      className="w-full border p-2 rounded"
      placeholder="Name"
      value={formData.name}
      onChange={(e) => updateForm({name: e.target.value})}
    />
    <input
      className="w-full border p-2 rounded"
      placeholder="Email"
      value={formData.email}
      onChange={(e) => updateForm({email: e.target.value})}
    />
    <input
      className="w-full border p-2 rounded"
      placeholder="LinkedIn URL"
      value={formData.linkedin}
      onChange={(e) => updateForm({linkedin: e.target.value})}
    />
    <textarea
      className="w-full border p-2 rounded"
      placeholder="AI Agent Idea"
      rows={5}
      value={formData.idea}
      onChange={(e) => updateForm({idea: e.target.value})}
    />
    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
      Submit
    </button>
  </form>
);
}
