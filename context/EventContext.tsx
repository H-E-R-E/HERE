import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

import { AppEvent } from "../types/EventTypes";





interface EventContextType {
  isPhysical: boolean;
  setIsPhysical: (value: boolean) => void;
  physicalEvent: AppEvent;
  virtualEvent: AppEvent;
  updatePhysicalEvent: (data: Partial<AppEvent>) => void;
  updateVirtualEvent: (data: Partial<AppEvent>) => void;
  events: AppEvent[];
  addEvent: (event: AppEvent) => void;
  resetEvents: () => void;
  updateEvent: (id: string, data: Partial<AppEvent>) => void

}

export const EventContext = createContext<EventContextType | undefined>(undefined);

const createInitialEvent = (creatorId: string | undefined): AppEvent => ({
  eventType: "",
  id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  location: "",
  cohosts: [],
  eventFee: "",
  creator: creatorId,
  imageUrl: "",
  geoPolygon: [],
  isTrackingAttendance: false
});

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [isPhysical, setIsPhysical] = useState(true); 
  const [physicalEvent, setPhysicalEvent] = useState<AppEvent>(() => createInitialEvent(currentUserId));
  const [virtualEvent, setVirtualEvent] = useState<AppEvent>(() => createInitialEvent(currentUserId));
  const [events, setEvents] = useState<AppEvent[]>([]);


  const updatePhysicalEvent = (data: Partial<AppEvent>) => {
    setPhysicalEvent(prev => ({ ...prev, ...data }));
  };

  const updateVirtualEvent = (data: Partial<AppEvent>) => {
    setVirtualEvent(prev => ({ ...prev, ...data }));
  };

 
const addEvent = (event: AppEvent) => {
  setEvents(prev => [
    ...prev,
    {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}` // new id
    }
  ]);
};

const updateEvent = (id: string, data: Partial<AppEvent>) => {
  setEvents(prev =>
    prev.map(event =>
      event.id === id ? { ...event, ...data } : event
    )
  );
};


  const resetEvents = () => {
    setEvents([]);
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
        events,
        addEvent,
        updateEvent
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
