// Centralized imports for admin ticket system

import { useState, useEffect } from "react";
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
