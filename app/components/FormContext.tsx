// app/context/FormContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type FormData = {
  name: string;
  email: string;
  linkedin: string;
  aiIdea: string;
};

type FormContextType = FormData & {
  updateForm: (fields: Partial<FormData>) => void;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    linkedin: '',
    aiIdea: '',
  });

  const updateForm = (fields: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...fields }));
  };

  return (
    <FormContext.Provider value={{ ...form, updateForm }}>
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};
