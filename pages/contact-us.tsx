import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";

import { useAuth } from "@/providers/AuthProvider";
import DefaultLayout from "@/layouts/default";
import { 
  createTicket, 
  getUserTickets, 
  subscribeToUserTickets,
  addTicketReply,
  markTicketAsRead 
} from "@/utils/tickets";
import { 
  Ticket, 
  TicketPriority, 
  TicketStatus, 
  CreateTicketData,
  CreateReplyData
} from "@/types/tickets";

export default function ContactPage() {
  const { user } = useAuth();

  // Permission check: Only allow logged-in users
  if (!user) {
    return (
      <DefaultLayout>
        <div className="container mx-auto max-w-2xl px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-danger mb-4">
              Access Denied
            </h1>
            <p className="text-default-600 mb-4">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      </DefaultLayout>
    );
  }
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: TicketPriority.NORMAL,
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newReply, setNewReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  // Load tickets on component mount
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const userTickets = await getUserTickets();
        setTickets(userTickets);
      } catch (error) {
        console.error("Error loading tickets:", error);
      }
    };

    loadTickets();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserTickets((updatedTickets) => {
      setTickets(updatedTickets);
      
      // Update selected ticket if it exists in the updated list
      if (selectedTicket) {
        const updatedSelectedTicket = updatedTickets.find(t => t.id === selectedTicket.id);
        if (updatedSelectedTicket) {
          setSelectedTicket(updatedSelectedTicket);
        }
      }
    });

    return unsubscribe;
  }, [selectedTicket]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const ticketData: CreateTicketData = {
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
      };

      const ticketId = await createTicket(ticketData);
      setSubmitStatus("success");
      setFormData({
        subject: "",
        message: "",
        priority: TicketPriority.NORMAL,
      });

      // Auto-select the newly created ticket
      setTimeout(() => {
        const newTicket = tickets.find(t => t.id === ticketId);
        if (newTicket) {
          setSelectedTicket(newTicket);
        }
      }, 500);

    } catch (error) {
      console.error("Error creating ticket:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
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
        isFromAdmin: false,
        authorName: user?.displayName || "Anonymous User",
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

  const handleTicketClick = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    
    // Mark as read when user opens the ticket
    if (!ticket.isRead) {
      try {
        await markTicketAsRead(ticket.id, false);
      } catch (error) {
        console.error("Error marking ticket as read:", error);
      }
    }
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

  return (
    <DefaultLayout>
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Support Center</h1>
          <p className="text-center text-default-600">
            Create tickets and track your support requests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Create Ticket Form */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Create New Ticket</h2>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Subject"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    isRequired
                    size="lg"
                  />

                  <Select
                    label="Priority"
                    placeholder="Select priority level"
                    selectedKeys={[formData.priority]}
                    onSelectionChange={(keys) => {
                      const priority = Array.from(keys)[0] as TicketPriority;
                      handleInputChange("priority", priority);
                    }}
                  >
                    <SelectItem key={TicketPriority.LOW}>
                      Low
                    </SelectItem>
                    <SelectItem key={TicketPriority.NORMAL}>
                      Normal
                    </SelectItem>
                    <SelectItem key={TicketPriority.HIGH}>
                      High
                    </SelectItem>
                    <SelectItem key={TicketPriority.URGENT}>
                      Urgent
                    </SelectItem>
                  </Select>

                  <div>
                    <label
                      className="block text-sm font-medium text-default-700 mb-2"
                      htmlFor="message"
                    >
                      Message
                    </label>
                    <textarea
                      required
                      className="w-full px-3 py-2 border border-default-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical min-h-[120px]"
                      id="message"
                      placeholder="Describe your issue in detail..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isSubmitting}
                    isDisabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Ticket..." : "Create Ticket"}
                  </Button>

                  {submitStatus === "success" && (
                    <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                      <p className="text-success-700 text-sm">
                        Ticket created successfully! We'll respond as soon as possible.
                      </p>
                    </div>
                  )}

                  {submitStatus === "error" && (
                    <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                      <p className="text-danger-700 text-sm">
                        Error creating ticket. Please try again.
                      </p>
                    </div>
                  )}
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Right Panel - Ticket Viewer */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Your Tickets</h2>
              </CardHeader>
              <CardBody>
                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-default-500">No tickets yet. Create your first ticket!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Ticket List */}
                    <ScrollShadow className="max-h-[400px]">
                      <div className="space-y-2">
                        {tickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedTicket?.id === ticket.id
                                ? "border-primary bg-primary-50"
                                : "border-default-300 hover:border-default-400"
                            }`}
                            onClick={() => handleTicketClick(ticket)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-sm truncate flex-1">
                                {ticket.subject}
                              </h3>
                              {!ticket.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full ml-2 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex gap-2">
                                <Chip
                                  size="sm"
                                  color={getStatusColor(ticket.status)}
                                  variant="flat"
                                >
                                  {getStatusLabel(ticket.status)}
                                </Chip>
                                <Chip
                                  size="sm"
                                  color={getPriorityColor(ticket.priority)}
                                  variant="dot"
                                >
                                  {ticket.priority}
                                </Chip>
                              </div>
                              <span className="text-xs text-default-500">
                                {formatDate(ticket.updatedAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollShadow>

                    {/* Selected Ticket Details */}
                    {selectedTicket && (
                      <div className="border-t pt-4">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-2">
                              {selectedTicket.subject}
                            </h3>
                            <p className="text-default-600 text-sm mb-3">
                              {selectedTicket.message}
                            </p>
                          </div>

                          {/* Replies */}
                          {selectedTicket.replies.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium">Conversation</h4>
                              <ScrollShadow className="max-h-[200px]">
                                <div className="space-y-2">
                                  {selectedTicket.replies.map((reply) => (
                                    <div
                                      key={reply.id}
                                      className={`p-3 rounded-lg ${
                                        reply.isFromAdmin
                                          ? "bg-primary-50 border-l-4 border-primary"
                                          : "bg-default-50 border-l-4 border-default-300"
                                      }`}
                                    >
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-medium">
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
                              <textarea
                                className="w-full px-3 py-2 border border-default-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical min-h-[80px]"
                                placeholder="Type your reply..."
                                rows={3}
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                              />
                              <Button
                                type="submit"
                                color="primary"
                                size="sm"
                                className="w-full"
                                isLoading={isReplying}
                                isDisabled={isReplying || !newReply.trim()}
                              >
                                {isReplying ? "Sending..." : "Send Reply"}
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}