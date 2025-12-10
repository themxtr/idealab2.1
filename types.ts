
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  type: 'university' | 'non-university' | 'staff'; // Specific access levels
  isProfileComplete: boolean;
  srn?: string;     // For University
  degree?: string;
  program?: string;
}

export interface StaffUser {
  name: string;
  employeeId: string;
  role: 'admin' | 'assistant' | 'lab assistant' | 'ambassador';
  avatar: string;
}

export interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  description: string;
  category: 'Workshop' | 'Seminar' | 'Hackathon' | 'Exhibition';
  imageUrl: string;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  video?: string;
  description: string;
  longDescription?: string;
  author: string;
  technologies: string[];
  gallery?: string[];
  date: string;
  link?: string;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  poster?: string;
  title: string;
  size?: 'small' | 'medium' | 'large';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  location: string;
  status: 'operational' | 'maintenance' | 'low_stock';
  type: 'consumable' | 'non-consumable';
  costPerUnit: number;
}

export interface IndentItem {
  id: string;
  name: string;
  category: string;
  type: 'consumable' | 'non-consumable';
  quantity: number;
  costPerUnit: number;
}

export interface Indent {
  id: string;
  studentName: string;
  studentId: string;
  projectTitle: string;
  supervisor: string;
  purpose: string;
  items: IndentItem[];
  requestDate: string;
  status: 'pending' | 'active' | 'returned' | 'rejected' | 'approved';
  paymentStatus: 'pending' | 'paid' | 'na';
  totalCost: number;
  rejectionReason?: string;
}

export interface PrintOrder {
  id: string;
  fileName: string;
  stlFile?: string; // Base64 or blob URL of original STL
  gcodeFile?: string; // Sliced file for staff
  thumbnail: string;
  material: string;
  color: string;
  infill: number;
  cost: number;
  status: 'queued' | 'printing' | 'completed' | 'rejected' | 'failed';
  progress: number;
  submitDate: string;
  paymentStatus: 'pending' | 'paid';
  paymentMethod: 'online' | 'cash';
  rejectionReason?: string;
  // New fields for 3D printing
  dimensions?: string; // e.g., "100x50x75 mm"
  weight?: number; // in grams
  volume?: number; // in cm³
  orientation?: 'vertical' | 'flat';
  stlKey?: string; // Key for STL blob stored in IndexedDB
  userId?: string;
  userName?: string;
}

export interface PcbOrder {
  id: string;
  fileName: string;
  status: 'queued' | 'processing' | 'completed' | 'rejected';
  specs: {
    material: string;
    layers: number;
    dimensions: string;
    quantity: number;
    thickness: string;
    copperWeight: string;
    solderMaskColor: string;
    silkscreenColor: string;
    surfaceFinish: string;
  };
  cost: number;
  submitDate: string;
  paymentStatus: 'pending' | 'paid';
  rejectionReason?: string;
}

export interface SlotBooking {
  id: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  rejectionReason?: string;
}

export interface StaffRequest {
  id: string;
  type: 'component_rent' | '3d_print' | 'slot_booking' | 'pcb_order';
  requesterName: string;
  requesterType: 'university' | 'guest'; 
  details: string;
  date: string;
  status: 'pending';
  originalData?: any; 
}

export interface HistoryLog {
  id: string;
  action: string; // e.g., "Approved Slot", "Added Item"
  actorName: string; // Staff name
  targetName: string; // Student name or Item name
  details: string;
  timestamp: string;
  type: 'approval' | 'rejection' | 'system';
}

export interface Notification {
  id: string;
  userId: string; // 'staff' or specific student ID
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}
