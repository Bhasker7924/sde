// app/components/FormContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Make sure to export FormData
export type FormData = { // <-- Added 'export' here
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