import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AIInsightsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const fetchUserData = async () => {
    if (!user) return { nutritionData: null, workoutData: null, workoutLogs: null };

    try {
      // Fetch nutrition data
      const nutritionRef = collection(db, 'users', user.uid, 'nutrition');
      const nutritionSnapshot = await getDocs(nutritionRef);
      
      let nutritionSummary = '';
      nutritionSnapshot.forEach(doc => {
        const date = doc.id;
        const data = doc.data();
        
        let dayTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
        Object.values(data).forEach((meal: any) => {
          if (Array.isArray(meal)) {
            meal.forEach((item: any) => {
              dayTotals.calories += item.calories || 0;
              dayTotals.protein += item.protein || 0;
              dayTotals.carbs += item.carbs || 0;
              dayTotals.fats += item.fats || 0;
            });
          }
        });
        
        nutritionSummary += `${date}: ${dayTotals.calories} cal, ${dayTotals.protein}g protein, ${dayTotals.carbs}g carbs, ${dayTotals.fats}g fats\n`;
      });

      // Fetch workout schedule
      const scheduleRef = collection(db, 'users', user.uid, 'workoutSchedule');
      const scheduleSnapshot = await getDocs(scheduleRef);
      
      let workoutSummary = '';
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      days.forEach(day => {
        const doc = scheduleSnapshot.docs.find(d => d.id === day);
        if (doc) {
          const exercises = doc.data().exercises || [];
          if (exercises.length > 0) {
            workoutSummary += `${day}: `;
            workoutSummary += exercises.map((ex: any) => 
              `${ex.name} (${ex.sets}x${ex.reps}${ex.weight ? ', ' + ex.weight : ''})`
            ).join(', ');
            workoutSummary += '\n';
          }
        }
      });

      // Fetch workout logs
      const logsRef = collection(db, 'users', user.uid, 'workoutLogs');
      const logsSnapshot = await getDocs(logsRef);
      
      let logsSummary = '';
      logsSnapshot.forEach(doc => {
        const date = doc.id;
        const completed = doc.data().completed || [];
        if (completed.length > 0) {
          logsSummary += `${date}: Completed ${completed.length} exercises\n`;
        }
      });

      return {
        nutritionData: nutritionSummary || null,
        workoutData: workoutSummary || null,
        workoutLogs: logsSummary || null
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { nutritionData: null, workoutData: null, workoutLogs: null };
    }
  };

  const colorizeNutritionText = (text: string) => {
    // Regex patterns for nutrition terms with numbers
    const patterns = [
      { regex: /(\d+\.?\d*)\s*(cal|calorie|calories|kcal)/gi, color: 'text-yellow-400', label: 'calories' },
      { regex: /(\d+\.?\d*)\s*g?\s*(protein|proteins)/gi, color: 'text-red-400', label: 'protein' },
      { regex: /(\d+\.?\d*)\s*g?\s*(carb|carbs|carbohydrate|carbohydrates)/gi, color: 'text-blue-400', label: 'carbs' },
      { regex: /(\d+\.?\d*)\s*g?\s*(fat|fats)/gi, color: 'text-green-400', label: 'fats' }
    ];

    let parts: { text: string; color?: string; key: string }[] = [{ text, key: '0' }];

    patterns.forEach(({ regex, color }) => {
      const newParts: { text: string; color?: string; key: string }[] = [];
      
      parts.forEach((part) => {
        if (part.color) {
          // Already colored, don't process
          newParts.push(part);
          return;
        }

        const matches: { match: string; index: number }[] = [];
        let match;
        regex.lastIndex = 0;
        
        while ((match = regex.exec(part.text)) !== null) {
          matches.push({ match: match[0], index: match.index });
        }

        if (matches.length === 0) {
          newParts.push(part);
          return;
        }

        let lastIndex = 0;
        matches.forEach((m, idx) => {
          // Add text before match
          if (m.index > lastIndex) {
            newParts.push({ 
              text: part.text.slice(lastIndex, m.index), 
              key: `${part.key}-${idx}-before` 
            });
          }
          
          // Add colored match
          newParts.push({ 
            text: m.match, 
            color, 
            key: `${part.key}-${idx}-match` 
          });
          
          lastIndex = m.index + m.match.length;
        });

        // Add remaining text
        if (lastIndex < part.text.length) {
          newParts.push({ 
            text: part.text.slice(lastIndex), 
            key: `${part.key}-after` 
          });
        }
      });

      parts = newParts;
    });

    return parts;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoadingChat || !user) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setIsLoadingChat(true);

    try {
      // Fetch user data on client side (where user is authenticated)
      const userData = await fetchUserData();

      const res = await fetch('/api/health-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          nutritionData: userData.nutritionData,
          workoutData: userData.workoutData,
          workoutLogs: userData.workoutLogs
        }),
      });

      const data = await res.json();
      
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not generate a response.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  if (loading || !user) return null;

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pb-20 pt-20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto max-w-5xl px-4 pt-8 h-[calc(100vh-160px)] flex flex-col relative z-10">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onPress={() => router.push("/")}
            >
              ← Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <span className="text-2xl">🤖</span>
                </div>
                  <div>
                  <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    AI Health Coach
                  </h1>
                  <p className="text-gray-300 text-sm font-semibold">Your personal fitness and nutrition advisor</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chat Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 flex flex-col bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl"
          >
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
              {chatMessages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mt-16"
                >
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-7xl mb-6 inline-block"
                  >
                    🤖
                  </motion.div>
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
                    Hello! I'm your AI Health Coach
                  </h2>
                  <p className="text-gray-300 font-medium mb-8 max-w-md mx-auto">
                    I have access to your nutrition and workout data. Ask me anything about your fitness journey!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {[
                      { icon: "📊", text: "How has my nutrition been this week?", gradient: "from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30" },
                      { icon: "💪", text: "Am I hitting my protein goals?", gradient: "from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30" },
                      { icon: "🎯", text: "What should I focus on to improve?", gradient: "from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30" },
                      { icon: "✅", text: "Review my workout consistency", gradient: "from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30" }
                    ].map((item, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        onClick={() => setChatInput(item.text)}
                        className={`bg-gradient-to-br ${item.gradient} border border-white/10 rounded-xl p-4 text-left transition-all group`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                          <span className="text-sm font-semibold text-gray-100 group-hover:text-white transition-colors">
                            {item.text}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {chatMessages.map((msg, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 mt-1">
                      <span className="text-sm">🤖</span>
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 text-gray-100 border border-white/10 backdrop-blur-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {colorizeNutritionText(msg.content).map((part) => (
                          <span key={part.key} className={part.color || ''}>
                            {part.text}
                          </span>
                        ))}
                      </p>
                    ) : (
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isLoadingChat && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 mt-1">
                    <span className="text-sm">🤖</span>
                  </div>
                  <div className="bg-gradient-to-br from-slate-700/80 to-slate-800/80 rounded-2xl px-5 py-4 border border-white/10 backdrop-blur-sm">
                    <div className="flex gap-1.5">
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                      />
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-pink-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
              <div className="flex gap-3">
                <Input
                  placeholder="Ask about your health and fitness..."
                  value={chatInput}
                  onValueChange={setChatInput}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={isLoadingChat}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    inputWrapper: "border-white/20 hover:border-purple-400/50 focus-within:border-purple-400 bg-slate-800/50 backdrop-blur-sm transition-colors",
                    input: "text-white font-medium text-base placeholder:text-gray-500"
                  }}
                />
                <Button 
                  isIconOnly
                  color="primary"
                  isLoading={isLoadingChat}
                  onPress={handleSendMessage}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/25 transition-all hover:scale-105"
                >
                  <span className="text-xl">↑</span>
                </Button>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-2 text-center">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </DefaultLayout>
  );
}
