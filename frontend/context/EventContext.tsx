import React, { createContext, useContext, useState, } from "react";
import { AppEvent } from "../types/EventTypes";
import { useCreateEvent } from "../app/services/createEvent.service";
import { useSwitchScope } from "../app/services/switchScope.service";





interface EventContextType {
  isPhysical: boolean;
  setIsPhysical: (value: boolean) => void;
  physicalEvent: AppEvent;
  virtualEvent: AppEvent;
  updatePhysicalEvent: (data: Partial<AppEvent>) => void;
  updateVirtualEvent: (data: Partial<AppEvent>) => void;
  addEvent: (event: AppEvent) => void;
  updateEvent: (id: string, data: Partial<AppEvent>) => void

}

export const EventContext = createContext<EventContextType | undefined>(undefined);

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);


const createInitialEvent = (): AppEvent => ({
  attendance_profile: "quick",
  category: "",
  description: "",
  end_time: now.toISOString(),
  geofence_radius: 0,
  latitude: 0,
  longitude: 0,
  name: "",
  recurrence: null,
  start_time: oneHourLater.toISOString(),
  visibility: "Public",
});

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPhysical, setIsPhysical] = useState(true); 
  const [physicalEvent, setPhysicalEvent] = useState<AppEvent>(() => createInitialEvent());
  const [virtualEvent, setVirtualEvent] = useState<AppEvent>(() => createInitialEvent());


  const updatePhysicalEvent = (data: Partial<AppEvent>) => {
    setPhysicalEvent(prev => ({ ...prev, ...data }));
  };

  const updateVirtualEvent = (data: Partial<AppEvent>) => {
    setVirtualEvent(prev => ({ ...prev, ...data }));
  };

 
const addEvent = (event: AppEvent) => {
  
};

const updateEvent = (id: string, data: Partial<AppEvent>) => {
  
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
