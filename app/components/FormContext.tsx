// app/components/FormContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// MAKE THIS FormData TYPE EXACTLY AS SHOWN BELOW
export type FormData = {
  name: string;
  email: string;
  linkedinProfile: string; // <-- CHANGE THIS FROM 'linkedin' to 'linkedinProfile'
  idea: string;
  // REMOVE aiIdea?: string; and LinkedIn?: string; from here.
  // These are AI response specific and should not be part of the core FormData type.
};

const defaultForm: FormData = {
  name: '',
  email: '',
  linkedinProfile: '', // <-- CHANGE THIS TO 'linkedinProfile'
  idea: '',
};

export const FormContext = createContext<{
  formData: FormData;
  updateForm: (updates: Partial<FormData>) => void;
}>({
  formData: defaultForm,
  updateForm: () => {},
});

export const useFormContext = () => useContext(FormContext);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<FormData>(defaultForm);

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <FormContext.Provider value={{ formData, updateForm }}>
      {children}
    </FormContext.Provider>
  );
};
