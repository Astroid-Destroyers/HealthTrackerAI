import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { 
  Ticket, 
  TicketReply, 
  TicketStatus, 
  TicketPriority, 
  CreateTicketData, 
  CreateReplyData, 
  UpdateTicketData, 
  TicketFilter,
  TicketStats
} from '../types/tickets';
import { app, auth, db } from "../lib/firebase";

// Generate a session ID for anonymous users
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get current user identifier (userId or sessionId)
export const getCurrentUserIdentifier = (): { userId?: string; sessionId: string } => {
  const user = auth.currentUser;
  const sessionId = localStorage.getItem('ticketSessionId') || generateSessionId();
  
  if (!localStorage.getItem('ticketSessionId')) {
    localStorage.setItem('ticketSessionId', sessionId);
  }
  
  return {
    userId: user?.uid,
    sessionId
  };
};

// Check if current user is authorized admin
export const isAuthorizedAdmin = (): boolean => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    return false;
  }
  
  // Hardcoded admin email
  const ADMIN_EMAIL = 'new.roeepalmon@gmail.com';
  return user.email === ADMIN_EMAIL;
};

// Convert Firestore document to Ticket object
const convertDocToTicket = (doc: DocumentSnapshot<DocumentData>): Ticket | null => {
  if (!doc.exists()) return null;
  
  const data = doc.data();
  return {
    id: doc.id,
    subject: data.subject,
    message: data.message,
    status: data.status,
    priority: data.priority,
    userId: data.userId,
    sessionId: data.sessionId,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    replies: data.replies || [],
    tags: data.tags || [],
    assignedTo: data.assignedTo,
    isRead: data.isRead || false,
    userLastRead: data.userLastRead?.toDate(),
    adminLastRead: data.adminLastRead?.toDate(),
  };
};

// Create a new ticket
export const createTicket = async (ticketData: CreateTicketData): Promise<string> => {
  const { userId, sessionId } = getCurrentUserIdentifier();
  
  const ticket = {
    subject: ticketData.subject,
    message: ticketData.message,
    status: TicketStatus.OPEN,
    priority: ticketData.priority || TicketPriority.NORMAL,
    userId,
    sessionId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    replies: [],
    tags: ticketData.tags || [],
    isRead: false,
  };
  
  const docRef = await addDoc(collection(db, 'tickets'), ticket);
  return docRef.id;
};

// Get tickets for current user
export const getUserTickets = async (): Promise<Ticket[]> => {
  const { userId, sessionId } = getCurrentUserIdentifier();
  
  let q;
  if (userId) {
    q = query(
      collection(db, 'tickets'),
      where('userId', '==', userId)
    );
  } else {
    q = query(
      collection(db, 'tickets'),
      where('sessionId', '==', sessionId)
    );
  }
  
  const querySnapshot = await getDocs(q);
  const tickets: Ticket[] = [];
  
  querySnapshot.forEach((doc) => {
    const ticket = convertDocToTicket(doc);
    if (ticket) tickets.push(ticket);
  });
  
  // Sort tickets by updatedAt descending (client-side sorting)
  tickets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  
  return tickets;
};

// Get all tickets (admin only)
export const getAllTickets = async (filter?: TicketFilter): Promise<Ticket[]> => {
  let q = query(collection(db, 'tickets'), orderBy('updatedAt', 'desc'));
  
  if (filter?.status) {
    q = query(q, where('status', '==', filter.status));
  }
  
  if (filter?.priority) {
    q = query(q, where('priority', '==', filter.priority));
  }
  
  if (filter?.assignedTo) {
    q = query(q, where('assignedTo', '==', filter.assignedTo));
  }
  
  const querySnapshot = await getDocs(q);
  const tickets: Ticket[] = [];
  
  querySnapshot.forEach((doc) => {
    const ticket = convertDocToTicket(doc);
    if (ticket) tickets.push(ticket);
  });
  
  return tickets;
};

// Get a single ticket by ID
export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
  const docRef = doc(db, 'tickets', ticketId);
  const docSnap = await getDoc(docRef);
  return convertDocToTicket(docSnap);
};

// Add a reply to a ticket
export const addTicketReply = async (replyData: CreateReplyData): Promise<void> => {
  const ticketRef = doc(db, 'tickets', replyData.ticketId);
  const ticketSnap = await getDoc(ticketRef);
  
  if (!ticketSnap.exists()) {
    throw new Error('Ticket not found');
  }
  
  const ticket = ticketSnap.data();
  const replies = ticket.replies || [];
  
  const newReply: TicketReply = {
    id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ticketId: replyData.ticketId,
    message: replyData.message,
    isFromAdmin: replyData.isFromAdmin,
    authorId: replyData.authorId,
    authorName: replyData.authorName,
    createdAt: new Date(),
    isRead: false,
  };
  
  replies.push(newReply);
  
  const updateData: any = {
    replies,
    updatedAt: serverTimestamp(),
  };
  
  // Update status based on who replied
  if (replyData.isFromAdmin) {
    updateData.status = TicketStatus.WAITING_FOR_RESPONSE;
    updateData.adminLastRead = serverTimestamp();
  } else {
    updateData.status = TicketStatus.OPEN;
    updateData.userLastRead = serverTimestamp();
  }
  
  await updateDoc(ticketRef, updateData);
};

