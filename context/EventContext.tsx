import React, { createContext, useContext, useState, useEffect } from "react";
import { Event } from "../types/EventTypes";
import { useAuth } from "./AuthContext";

interface EventContextType {
  isPhysical: boolean;
  setIsPhysical: (value: boolean) => void;
  physicalEvent: Event;
  virtualEvent: Event;
  updatePhysicalEvent: (data: Partial<Event>) => void;
  updateVirtualEvent: (data: Partial<Event>) => void;
  resetEvents: () => void;
}

export const EventContext = createContext<EventContextType | undefined>(undefined);

const createInitialEvent = (creatorId: string | undefined): Event => ({
  id: Math.random().toString(36).substring(2, 10),
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  cohosts: [],
  creator: creatorId,
});

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [isPhysical, setIsPhysical] = useState(true); 
  const [physicalEvent, setPhysicalEvent] = useState<Event>(() => createInitialEvent(currentUserId));
  const [virtualEvent, setVirtualEvent] = useState<Event>(() => createInitialEvent(currentUserId));

  const updatePhysicalEvent = (data: Partial<Event>) => {
    setPhysicalEvent(prev => ({ ...prev, ...data }));
  };

  const updateVirtualEvent = (data: Partial<Event>) => {
    setVirtualEvent(prev => ({ ...prev, ...data }));
  };

  const resetEvents = () => {
    setPhysicalEvent(() => createInitialEvent(currentUserId));
    setVirtualEvent(() => createInitialEvent(currentUserId));
  };

  return (
    <EventContext.Provider
      value={{
        isPhysical,
        setIsPhysical,
        physicalEvent,
        virtualEvent,
        updatePhysicalEvent,
        updateVirtualEvent,
        resetEvents,
      }}
    >
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
