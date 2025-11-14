import { useState, useEffect } from 'react';

// A simple (but not highly performant) way to check for object changes.
// Good enough for a small form.
const
  isDifferent = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

export const useCompanyForm = () => {
  const [form, setForm] = useState({
    companyName: '',
    sector: '',
    industry: '',
    companysize: '',
    reportingYear: ''
  });
  
  // --- NEW: Store the initial state ---
  const [initialForm, setInitialForm] = useState(form);

  // Load data from localStorage
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    
    if (currentUserId) {
      const allCompanyData = JSON.parse(localStorage.getItem('companyData')) || {};
      const userCompanyData = allCompanyData[currentUserId];
      
      if (userCompanyData) {
        setForm(userCompanyData);
        // --- NEW: Set the initial state on load ---
        setInitialForm(userCompanyData);
      }
    }
  }, []); 

  // Handle changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'reportingYear') {
      let formattedValue = value.replace(/[^\d]/g, '');

      if (formattedValue.length > 2) {
        formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2, 4)}`;
      }

      setForm(prevForm => ({ ...prevForm, [name]: formattedValue }));
    } else {
      setForm(prevForm => ({ ...prevForm, [name]: value }));
    }
  };

  // --- NEW: Function to reset the 'dirty' state after a save ---
  const resetForm = () => {
    setInitialForm(form);
  };

  // --- NEW: Calculate if the form is 'dirty' ---
  const isDirty = isDifferent(form, initialForm);

  // --- NEW: Return isDirty and resetForm ---
  return { form, setForm, handleChange, isDirty, resetForm };
};