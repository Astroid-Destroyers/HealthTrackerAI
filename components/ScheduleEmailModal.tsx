import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";

interface ScheduleEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser?: {
    email: string;
    displayName: string | null;
  };
}

export default function ScheduleEmailModal({ 
  isOpen, 
  onClose, 
  selectedUser 
}: ScheduleEmailModalProps) {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  const scheduleEmail = async () => {
    if (!selectedUser || !emailSubject.trim() || !emailMessage.trim() || !scheduledDate || !scheduledTime) {
      return;
    }

    setIsScheduling(true);

    try {
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <img src="https://healthtrackerai.xyz/icon-512x512.png" alt="HealthTrackerAI" style="width: 60px; height: 60px; margin-bottom: 15px;">
            <h1 style="color: white; margin: 0;">HealthTrackerAI</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="white-space: pre-line; color: #333; line-height: 1.6;">
              ${emailMessage.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>© 2025 HealthTrackerAI. All rights reserved.</p>
            <p>
              <a href="https://healthtrackerai.xyz" style="color: #667eea;">Visit Website</a>
            </p>
          </div>
        </div>
      `;

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const idToken = await user.getIdToken();

      const response = await fetch("/api/admin/scheduled-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          to: selectedUser.email,
          subject: emailSubject,
          html: htmlContent,
          text: emailMessage,
          scheduledFor: scheduledFor.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Email scheduled successfully!");
        setEmailSubject("");
        setEmailMessage("");
        setScheduledDate("");
        setScheduledTime("");
        onClose();
      } else {
        alert(`Failed to schedule email: ${data.error}`);
      }
    } catch (error) {
      console.error("Error scheduling email:", error);
      alert("Failed to schedule email. Please try again.");
    } finally {
      setIsScheduling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white/95 backdrop-blur-md shadow-2xl border-0 ring-1 ring-gray-200/50">
        <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200/30">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Schedule Email to {selectedUser?.displayName || selectedUser?.email}
            </h3>
            <p className="text-sm text-gray-600">
              To: {selectedUser?.email}
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 bg-white/90">
          <Input
            label="Subject"
            placeholder="Enter email subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            classNames={{
              base: "bg-white",
              inputWrapper: "bg-white border-gray-300 hover:border-purple-400 focus-within:border-purple-500 shadow-sm",
              input: "text-gray-900",
            }}
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-800">
              Message
            </label>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-400"
              placeholder="Enter your email message here..."
              value={emailMessage}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailMessage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Scheduled Date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              classNames={{
                base: "bg-white",
                inputWrapper: "bg-white border-gray-300 hover:border-purple-400 focus-within:border-purple-500 shadow-sm",
                input: "text-gray-900",
              }}
            />
            <Input
              type="time"
              label="Scheduled Time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              classNames={{
                base: "bg-white",
                inputWrapper: "bg-white border-gray-300 hover:border-purple-400 focus-within:border-purple-500 shadow-sm",
                input: "text-gray-900",
              }}
            />
          </div>

          <div className="bg-gradient-to-br from-purple-50/50 to-blue-50/30 p-4 rounded-lg border border-gray-200/50 shadow-sm">
            <p className="text-sm font-medium text-gray-800 mb-2">
              📅 Scheduling Info:
            </p>
            <p className="text-sm text-gray-600">
              The email will be sent automatically at the scheduled date and time. 
              Make sure to set a future date and time.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white rounded-b-lg -mx-6 px-6 -mb-6 pb-6">
            <Button
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
              isDisabled={!emailSubject.trim() || !emailMessage.trim() || !scheduledDate || !scheduledTime}
              isLoading={isScheduling}
              onPress={scheduleEmail}
            >
              {isScheduling ? "Scheduling..." : "Schedule Email"}
            </Button>
            <Button
              className="px-6 bg-white/80 border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200"
              variant="flat"
              onPress={() => {
                onClose();
                setEmailSubject("");
                setEmailMessage("");
                setScheduledDate("");
                setScheduledTime("");
              }}
            >
              Cancel
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}