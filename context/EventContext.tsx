import React, { createContext, useContext, useState } from "react";
import { Event } from "../types/EventTypes";

interface EventContextType {
  event: Event;
  updateEvent: (data: Partial<Event>) => void;
  resetEvent: () => void;
}

export const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [event, setEvent] = useState<Event>({
    id: "",
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    cohosts: [],
    creator: "",   // set current user ID at init
  });

  const updateEvent = (data: Partial<Event>) => {
    setEvent(prev => ({ ...prev, ...data }));
  };

  const resetEvent = () => {
    setEvent({
      id: "",
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      cohosts: [],
      creator: "", 
    });
  };

  return (
    <EventContext.Provider value={{ event, updateEvent, resetEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used inside EventProvider");
  }
  return context;
};
