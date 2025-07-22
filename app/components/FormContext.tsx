'use client';

import { createContext, useContext, useState } from 'react';

export type FormData = {
  name: string;
  email: string;
  linkedin: string;
  aiIdea: string;
};

type FormContextType = {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: React.ReactNode }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    linkedin: '',
    aiIdea: '',
  });

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  return (
    <FormContext.Provider value={{ formData, updateFormData }}>
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used inside FormProvider');
  }
  return context;
};
