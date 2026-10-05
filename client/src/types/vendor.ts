export type VendorType = 'Material' | 'Service' | 'Equipment' | 'Other';
export type VendorStatus = 'Active' | 'Inactive';

export interface VendorItem {
  _id: string;
  name: string;
  type: VendorType;
  supplies: string;
  contactPhone: string;
  alternatePhone?: string;
  contactEmail?: string;
  fullAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location: string;
  deliveryAvailable: boolean;
  gstNumber?: string;
  status: VendorStatus;
  notes?: string;
  createdAt?: string;
}

export type WorkerTrade =
  | 'Carpenter'
  | 'Mason'
  | 'Plumber'
  | 'Electrician'
  | 'Painter'
  | 'Welder'
  | 'Helper'
  | 'Bar Bender'
  | 'Tile Fitter'
  | 'Other';

export type WorkerStatus = 'Active' | 'Inactive';

export interface WorkerItem {
  _id: string;
  name: string;
  trade: WorkerTrade | string;
  specialSkills?: string;
  dailyRate: number;
  contactPhone: string;
  alternatePhone?: string;
  contactEmail?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location: string;
  status: WorkerStatus;
  joinedDate?: string;
  notes?: string;
  createdAt?: string;
}
