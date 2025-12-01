// src/context.js
import React, { createContext, useContext, useState } from 'react';

const LocatorContext = createContext(null);

export function LocatorProvider({ children }) {
  const [family, setFamily] = useState(null);
  const [member, setMember] = useState(null);
  const [trip, setTrip] = useState(null);

  const value = {
    family,
    member,
    trip,
    setFamily,
    setMember,
    setTrip,
  };

  return (
    <LocatorContext.Provider value={value}>
      {children}
    </LocatorContext.Provider>
  );
}

export function useLocator() {
  const ctx = useContext(LocatorContext);
  if (!ctx) throw new Error('useLocator must be used inside LocatorProvider');
  return ctx;
}
