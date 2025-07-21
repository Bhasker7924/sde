'use client';

import { useFormContext } from './FormContext';

export default function AgentForm() {
  const { form, updateForm } = useFormContext();

  return (
    <form className="space-y-4 p-4 max-w-xl mx-auto">
      <div>
        <label className="block text-gray-700">Name</label>
        <input
          type="text"
          className="border p-2 w-full"
          value={form.name}
          onChange={(e) => updateForm({ name: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-gray-700">Email</label>
        <input
          type="email"
          className="border p-2 w-full"
          value={form.email}
          onChange={(e) => updateForm({ email: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-gray-700">LinkedIn</label>
        <input
          type="text"
          className="border p-2 w-full"
          value={form.linkedin}
          onChange={(e) => updateForm({ linkedin: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-gray-700">AI Idea</label>
        <textarea
          className="border p-2 w-full"
          value={form.aiIdea}
          onChange={(e) => updateForm({ aiIdea: e.target.value })}
        />
      </div>
    </form>
  );
}
