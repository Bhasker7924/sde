// app/page.tsx
import AgentForm from './components/AgentForm';
import Copilot from './components/Copilot';
import { FormProvider } from './components/FormContext'; // Import FormProvider

export default function Home() {
  return (
    // Main container for the entire page
    // Uses flexbox to center content vertically and horizontally, and min-h-screen to ensure it takes at least full viewport height
    <FormProvider>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 sm:p-10">
        {/* Responsive grid for the two main sections (Form and Copilot) */}
        {/* max-w-7xl ensures content doesn't stretch too wide on very large screens */}
        {/* gap-8 creates space between the columns */}
        {/* flex-col for small screens, md:flex-row for medium screens and up */}
        <div className="flex flex-col md:flex-row w-full max-w-7xl gap-8">

          {/* Left Column: Agent Form */}
          <section className="flex-1 bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
              Build Your AI Agent
            </h1>
            <p className="text-center text-gray-600 mb-8 max-w-md mx-auto">
              Tell us about the AI agent you envision, and our Copilot will assist you in filling out the details.
            </p>
            <AgentForm />
          </section>

          {/* Right Column: AI Copilot */}
          {/* This container explicitly sets the height for the Copilot component. */}
          {/* h-[750px] provides a fixed height. You can adjust this value. */}
          {/* max-h-[calc(100vh-80px)] provides a maximum height based on viewport height, minus some padding, ensuring it doesn't overflow the screen. */}
          {/* flex flex-col is crucial for Copilot's internal flexbox to work correctly within this constrained height. */}
          <section className="flex-1 flex flex-col h-[750px] max-h-[calc(100vh-80px)]">
            <Copilot />
          </section>

        </div>
      </main>
    </FormProvider>
  );
}
