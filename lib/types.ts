// filepath: lib/types.ts (Partial - Ensure User matches this)
export interface User {
  id: number;
  name: string;
  pinCode?: string | null;
  role: Role;
  systemRoles: string[];
  locationId?: number | null;
  locationIds?: number[];
  location?: Location;
  courtReserveId?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  emailVerified?: Date | string | null;
  image?: string | null;
  isActive?: boolean;
  receiveReportEmails?: boolean; // NEW
}
// ... (rest of file remains same)