// Update ticket
export const updateTicket = async (ticketId: string, updateData: UpdateTicketData): Promise<void> => {
  const ticketRef = doc(db, 'tickets', ticketId);
  
  const update: any = {
    ...updateData,
    updatedAt: serverTimestamp(),
  };
  
  await updateDoc(ticketRef, update);
};

// Mark ticket as read
export const markTicketAsRead = async (ticketId: string, isAdmin: boolean = false): Promise<void> => {
  const ticketRef = doc(db, 'tickets', ticketId);
  
  const updateData: any = {
    isRead: true,
    updatedAt: serverTimestamp(),
  };
  
  if (isAdmin) {
    updateData.adminLastRead = serverTimestamp();
  } else {
    updateData.userLastRead = serverTimestamp();
  }
  
  await updateDoc(ticketRef, updateData);
};

// Get ticket statistics (admin only)
export const getTicketStats = async (): Promise<TicketStats> => {
  const querySnapshot = await getDocs(collection(db, 'tickets'));
  
  let total = 0;
  let open = 0;
  let inProgress = 0;
  let waitingForResponse = 0;
  let resolved = 0;
  let closed = 0;
  let totalResponseTime = 0;
  let totalResolutionTime = 0;
  let responseTimes = 0;
  let resolutionTimes = 0;
  
  querySnapshot.forEach((doc) => {
    const ticket = convertDocToTicket(doc);
    if (!ticket) return; // Skip if conversion failed
    
    total++;
    
    switch (ticket.status) {
      case TicketStatus.OPEN:
        open++;
        break;
      case TicketStatus.IN_PROGRESS:
        inProgress++;
        break;
      case TicketStatus.WAITING_FOR_RESPONSE:
        waitingForResponse++;
        break;
      case TicketStatus.RESOLVED:
        resolved++;
        break;
      case TicketStatus.CLOSED:
        closed++;
        break;
    }
    
    // Calculate response and resolution times
    if (ticket.replies && ticket.replies.length > 0) {
      const firstAdminReply = ticket.replies.find((r: any) => r.isFromAdmin);
      if (firstAdminReply && firstAdminReply.createdAt) {
        const responseTime = (new Date(firstAdminReply.createdAt).getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
        totalResponseTime += responseTime;
        responseTimes++;
      }
    }
    
    if ((ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) && ticket.updatedAt) {
      const resolutionTime = (ticket.updatedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      totalResolutionTime += resolutionTime;
      resolutionTimes++;
    }
  });
  
  return {
    total,
    open,
    inProgress,
    waitingForResponse,
    resolved,
    closed,
    averageResponseTime: responseTimes > 0 ? totalResponseTime / responseTimes : 0,
    averageResolutionTime: resolutionTimes > 0 ? totalResolutionTime / resolutionTimes : 0,
  };
};

// Real-time listener for user tickets
export const subscribeToUserTickets = (callback: (tickets: Ticket[]) => void): (() => void) => {
  const { userId, sessionId } = getCurrentUserIdentifier();
  
  let q;
  if (userId) {
    q = query(
      collection(db, 'tickets'),
      where('userId', '==', userId)
    );
  } else {
    q = query(
      collection(db, 'tickets'),
      where('sessionId', '==', sessionId)
    );
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const tickets: Ticket[] = [];
    querySnapshot.forEach((doc) => {
      const ticket = convertDocToTicket(doc);
      if (ticket) tickets.push(ticket);
    });
    
    // Sort tickets by updatedAt descending (client-side sorting)
    tickets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    callback(tickets);
  });
};

// Real-time listener for all tickets (admin only)
export const subscribeToAllTickets = (callback: (tickets: Ticket[]) => void, filter?: TicketFilter): (() => void) => {
  let q = query(collection(db, 'tickets'), orderBy('updatedAt', 'desc'));
  
  if (filter?.status) {
    q = query(q, where('status', '==', filter.status));
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const tickets: Ticket[] = [];
    querySnapshot.forEach((doc) => {
      const ticket = convertDocToTicket(doc);
      if (ticket) tickets.push(ticket);
    });
    callback(tickets);
  });
};

// Real-time listener for a single ticket
export const subscribeToTicket = (ticketId: string, callback: (ticket: Ticket | null) => void): (() => void) => {
  const ticketRef = doc(db, 'tickets', ticketId);
  
  return onSnapshot(ticketRef, (doc) => {
    const ticket = convertDocToTicket(doc);
    callback(ticket);
  });
};