// app/components/FormContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type FormData = {
  name: string;
  email: string;
  linkedin: string;
  idea: string;
};

const defaultForm: FormData = {
  name: '',
  email: '',
  linkedin: '',
  idea: '',
};

export const FormContext = createContext<{
  formData: FormData;
  updateForm: (updates: Partial<FormData>) => void;
  resetForm: () => void; // Added resetForm to context
}>({
  formData: defaultForm,
  updateForm: () => {},
  resetForm: () => {}, // Provide a default no-op function
});

export const useFormContext = () => useContext(FormContext);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<FormData>(defaultForm);

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const resetForm = () => { // New function to reset form data
    setFormData(defaultForm);
  };

  return (
    <FormContext.Provider value={{ formData, updateForm, resetForm }}>
      {children}
    </FormContext.Provider>
  );
};
