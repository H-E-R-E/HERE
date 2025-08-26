export interface Event {
  id: string; 
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  cohosts: string[]; 
  eventFee?: string | undefined;  
  attendees?: string[];
  creator: string | undefined;
  createdAt?: string;
  updatedAt?: string;
}
