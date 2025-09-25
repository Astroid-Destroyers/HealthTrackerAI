export interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  userId?: string; // Optional for authenticated users
  sessionId: string; // For anonymous users
  createdAt: Date;
  updatedAt: Date;
  replies: TicketReply[];
  tags?: string[];
  assignedTo?: string; // Admin user ID
  isRead: boolean;
  userLastRead?: Date;
  adminLastRead?: Date;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  message: string;
  isFromAdmin: boolean;
  authorId?: string; // Admin ID if from admin
  authorName: string;
  createdAt: Date;
  isRead: boolean;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_RESPONSE = 'waiting_for_response',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  userId?: string;
  sessionId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingForResponse: number;
  resolved: number;
  closed: number;
  averageResponseTime: number; // in hours
  averageResolutionTime: number; // in hours
}

export interface CreateTicketData {
  subject: string;
  message: string;
  priority?: TicketPriority;
  tags?: string[];
}

export interface CreateReplyData {
  ticketId: string;
  message: string;
  isFromAdmin: boolean;
  authorName: string;
  authorId?: string;
}

export interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  tags?: string[];
}