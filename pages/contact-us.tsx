import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";

import DefaultLayout from "@/layouts/default";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Contact Us</h1>
          <p className="text-center text-default-600">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Get in Touch</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <h3 className="font-medium text-default-700 mb-2">Email</h3>
                <p className="text-default-600">support@healthtrackerai.com</p>
              </div>
              <div>
                <h3 className="font-medium text-default-700 mb-2">Response Time</h3>
                <p className="text-default-600">We typically respond within 24-48 hours</p>
              </div>
              <div>
                <h3 className="font-medium text-default-700 mb-2">Support Hours</h3>
                <p className="text-default-600">Monday - Friday, 9 AM - 6 PM EST</p>
              </div>
            </CardBody>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Send us a Message</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  isRequired
                  size="lg"
                />

                <Input
                  label="Email"
                  placeholder="your.email@example.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  isRequired
                  size="lg"
                />

                <Input
                  label="Subject"
                  placeholder="What's this about?"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  isRequired
                  size="lg"
                />

                <div>
                  <label
                    className="block text-sm font-medium text-default-700 mb-2"
                    htmlFor="message"
                  >
                    Message
                  </label>
                  <textarea
                    required
                    className="w-full px-3 py-2 border border-default-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical min-h-[100px]"
                    id="message"
                    placeholder="Tell us more about your question or feedback..."
                    rows={4}
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
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>

                {submitStatus === "success" && (
                  <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                    <p className="text-success-700 text-sm">
                      Thank you for your message! We'll get back to you soon.
                    </p>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-danger-700 text-sm">
                      Sorry, there was an error sending your message. Please try again.
                    </p>
                  </div>
                )}
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}