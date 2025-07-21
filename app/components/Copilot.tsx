const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim()) return;

  // Add user message
  setConversation(prev => [...prev, { role: 'user', content: input }]);
  setInput('');
  setIsLoading(true);

  // 🔒 Guard: Already filled + reviewing? Stop LLM call
  if (reviewMode || allFieldsFilled()) {
    setIsLoading(false);

    // 🔁 Allow user to say "edit email" or similar
    const inputLower = input.toLowerCase();
    if (inputLower.includes('edit') || inputLower.includes('change')) {
      const field = ['name', 'email', 'linkedin', 'idea'].find(f => inputLower.includes(f));
      if (field) {
        setReviewMode(false); // Go back to edit mode
        setConversation(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Sure, please enter the new ${field}:`,
          },
        ]);
      } else {
        setConversation(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Sorry, I didn’t catch which field you want to edit. You can say "edit name", "change LinkedIn", etc.`,
          },
        ]);
      }
    } else {
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `If everything looks good, you can now submit the form. Or type "edit" to make changes.`,
        },
      ]);
    }
    return;
  }

  try {
    const response = await fetch('/api/route', {
      method: 'POST',
      body: JSON.stringify({
        messages: [...conversation, { role: 'user', content: input }],
        formData,
      }),
    });

    const data: LLMResponse = await response.json();

    // Apply updates
    if (data.updates) {
      updateForm(data.updates);
    }

    setConversation(prev => [...prev, { role: 'assistant', content: data.message }]);

    // ✅ Check again after response: If all fields filled, show review
    const filled = {
      ...formData,
      ...data.updates,
    };

    if (filled.name && filled.email && filled.linkedin && filled.idea) {
      setTimeout(() => {
        setReviewMode(true);
        const summary = `✅ Here's what I captured:\n\n- Name: ${filled.name}\n- Email: ${filled.email}\n- LinkedIn: ${filled.linkedin}\n- AI Idea: ${filled.idea}\n\nWould you like to edit any field? Just say "edit name", "change email", etc.`;
        setConversation(prev => [...prev, { role: 'assistant', content: summary }]);
      }, 300);
    }
  } catch (err) {
    setConversation(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
  } finally {
    setIsLoading(false);
  }
};
