import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

import { siteConfig } from "@/config/site";
import { GithubIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, getDocs, getDoc } from "firebase/firestore";

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
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [nutritionTotals, setNutritionTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [workoutGoal, setWorkoutGoal] = useState(3);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    const dateString = new Date().toISOString().split('T')[0];
    const docRef = doc(db, "users", user.uid, "nutrition", dateString);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
        
        Object.values(data).forEach((meal: any) => {
          if (Array.isArray(meal)) {
            meal.forEach((item: any) => {
              totals.calories += item.calories || 0;
              totals.protein += item.protein || 0;
              totals.carbs += item.carbs || 0;
              totals.fats += item.fats || 0;
            });
          }
        });
        setNutritionTotals(totals);
      } else {
        setNutritionTotals({ calories: 0, protein: 0, carbs: 0, fats: 0 });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch weekly workout completions
  useEffect(() => {
    const fetchWeeklyWorkouts = async () => {
      if (!user) return;

      try {
        // Get user's workout goal
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setWorkoutGoal(userData.weeklyWorkoutGoal || 3);
        }

        // Get workout logs
        const workoutLogsRef = collection(db, "users", user.uid, "workoutLogs");
        
        // Calculate start of current week (Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 is Sunday
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        
        const querySnapshot = await getDocs(workoutLogsRef);
        
        let count = 0;
        querySnapshot.forEach((doc) => {
          const dateStr = doc.id; // Date format: YYYY-MM-DD
          const data = doc.data();
          const completed = data.completed || [];
          
          // Check if date is within current week and has at least 1 completed exercise
          const logDate = new Date(dateStr);
          if (logDate >= startOfWeek && completed.length > 0) {
            count++;
          }
        });
        
        setWeeklyWorkouts(count);
      } catch (error) {
        console.error("Error fetching workout logs:", error);
      }
    };

    if (user) {
      fetchWeeklyWorkouts();
      // Refresh every minute to catch updates
      const interval = setInterval(fetchWeeklyWorkouts, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // If user is logged in, show dashboard/welcome page
  if (user && !loading) {
    const timeOfDay = new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening";

    return (
      <DefaultLayout>
        <section className="min-h-screen flex flex-col items-center justify-start pt-32 md:pt-40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden px-6 pb-20">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
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

          {/* Dashboard Content */}
          <div className="relative z-10 w-full max-w-6xl mx-auto">
             {/* Header */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-10 text-left"
             >
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 tracking-tight">
                  Good {timeOfDay}, <span className="text-indigo-400">{user.displayName || "User"}</span>
                </h1>
                <p className="text-gray-400 text-lg md:text-xl font-light">Here's your daily health overview.</p>
             </motion.div>

             {/* Bento Grid */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">
                
                {/* Nutrition - Hero Card (2x2) */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="md:col-span-2 md:row-span-2"
                >
                  <Card 
                    isPressable 
                    onPress={() => router.push('/nutrition')}
                    className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-white/10 backdrop-blur-md hover:scale-[1.02] transition-transform duration-300"
                  >
                    <CardBody className="p-8 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start">
                        <div className="p-4 bg-emerald-500/20 rounded-2xl backdrop-blur-sm border border-emerald-500/20">
                          <span className="text-4xl">🥗</span>
                        </div>
                        <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm text-white font-medium border border-white/5">
                          Daily Tracker
                        </span>
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2">Nutrition</h3>
                        <p className="text-gray-300 mb-6 text-lg">Track your calories, macros, and meals to hit your daily targets.</p>
                        
                        {/* Real Stats Visualization */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-emerald-400">Calories</span>
                            <span className="text-white">{nutritionTotals.calories} / 2,500 kcal</span>
                          </div>
                          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((nutritionTotals.calories / 2500) * 100, 100)}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" 
                            />
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Goals (1x1) */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="md:col-span-1 md:row-span-1"
                >
                  <Card 
                    isPressable 
                    onPress={() => router.push('/goals')}
                    className="w-full h-full bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-white/10 backdrop-blur-md hover:scale-[1.02] transition-transform duration-300"
                  >
                    <CardBody className="p-6 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/20">
                          <span className="text-2xl">🎯</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Goals</h3>
                        
                        {/* Workout Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-purple-300">Weekly Workouts</span>
                            <span className="text-white">{weeklyWorkouts} / {workoutGoal} days</span>
                          </div>
                          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((weeklyWorkouts / workoutGoal) * 100, 100)}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full" 
                            />
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Workout (1x1) */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="md:col-span-1 md:row-span-1"
                >
                  <Card 
                    isPressable 
                    onPress={() => router.push('/workout')}
                    className="w-full h-full bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-white/10 backdrop-blur-md hover:scale-[1.02] transition-transform duration-300"
                  >
                    <CardBody className="p-6 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/20">
                          <span className="text-2xl">💪</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">Workout</h3>
                        <p className="text-orange-200/70 text-sm">Log Activity</p>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>

                {/* AI Insights (3x1) - Wide Banner */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="md:col-span-3 md:row-span-1"
                >
                  <Card className="w-full h-full bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-white/10 backdrop-blur-md">
                    <CardBody className="p-6 flex flex-col md:flex-row items-center gap-6 h-full">
                      <div className="p-4 bg-blue-500/20 rounded-full shrink-0 border border-blue-500/20">
                        <span className="text-3xl">🧠</span>
                      </div>
                      <div className="flex-grow text-center md:text-left">
                        <h3 className="text-xl font-bold text-white mb-1">AI Health Insights</h3>
                        <p className="text-gray-300">Small insights that change everything</p>
                      </div>
                      <Button 
                        className="bg-white/10 text-white hover:bg-white/20 border border-white/10" 
                        variant="flat"
                        onPress={() => router.push("/ai-insights")}
                      >
                        View Report
                      </Button>
                    </CardBody>
                  </Card>
                </motion.div>

             </div>
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

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span
                className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600 bg-clip-text text-transparent animate-pulse"
                style={{
                  backgroundSize: "200% 200%",
                  animation: "gradient 3s ease infinite",
                }}
              >
                HealthTracker
              </span>
              <span className="text-white">AI</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
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
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button
              className="px-8 py-6 text-lg font-semibold text-white rounded-xl relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
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
              className="backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-lg px-8 py-6 transition-all duration-300"
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
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="glass rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
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
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">AI-Powered</span> Health
              Intelligence
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the future of healthcare with cutting-edge artificial
              intelligence that understands your unique health patterns and
              provides actionable insights.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
