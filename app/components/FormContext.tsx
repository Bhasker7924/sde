'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type FormData = {
  name: string;
  email: string;
  linkedin: string;
  aiIdea: string;
};

type FormContextType = {
  form: FormData;
  updateForm: (updates: Partial<FormData>) => void;
};

const defaultFormData: FormData = {
  name: '',
  email: '',
  linkedin: '',
  aiIdea: '',
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [form, setForm] = useState<FormData>(defaultFormData);

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  return (
    <FormContext.Provider value={{ form, updateForm }}>
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = (): FormContextType => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};
