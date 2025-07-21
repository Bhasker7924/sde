'use client';

import React, { createContext, useContext, useState } from 'react';

export type FormData = {
  name: string;
  email: string;
  linkedin: string;
  aiIdea: string;
};

const defaultFormData: FormData = {
  name: '',
  email: '',
  linkedin: '',
  aiIdea: '',
};

type FormContextType = FormData & {
  updateForm: (fields: Partial<FormData>) => void;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error('useFormContext must be used within FormProvider');
  return context;
};

export const FormProvider = ({ children }: { children: React.ReactNode }) => {
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const updateForm = (fields: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  return (
    <FormContext.Provider value={{ ...formData, updateForm }}>
      {children}
    </FormContext.Provider>
  );
};
