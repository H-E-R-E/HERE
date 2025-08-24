export interface Event {
  id: string; 
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  cohosts: string[];   
  attendees?: string[];
  creator: string;
  createdAt?: string;
  updatedAt?: string;
}
