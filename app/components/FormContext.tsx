'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type FormState = {
  name: string;
  email: string;
  linkedin: string;
  aiIdea: string;
};

type FormContextType = {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
};

const defaultFormState: FormState = {
  name: '',
  email: '',
  linkedin: '',
  aiIdea: '',
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [form, setForm] = useState<FormState>(defaultFormState);

  const updateForm = (updates: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  return (
    <FormContext.Provider value={{ form, updateForm }}>
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = (): FormContextType => {
  const context = useContext(FormContext);
  if (!context) throw new Error('useFormContext must be used within FormProvider');
  return context;
};
