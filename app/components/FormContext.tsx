'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Make sure to export FormData
export type FormData = {
  name: string;
  email: string;
  linkedin: string; // <-- Expect lowercase 'l' for internal consistency
  idea: string;    // <-- Expect lowercase 'i' for internal consistency
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
