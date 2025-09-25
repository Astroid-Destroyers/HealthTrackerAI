import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { siteConfig } from "@/config/site";
import { GithubIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/providers/AuthProvider";

const features = [
  {
    icon: "🧠",
    title: "AI-Powered Analytics",
    description:
      "Advanced machine learning algorithms analyze your health data to provide personalized insights and recommendations.",
  },
  {
    icon: "📊",
    title: "Smart Health Tracking",
    description:
      "Monitor vital signs, symptoms, and wellness metrics with intelligent pattern recognition and predictive analytics.",
  },
  {
    icon: "🔒",
    title: "Privacy-First Design",
    description:
      "Your health data is encrypted and secure, with complete control over who can access your information.",
  },
  {
    icon: "🚀",
    title: "Real-time Monitoring",
    description:
      "Get instant alerts and notifications about important health changes and improvement opportunities.",
  },
];

const stats = [
  { value: "99.9%", label: "Accuracy Rate" },
  { value: "50K+", label: "Active Users" },
  { value: "24/7", label: "AI Monitoring" },
  { value: "HIPAA", label: "Compliant" },
];

export default function IndexPage() {
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // If user is logged in, show dashboard/welcome page
  if (user && !loading) {
    return (
      <DefaultLayout>
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              }}
              transition={{ duration: 20, repeat: Infinity }}
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0],
              }}
              className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl"
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
              }}
              transition={{ duration: 25, repeat: Infinity }}
            />
          </div>

          {/* Welcome Content */}
          <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
              initial={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome Back
                </span>
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-4">
                {user.displayName || user.email?.split("@")[0] || "User"}! 👋
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 font-light leading-relaxed max-w-2xl mx-auto px-4">
                Ready to continue your AI-powered health journey?
              </p>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h3 className="text-2xl font-semibold text-white mb-4">
                Your Health Dashboard
              </h3>
              <p className="text-gray-300 text-lg mb-6">
                Your personalized AI health insights and recommendations are
                being prepared.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                  <CardBody className="text-center p-6">
                    <div className="text-3xl mb-2">📊</div>
                    <h4 className="text-white font-semibold">Health Metrics</h4>
                    <p className="text-gray-400 text-sm">Coming Soon</p>
                  </CardBody>
                </Card>
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                  <CardBody className="text-center p-6">
                    <div className="text-3xl mb-2">🧠</div>
                    <h4 className="text-white font-semibold">AI Insights</h4>
                    <p className="text-gray-400 text-sm">Coming Soon</p>
                  </CardBody>
                </Card>
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                  <CardBody className="text-center p-6">
                    <div className="text-3xl mb-2">🎯</div>
                    <h4 className="text-white font-semibold">Goals</h4>
                    <p className="text-gray-400 text-sm">Coming Soon</p>
                  </CardBody>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>
      </DefaultLayout>
    );
  }

  // If loading, show loading state
  if (loading) {
    return (
      <DefaultLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <motion.div
            animate={{ rotate: 360 }}
            className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </DefaultLayout>
    );
  }

  // If not logged in, show marketing homepage
  return (
    <DefaultLayout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0.8, 0.6],
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-60"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
            }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>

        <div className="relative z-10 container mx-auto max-w-7xl px-6 text-center">
          <motion.div
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Chip
              className="mb-6 border-white/20 text-white backdrop-blur-xl bg-white/10"
              size="lg"
              variant="bordered"
            >
              🚀 Next-Gen AI Health Platform
            </Chip>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight px-4">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600 bg-clip-text text-transparent animate-pulse health-tracker-gradient">
                HealthTracker
              </span>
              <span className="text-white">AI</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed px-6">
              Revolutionize your wellness journey with AI-powered health
              insights. Get personalized recommendations, predictive analytics,
              and real-time monitoring that adapts to your unique health
              profile.
            </p>
          </motion.div>

          {!loading && user && (
            <motion.div
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-md mx-auto mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome back,{" "}
                  {user.displayName || user.email?.split("@")[0] || "User"}! 👋
                </h2>
                <p className="text-gray-300">
                  Your AI health assistant is ready to help you achieve your
                  wellness goals.
                </p>
              </div>
            </motion.div>
          )}

          <motion.div
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 px-6"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button
              className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold text-white rounded-xl relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl min-h-[56px]"
              size="lg"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
              }}
            >
              Start Your AI Health Journey
            </Button>

            <Button
              isExternal
              as={Link}
              className="w-full sm:w-auto backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 transition-all duration-300 min-h-[56px]"
              href={siteConfig.links.docs}
              size="lg"
              variant="bordered"
            >
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto px-6"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass rounded-xl p-3 sm:p-4 text-center"
              >
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">
              <span className="gradient-text">AI-Powered</span> Health
              Intelligence
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto px-4">
              Experience the future of healthcare with cutting-edge artificial
              intelligence that understands your unique health patterns and
              provides actionable insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Card className="ai-card h-full cursor-pointer group">
                  <CardBody className="p-6">
                    <div className="text-4xl mb-4 group-hover:animate-neural-pulse">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 neural-bg relative overflow-hidden">
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Health?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already experiencing the power of
              AI-driven health insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="btn-ai-primary text-lg px-8 py-6" size="lg">
                Get Started Free
              </Button>
              <Button
                isExternal
                as={Link}
                className="glass-strong border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6"
                href={siteConfig.links.github}
                size="lg"
                startContent={<GithubIcon size={20} />}
                variant="bordered"
              >
                View on GitHub
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Background animation */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            className="absolute top-10 left-10 w-32 h-32 bg-ai-gradient rounded-full blur-2xl"
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.8, 0.4],
            }}
            className="absolute bottom-10 right-10 w-40 h-40 bg-ai-gradient-secondary rounded-full blur-2xl"
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>
      </section>
    </DefaultLayout>
  );
}
