'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type FormData = {
  name: string;
  email: string;
  linkedin: string;
  aiIdea: string;
};

type FormContextType = {
  formData: FormData;
  updateForm: (updates: Partial<FormData>) => void;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    linkedin: '',
    aiIdea: '',
  });

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <FormContext.Provider value={{ formData, updateForm }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) throw new Error('useFormContext must be used within a FormProvider');
  return context;
}
