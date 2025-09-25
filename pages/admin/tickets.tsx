import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import DefaultLayout from "@/layouts/default";

import {
  getAllTickets,
  subscribeToAllTickets,
  addTicketReply,
  updateTicket,
  markTicketAsRead,
  getTicketStats,
  isAuthorizedAdmin,
} from "@/utils/tickets";
import {
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketFilter,
  TicketStats,
  CreateReplyData,
  UpdateTicketData,
} from "@/types/tickets";
export default function AdminTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [newReply, setNewReply] = useState("");
  const [filter, setFilter] = useState<TicketFilter>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Check if user is authorized admin
  const isAdmin = isAuthorizedAdmin();

  useEffect(() => {
    if (!isAdmin) {
      // Redirect non-admin users
      return;
    }

    const loadData = async () => {
      try {
        const [allTickets, ticketStats] = await Promise.all([
          getAllTickets(filter),
          getTicketStats()
        ]);
        setTickets(allTickets);
        setStats(ticketStats);
      } catch (error) {
        console.error("Error loading admin data:", error);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToAllTickets((updatedTickets) => {
      setTickets(updatedTickets);

      // Update selected ticket if it exists in the updated list
      if (selectedTicket) {
        const updatedSelectedTicket = updatedTickets.find(
          (t) => t.id === selectedTicket.id,
        );
        if (updatedSelectedTicket) {
          setSelectedTicket(updatedSelectedTicket);
        }
      }
    }, filter);

    return unsubscribe;
  }, [isAdmin, filter, selectedTicket]);

  // Filter tickets based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTickets(filtered);
    }
  }, [tickets, searchQuery]);

  const handleTicketClick = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    onOpen();
    
    // Mark as read from admin side
    if (!ticket.adminLastRead) {
      try {
        await markTicketAsRead(ticket.id, true);
      } catch (error) {
        console.error("Error marking ticket as read:", error);
      }
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newReply.trim()) return;

    setIsReplying(true);

    try {
      const replyData: CreateReplyData = {
        ticketId: selectedTicket.id,
        message: newReply.trim(),
        isFromAdmin: true,
        authorName: user?.displayName || "Support Team",
        authorId: user?.uid,
      };

      await addTicketReply(replyData);
      setNewReply("");
    } catch (error) {
      console.error("Error adding reply:", error);
    } finally {
      setIsReplying(false);
    }
  };

  const handleStatusUpdate = async (status: TicketStatus) => {
    if (!selectedTicket) return;

    setIsUpdatingStatus(true);

    try {
      const updateData: UpdateTicketData = {
        status,
      };

      await updateTicket(selectedTicket.id, updateData);
    } catch (error) {
      console.error("Error updating ticket status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return "primary";
      case TicketStatus.IN_PROGRESS:
        return "warning";
      case TicketStatus.WAITING_FOR_RESPONSE:
        return "secondary";
      case TicketStatus.RESOLVED:
        return "success";
      case TicketStatus.CLOSED:
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.LOW:
        return "default";
      case TicketPriority.NORMAL:
        return "primary";
      case TicketPriority.HIGH:
        return "warning";
      case TicketPriority.URGENT:
        return "danger";
      default:
        return "default";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return "Open";
      case TicketStatus.IN_PROGRESS:
        return "In Progress";
      case TicketStatus.WAITING_FOR_RESPONSE:
        return "Waiting for Response";
      case TicketStatus.RESOLVED:
        return "Resolved";
      case TicketStatus.CLOSED:
        return "Closed";
      default:
        return "Unknown";
    }
  };

  if (!user) {
    return (
      <DefaultLayout>
        <div className="container mx-auto max-w-4xl px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-warning mb-4">Authentication Required</h1>
            <p className="text-default-600 mb-4">You need to be logged in to access this page.</p>
            <Button color="primary" href="/login" as="a">
              Sign In
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DefaultLayout>
        <div className="container mx-auto max-w-4xl px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-danger mb-4">Access Denied</h1>
              <p className="text-default-600 mb-4">You don&apos;t have permission to access this page.</p>
            <p className="text-sm text-default-500">Only authorized administrators can access this area.</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Ticket Management</h1>
          <p className="text-default-600">Manage support tickets and respond to users</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-default-600">Total</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.open}</p>
                <p className="text-sm text-default-600">Open</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-warning">{stats.inProgress}</p>
                <p className="text-sm text-default-600">In Progress</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-secondary">{stats.waitingForResponse}</p>
                <p className="text-sm text-default-600">Waiting</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-success">{stats.resolved}</p>
                <p className="text-sm text-default-600">Resolved</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-default">{stats.closed}</p>
                <p className="text-sm text-default-600">Closed</p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:w-1/3"
          />
          
          <Select
            placeholder="Filter by status"
            className="md:w-1/4"
            onSelectionChange={(keys) => {
              const status = Array.from(keys)[0] as TicketStatus;
              setFilter(prev => ({ ...prev, status: status || undefined }));
            }}
          >
            <SelectItem key="">All Status</SelectItem>
            <SelectItem key={TicketStatus.OPEN}>Open</SelectItem>
            <SelectItem key={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem key={TicketStatus.WAITING_FOR_RESPONSE}>
              Waiting for Response
            </SelectItem>
            <SelectItem key={TicketStatus.RESOLVED}>Resolved</SelectItem>
            <SelectItem key={TicketStatus.CLOSED}>Closed</SelectItem>
          </Select>

          <Select
            className="md:w-1/4"
            placeholder="Filter by priority"
            onSelectionChange={(keys) => {
              const priority = Array.from(keys)[0] as TicketPriority;
              setFilter((prev) => ({
                ...prev,
                priority: priority || undefined,
              }));
            }}
          >
            <SelectItem key="">All Priority</SelectItem>
            <SelectItem key={TicketPriority.LOW}>Low</SelectItem>
            <SelectItem key={TicketPriority.NORMAL}>Normal</SelectItem>
            <SelectItem key={TicketPriority.HIGH}>High</SelectItem>
            <SelectItem key={TicketPriority.URGENT}>Urgent</SelectItem>
          </Select>
        </div>

        {/* Tickets Table */}
        <Card>
          <CardBody>
            <Table aria-label="Tickets table">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Subject</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Priority</TableColumn>
                <TableColumn>Created</TableColumn>
                <TableColumn>Updated</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs">{ticket.id.slice(0, 8)}...</code>
                        {!ticket.adminLastRead && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {ticket.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(ticket.status)}
                        variant="flat"
                      >
                        {getStatusLabel(ticket.status)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getPriorityColor(ticket.priority)}
                        variant="dot"
                      >
                        {ticket.priority}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-default-500">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-default-500">
                        {formatDate(ticket.updatedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => handleTicketClick(ticket)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Ticket Detail Modal */}
        <Modal 
          isOpen={isOpen} 
          onClose={onClose}
          size="4xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <span>Ticket Details</span>
                {selectedTicket && (
                  <>
                    <Chip
                      size="sm"
                      color={getStatusColor(selectedTicket.status)}
                      variant="flat"
                    >
                      {getStatusLabel(selectedTicket.status)}
                    </Chip>
                    <Chip
                      size="sm"
                      color={getPriorityColor(selectedTicket.priority)}
                      variant="dot"
                    >
                      {selectedTicket.priority}
                    </Chip>
                  </>
                )}
              </div>
            </ModalHeader>
            <ModalBody>
              {selectedTicket && (
                <div className="space-y-6">
                  {/* Ticket Info */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {selectedTicket.subject}
                    </h3>
                    <p className="text-default-600 mb-3">
                      {selectedTicket.message}
                    </p>
                    <div className="flex gap-4 text-sm text-default-500">
                      <span>Created: {formatDate(selectedTicket.createdAt)}</span>
                      <span>Updated: {formatDate(selectedTicket.updatedAt)}</span>
                      <span>ID: {selectedTicket.id}</span>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      color="warning"
                      variant={selectedTicket.status === TicketStatus.IN_PROGRESS ? "solid" : "bordered"}
                      onPress={() => handleStatusUpdate(TicketStatus.IN_PROGRESS)}
                      isLoading={isUpdatingStatus}
                    >
                      Mark In Progress
                    </Button>
                    <Button
                      size="sm"
                      color="success"
                      variant={selectedTicket.status === TicketStatus.RESOLVED ? "solid" : "bordered"}
                      onPress={() => handleStatusUpdate(TicketStatus.RESOLVED)}
                      isLoading={isUpdatingStatus}
                    >
                      Mark Resolved
                    </Button>
                    <Button
                      size="sm"
                      color="default"
                      variant={selectedTicket.status === TicketStatus.CLOSED ? "solid" : "bordered"}
                      onPress={() => handleStatusUpdate(TicketStatus.CLOSED)}
                      isLoading={isUpdatingStatus}
                    >
                      Close Ticket
                    </Button>
                  </div>

                  {/* Conversation */}
                  {selectedTicket.replies.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Conversation History</h4>
                      <ScrollShadow className="max-h-[300px]">
                        <div className="space-y-3">
                          {selectedTicket.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={`p-4 rounded-lg ${
                                reply.isFromAdmin
                                  ? "bg-success-50 border-l-4 border-success ml-8"
                                  : "bg-default-50 border-l-4 border-default-300 mr-8"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">
                                  {reply.isFromAdmin ? "Support Team" : reply.authorName}
                                </span>
                                <span className="text-xs text-default-500">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-default-700">
                                {reply.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollShadow>
                    </div>
                  )}

                  {/* Reply Form */}
                  {selectedTicket.status !== TicketStatus.CLOSED && (
                    <form onSubmit={handleReply} className="space-y-3">
                      <label className="block text-sm font-medium text-default-700">
                        Reply to Customer
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-default-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical min-h-[100px]"
                        placeholder="Type your reply to the customer..."
                        rows={4}
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                      />
                      <Button
                        type="submit"
                        color="primary"
                        isLoading={isReplying}
                        isDisabled={isReplying || !newReply.trim()}
                      >
                        {isReplying ? "Sending Reply..." : "Send Reply"}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}