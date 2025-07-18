import AgentForm from './components/AgentForm'
import CopilotUI from './components/Copilot'
import { FormProvider } from './components/FormContext'

export default function HomePage() {
  return (
    <FormProvider>
      <div className="flex flex-col md:flex-row h-screen">
        <div className="w-full md:w-1/2 p-6">
          <AgentForm />
        </div>
        <div className="w-full md:w-1/2 bg-gray-100">
          <CopilotUI />
        </div>
      </div>
    </FormProvider>
  )
}
