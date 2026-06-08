export type InviteChannel = "whatsapp" | "email" | "link";
export type InviteStatus = "sent" | "clicked" | "registered";

export interface InviteRecord {
  id: string;
  channel: InviteChannel;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  status: InviteStatus;
  sentAt: string;
  clickedAt?: string;
  registeredAt?: string;
  referrerId: string;
}

export interface InviteStats {
  totalSent: number;
  totalClicked: number;
  totalRegistered: number;
  conversionRate: number;
}

export interface CsvContact {
  nom?: string;
  email?: string;
  telephone?: string;
}
