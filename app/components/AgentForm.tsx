'use client';

import { useFormContext } from './FormContext';

export default function AgentForm() {
  const { form, updateForm } = useFormContext();
const { name, email, linkedin, aiIdea } = form;
  return (
    <form className="space-y-4 p-4 max-w-xl mx-auto">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => updateForm({ name: e.target.value })}
        className="w-full p-2 border rounded text-black"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => updateForm({ email: e.target.value })}
        className="w-full p-2 border rounded text-black"
      />
      <input
        type="text"
        placeholder="LinkedIn Profile"
        value={linkedin}
        onChange={(e) => updateForm({ linkedin: e.target.value })}
        className="w-full p-2 border rounded text-black"
      />
      <textarea
        placeholder="Your AI Agent Idea"
        value={aiIdea}
        onChange={(e) => updateForm({ aiIdea: e.target.value })}
        className="w-full p-2 border rounded text-black"
      />
    </form>
  );
}
