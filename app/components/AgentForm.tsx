// app/components/AgentForm.tsx
'use client';
import { useFormContext } from './FormContext'; // Keep this import

// We will NOT use the internal useState for formData in this component
// We will NOT use the internal handleChange for individual inputs
// The FormData interface here will be removed, as it's imported from FormContext
// The handleSubmit function will be removed, as form data is managed by context and submitted elsewhere if needed

export default function AgentForm() {
  // Use the shared context to get formData and the update function
  const { formData, updateForm } = useFormContext();

  // The handleChange is no longer local; updates go directly to context
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateForm({ [name]: value }); // Update the context's formData
  };

  // No local handleSubmit needed, as form data is updated on change
  // If you need a form submission action (e.g., to send final data to a backend),
  // it would be handled in the parent app/page.tsx or a separate component.
  // For now, removing the local submit.

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
      {/* Remove onSubmit from form if you don't need a specific submit button for this form.
          If you do, you'd define a submit handler here that perhaps logs the final formData
          or triggers another action. For AI interaction, direct input updates are sufficient.
      */}
      <form className="space-y-6"> {/* Removed onSubmit={handleSubmit} */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name" // Make sure 'name' attribute matches FormData field
            value={formData.name}
            onChange={handleInputChange} // Use the context-aware handler
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email" // Make sure 'name' attribute matches FormData field
            value={formData.email}
            onChange={handleInputChange} // Use the context-aware handler
            placeholder="Enter your email address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
            required
          />
        </div>

        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile
          </label>
          <input
            type="url"
            id="linkedin" // Changed id to 'linkedin'
            name="linkedin" // ***IMPORTANT: Changed name to 'linkedin' to match FormData type***
            value={formData.linkedin}
            onChange={handleInputChange} // Use the context-aware handler
            placeholder="https://linkedin.com/in/your-profile"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500"
            required
          />
        </div>

        <div>
          <label htmlFor="idea" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your AI agent idea
          </label>
          <textarea
            id="idea"
            name="idea" // Make sure 'name' attribute matches FormData field
            value={formData.idea}
            onChange={handleInputChange} // Use the context-aware handler
            placeholder="Describe the AI agent you want to build..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500 resize-none"
            required
          />
        </div>
        
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Or use the AI copilot to help you fill out this form automatically
        </p>
      </div>
    </div>
  );
}
