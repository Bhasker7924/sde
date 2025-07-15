# AI Agent Form - Copilot Assignment

A Next.js application with a form for collecting AI agent ideas. Your task is to implement the AI copilot functionality.

## Assignment

**Objective**: Implement an AI copilot that appears on the right side of the form and helps users fill the form.

## Current State

- ✅ Form component with name, email, LinkedIn, and idea fields
- ✅ Responsive layout with dedicated copilot space
- ⚠️ **TODO**: Implement the AI copilot component

## Sample Conversation

Here's how the copilot should guide users through filling the form:

**Copilot**: Hi! I'm here to help you submit your AI agent idea. Let's start with the basics - what's your name?

**User**: My name is Priya Sharma

**Copilot**: Nice to meet you, Priya! 🎯 _[Updates Name field: "Priya Sharma"]_

Let me get your email address so we can reach out to you about your idea.

**User**: priya.sharma@email.com

**Copilot**: Perfect! 🎯 _[Updates Email field: "priya.sharma@email.com"]_

Now, could you share your LinkedIn profile URL? This helps us understand your background better.

**User**: https://linkedin.com/in/priya-sharma

**Copilot**: Great! 🎯 _[Updates LinkedIn field: "https://linkedin.com/in/priya-sharma"]_

Now for the exciting part - tell me about the AI agent you'd like to build. What problem would it solve?

**User**: I want to create an AI agent that helps developers automatically generate unit tests for their code

**Copilot**: That's a fantastic idea! An AI agent for automated unit test generation would be really valuable for developers. 🎯 _[Updates Idea field: "I want to create an AI agent that helps developers automatically generate unit tests for their code"]_

Perfect! I've filled out all your information. You can review everything in the form and submit when you're ready. Is there anything you'd like to modify?

---

## 📝 Accepting the Assignment

1. **Access the assignment**: https://classroom.github.com/a/dZ61f_Wh
2. **Sign in to GitHub** and authorize GitHub Classroom if prompted
3. **Click "Accept this assignment"** and wait for repository creation
4. **Clone your repository**:
   ```bash
   git clone [YOUR_REPOSITORY_URL]
   cd [REPOSITORY_NAME]
   ```

---

## 🚀 Getting Started

### Install Dependencies

1. Ensure **Node.js version 22** is installed (`node --version`)
2. Navigate to project directory: `cd agent-form-app`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Open http://localhost:3000

### Your Task

- **Location**: Replace the copilot placeholder in `app/page.tsx`
- **Requirements**: Your copilot should:
  - Guide users through filling the form conversationally
  - Collect information step by step (name, email, LinkedIn, idea)
  - Update form fields automatically as data is collected
  - Follow the sample conversation flow above

### Key Files

- `app/page.tsx` - Main page with form and copilot placeholder
- `app/components/AgentForm.tsx` - The form component
- `app/globals.css` - Global styles (if needed)

### LLM Integration

You can use any LLM service for your copilot implementation. Some options include:

- **Gemini 2.5 Flash** from [Google AI Studio](https://aistudio.google.com/) (free to use)
- OpenAI API
- Anthropic Claude
- Groq

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React

---

## 📤 Submitting the Assignment

1. **Test your implementation**: Ensure the copilot guides users through all form fields and updates them automatically
2. **Build the project**: Run `npm run build` to verify no build errors
3. **Push your changes**: Commit and push your implementation to GitHub
4. **Create a Pull Request**: You can create a PR to submit your assignment and include any questions or notes

**Getting Help:**

- You can ask questions directly in your Pull Request

---

## 📋 Submission Checklist

- [ ] Copilot guides users through all form fields
- [ ] Form fields are automatically updated during conversation
- [ ] Code builds successfully (`npm run build`)
- [ ] Implementation follows the sample conversation flow
- [ ] Changes are pushed to GitHub
- [ ] Pull Request created (optional but recommended)

---

## 📊 Evaluation Criteria

Your assignment will be evaluated on:

- **Functionality**: Does the copilot work as specified?
- **User Experience**: Is the conversation flow smooth and intuitive?
- **Code Quality**: Is the code well-structured and maintainable?
- **Technical Implementation**: Proper use of React, TypeScript, and Next.js

---

Good luck! 🚀
