// app/components/AgentForm.tsx
'use client';

import { useFormContext } from './FormContext';

export default function AgentForm() {
  const { formData, updateForm } = useFormContext();

  // Function to handle the actual form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default page reload
    console.log('Form Submitted Automatically by Copilot!', formData);
    // Here you would typically send the data to a server, e.g., using another fetch call.
    alert(`Thank you, ${formData.name}! Your AI idea has been submitted.`);
  };

  return (
    // Add the onSubmit handler to the form tag
    <form className="space-y-4 p-4 max-w-xl mx-auto" onSubmit={handleFormSubmit}>
      <input
        className="w-full border p-2 rounded text-gray-800 bg-white"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => updateForm({name: e.target.value})}
        readOnly // It's good practice to make fields readOnly when a copilot is filling them
      />
      <input
        className="w-full border p-2 rounded text-gray-800 bg-white"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => updateForm({email: e.target.value})}
        readOnly
      />
      <input
        className="w-full border p-2 rounded text-gray-800 bg-white"
        placeholder="LinkedIn URL"
        value={formData.linkedin}
        onChange={(e) => updateForm({linkedin: e.target.value})}
        readOnly
      />
      <textarea
        className="w-full border p-2 rounded text-gray-800 bg-white"
        placeholder="AI Agent Idea"
        rows={5}
        value={formData.idea}
        onChange={(e) => updateForm({idea: e.target.value})}
        readOnly
      />
      <button 
        id="agent-form-submit-button" // Add an ID for the copilot to find
        type="submit" 
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Submit
      </button>
    </form>
  );
}