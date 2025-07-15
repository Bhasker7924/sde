import Image from 'next/image';
import AgentForm from './components/AgentForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="flex items-center justify-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Image 
            src="/canvas-logo.svg" 
            alt="Canvas Logo" 
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            From Idea to <span className="text-blue-600">&#123; AI Agent in minutes &#125;</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div>
            <AgentForm />
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Copilot</h3>
                <p className="text-gray-600">
                  This is where the AI copilot component will be integrated to help users fill out the form automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-24 pt-12 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              This is a screening assignment
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Built with Next.js
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <span>© 2025 Canvas</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
