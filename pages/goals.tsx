import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, addDoc, query, orderBy, getDocs, Timestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Progress } from "@heroui/progress";
import { useAuth } from "@/providers/AuthProvider";
import DefaultLayout from "@/layouts/default";

interface UserProfile {
  name: string;
  gender: string;
  height: {
    feet: string;
    inches: string;
    cm: string;
    unit: 'imperial' | 'metric';
  };
  weight: {
    pounds: string;
    kg: string;
    unit: 'imperial' | 'metric';
  };
  goal: string;
  email: string;
  weeklyWorkoutGoal?: number;
  createdAt: any;
  updatedAt: any;
}

interface WeightEntry {
  id: string;
  weight: number;
  unit: 'imperial' | 'metric';
  date: Timestamp;
  note?: string;
}

export default function GoalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  
  // Weight tracking states
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightNote, setWeightNote] = useState('');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [showLogWeightModal, setShowLogWeightModal] = useState(false);

  // Workout tracking states
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [showWorkoutGoalModal, setShowWorkoutGoalModal] = useState(false);
  const [newWorkoutGoal, setNewWorkoutGoal] = useState('');
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading]);

  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;
      
      setProfileLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setUserProfile(data);
          setEditedProfile(data);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user?.uid) {
      fetchUserProfile();
    }
  }, [user?.uid]);

  // Fetch weight entries from Firestore
  useEffect(() => {
    const fetchWeightEntries = async () => {
      if (!user?.uid) return;
      
      try {
        const weightEntriesRef = collection(db, "users", user.uid, "weightEntries");
        const q = query(weightEntriesRef, orderBy("date", "asc"));
        const querySnapshot = await getDocs(q);
        
        const entries: WeightEntry[] = [];
        querySnapshot.forEach((doc) => {
          entries.push({
            id: doc.id,
            ...doc.data()
          } as WeightEntry);
        });
        
        setWeightEntries(entries);
      } catch (error) {
        console.error("Error fetching weight entries:", error);
      } finally {
        setEntriesLoaded(true);
      }
    };

    if (user?.uid) {
      fetchWeightEntries();
    }
  }, [user?.uid]);

  // Fetch weekly workouts from workoutLogs (count days with at least 1 completed exercise)
  useEffect(() => {
    const fetchWeeklyWorkouts = async () => {
      if (!user?.uid) return;

      try {
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

    if (user?.uid) {
      fetchWeeklyWorkouts();
    }
  }, [user?.uid]);

  // Sync initial profile weight to weightEntries if empty
  useEffect(() => {
    const syncInitialWeight = async () => {
      if (!user?.uid || !userProfile || !entriesLoaded || weightEntries.length > 0) return;
      
      try {
        const weightVal = userProfile.weight.unit === 'imperial' 
          ? parseFloat(userProfile.weight.pounds || '0')
          : parseFloat(userProfile.weight.kg || '0');
          
        if (weightVal > 0) {
           const weightEntriesRef = collection(db, "users", user.uid, "weightEntries");
           const newEntry = {
             weight: weightVal,
             unit: userProfile.weight.unit,
             date: userProfile.createdAt || Timestamp.now(),
             note: 'Initial weight'
           };
           
           const docRef = await addDoc(weightEntriesRef, newEntry);
           setWeightEntries([{ id: docRef.id, ...newEntry } as WeightEntry]);
        }
      } catch (e) {
        console.error("Error syncing initial weight", e);
      }
    };
    
    syncInitialWeight();
  }, [user?.uid, userProfile, entriesLoaded, weightEntries.length]);

  // Log new weight entry
  const handleLogWeight = async () => {
    if (!user?.uid || !newWeight || !userProfile) return;
    
    setIsLoggingWeight(true);
    try {
      const weightEntriesRef = collection(db, "users", user.uid, "weightEntries");
      const newEntry: any = {
        weight: parseFloat(newWeight),
        unit: userProfile.weight?.unit || 'imperial',
        date: Timestamp.now(),
      };
      
      // Only add note if it has a value
      if (weightNote && weightNote.trim()) {
        newEntry.note = weightNote.trim();
      }
      
      const docRef = await addDoc(weightEntriesRef, newEntry);
      
      // Add to local state
      setWeightEntries([...weightEntries, { id: docRef.id, ...newEntry }]);
      
      // Also update the user's current weight
      const userDocRef = doc(db, "users", user.uid);
      const weightUpdate = userProfile.weight?.unit === 'imperial' 
        ? { ...userProfile.weight, pounds: newWeight }
        : { ...userProfile.weight, kg: newWeight };
      
      await updateDoc(userDocRef, {
        weight: weightUpdate,
        updatedAt: new Date(),
      });
      
      setUserProfile({ ...userProfile, weight: weightUpdate });
      setEditedProfile({ ...userProfile, weight: weightUpdate });
      
      // Reset form
      setNewWeight('');
      setWeightNote('');
      setShowLogWeightModal(false);
    } catch (error: any) {
      console.error("Error logging weight:", error);
      alert(`Failed to log weight: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoggingWeight(false);
    }
  };

  const handleLogWorkout = async () => {
    if (!user?.uid) return;
    
    setIsLoggingWorkout(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      const workoutLogRef = doc(db, "users", user.uid, "workoutLogs", dateStr);
      const workoutLogDoc = await getDoc(workoutLogRef);
      
      if (!workoutLogDoc.exists() || !workoutLogDoc.data()?.completed?.length) {
        // Only increment if this is the first workout logged today
        setWeeklyWorkouts(prev => prev + 1);
      }
      
      // Note: This just triggers a re-fetch, actual workout completion happens in workout.tsx
      alert("Please mark exercises as completed on the Workout page to log workouts!");
    } catch (error) {
      console.error("Error logging workout:", error);
      alert("Failed to log workout");
    } finally {
      setIsLoggingWorkout(false);
    }
  };

  const handleUpdateWorkoutGoal = async () => {
    if (!user?.uid || !newWorkoutGoal || !userProfile) return;
    
    try {
      const goal = parseInt(newWorkoutGoal);
      if (isNaN(goal) || goal < 1) return;

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        weeklyWorkoutGoal: goal,
        updatedAt: new Date(),
      });
      
      setUserProfile({ ...userProfile, weeklyWorkoutGoal: goal });
      setEditedProfile({ ...userProfile, weeklyWorkoutGoal: goal });
      setShowWorkoutGoalModal(false);
      setNewWorkoutGoal('');
    } catch (error) {
      console.error("Error updating workout goal:", error);
      alert("Failed to update goal");
    }
  };

  const handleResetData = async () => {
    if (!user?.uid || !confirm("Are you sure you want to reset all progress data? This cannot be undone.")) return;

    try {
      // Delete weight entries
      const weightEntriesRef = collection(db, "users", user.uid, "weightEntries");
      const weightSnapshot = await getDocs(weightEntriesRef);
      const deletePromises = weightSnapshot.docs.map(doc => deleteDoc(doc.ref));

      await Promise.all([...deletePromises]);

      // Reset local state
      setWeightEntries([]);
      setWeeklyWorkouts(0);
      setEntriesLoaded(false); // Trigger re-sync of initial weight
      
      alert("Weight data reset successfully. Note: Workout logs are managed from the Workout page.");
    } catch (error) {
      console.error("Error resetting data:", error);
      alert("Failed to reset data");
    }
  };

  // Calculate progress stats
  const getProgressStats = () => {
    if (weightEntries.length === 0) return null;
    
    const startWeight = weightEntries[0].weight;
    const currentWeight = weightEntries[weightEntries.length - 1].weight;
    const change = currentWeight - startWeight;
    const unit = userProfile?.weight?.unit === 'imperial' ? 'lbs' : 'kg';
    
    // Determine if progress is positive based on goal
    let isPositiveProgress = false;
    if (userProfile?.goal === 'lose-weight') {
      isPositiveProgress = change < 0;
    } else if (userProfile?.goal === 'gain-weight') {
      isPositiveProgress = change > 0;
    } else {
      isPositiveProgress = Math.abs(change) < 2; // Maintaining within 2 units
    }
    
    return {
      startWeight,
      currentWeight,
      change,
      unit,
      isPositiveProgress,
      entries: weightEntries.length
    };
  };

  // Helper functions to format profile data
  const formatHeight = (height: UserProfile['height']) => {
    if (!height) return "Not provided";
    
    if (height.unit === 'imperial') {
      const feet = height.feet || '0';
      const inches = height.inches || '0';
      return `${feet}' ${inches}"`;
    } else {
      return `${height.cm || '0'} cm`;
    }
  };

  const formatWeight = (weight: UserProfile['weight']) => {
    if (!weight) return "Not provided";
    
    if (weight.unit === 'imperial') {
      return `${weight.pounds || '0'} lbs`;
    } else {
      return `${weight.kg || '0'} kg`;
    }
  };

  const formatGoal = (goal: string) => {
    const goalMap: { [key: string]: string } = {
      'lose-weight': 'Lose Weight',
      'gain-weight': 'Gain Weight',
      'maintain-weight': 'Maintain Weight'
    };
    return goalMap[goal] || goal;
  };

  const formatGender = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      'male': 'Male',
      'female': 'Female',
      'prefer-not-to-say': 'Prefer not to say'
    };
    return genderMap[gender] || gender;
  };

  const getGoalIcon = (goal: string) => {
    const iconMap: { [key: string]: string } = {
      'lose-weight': '🔥',
      'gain-weight': '💪',
      'maintain-weight': '⚖️'
    };
    return iconMap[goal] || '🎯';
  };

  const getGoalColor = (goal: string) => {
    const colorMap: { [key: string]: string } = {
      'lose-weight': 'from-orange-500 to-red-500',
      'gain-weight': 'from-green-500 to-emerald-500',
      'maintain-weight': 'from-blue-500 to-cyan-500'
    };
    return colorMap[goal] || 'from-purple-500 to-pink-500';
  };

  const handleSaveField = async (field: string) => {
    if (!user?.uid || !editedProfile) return;
    
    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        ...editedProfile,
        updatedAt: new Date(),
      });
      
      setUserProfile(editedProfile);
      setEditingField(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelField = () => {
    setEditedProfile(userProfile);
    setEditingField(null);
  };

  const updateEditedProfile = (field: keyof UserProfile, value: any) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      [field]: value,
    });
  };

  if (loading || profileLoading) {
    return (
      <DefaultLayout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <motion.div
            animate={{ rotate: 360 }}
            className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </DefaultLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DefaultLayout>
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 pt-24 pb-12 px-6">
          <div className="container mx-auto max-w-6xl">
            {/* Header */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex justify-between items-center mb-6">
                <Button
                  className="backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20"
                  size="sm"
                  variant="bordered"
                  onPress={() => router.push("/")}
                >
                  ← Back to Dashboard
                </Button>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Your Health Goals
                </span>
              </h1>
              <p className="text-xl text-gray-300">
                Track your progress and stay motivated
              </p>
            </motion.div>

            {userProfile ? (
              <>
                {/* Weekly Workout Progress */}
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                    <CardBody className="p-6">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">Weekly Workout Days</h3>
                          <p className="text-gray-400 text-sm">
                            {weeklyWorkouts} of {userProfile.weeklyWorkoutGoal || 3} days completed this week
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            className="bg-white/10 text-white"
                            onPress={() => {
                              setNewWorkoutGoal((userProfile.weeklyWorkoutGoal || 3).toString());
                              setShowWorkoutGoalModal(true);
                            }}
                          >
                            Edit Goal
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                            onPress={() => router.push('/workout')}
                          >
                            Go to Workouts →
                          </Button>
                        </div>
                      </div>
                      <Progress 
                        value={weeklyWorkouts} 
                        maxValue={userProfile.weeklyWorkoutGoal || 3}
                        color="success"
                        className="h-3"
                        classNames={{
                          indicator: "bg-gradient-to-r from-indigo-500 to-purple-500",
                          track: "bg-white/10"
                        }}
                      />
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Main Goal Card */}
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Card className={`backdrop-blur-xl bg-gradient-to-br ${getGoalColor(userProfile.goal)} border border-white/20 shadow-2xl`}>
                    <CardBody className="p-8 relative">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white"
                        onPress={() => setEditingField('goal')}
                      >
                        ✏️
                      </Button>
                      <div className="text-center">
                        <div className="text-6xl mb-4">{getGoalIcon(userProfile.goal)}</div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {formatGoal(userProfile.goal)}
                        </h2>
                        <p className="text-white/80 text-lg">
                          Your primary fitness goal
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Profile Stats Grid Removed */}

                {/* Weight Progress Section */}
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                    <CardHeader className="flex justify-between items-center px-6 pt-6">
                      <h3 className="text-2xl font-bold text-white">📈 Weight Progress</h3>
                      <Button
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold"
                        size="sm"
                        onPress={() => setShowLogWeightModal(true)}
                      >
                        + Log Weight
                      </Button>
                    </CardHeader>
                    <CardBody className="p-6">
                      {(() => {
                        const stats = getProgressStats();
                        
                        if (!stats || weightEntries.length === 0) {
                          return (
                            <div className="text-center py-12">
                              <div className="text-6xl mb-4 opacity-50">📊</div>
                              <h4 className="text-xl font-semibold text-white mb-2">No Weight Entries Yet</h4>
                              <p className="text-gray-400 mb-6">Start logging your weight to track your progress!</p>
                              <Button
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                onPress={() => setShowLogWeightModal(true)}
                              >
                                Log Your First Entry
                              </Button>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-6">
                            {/* Progress Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-sm text-gray-400 mb-1">Starting Weight</div>
                                <div className="text-2xl font-bold text-white">
                                  {stats.startWeight} {stats.unit}
                                </div>
                              </div>
                              <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-sm text-gray-400 mb-1">Current Weight</div>
                                <div className="text-2xl font-bold text-white">
                                  {stats.currentWeight} {stats.unit}
                                </div>
                              </div>
                              <div className={`rounded-xl p-4 text-center ${stats.isPositiveProgress ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                                <div className="text-sm text-gray-400 mb-1">Total Change</div>
                                <div className={`text-2xl font-bold ${stats.isPositiveProgress ? 'text-green-400' : 'text-orange-400'}`}>
                                  {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)} {stats.unit}
                                </div>
                              </div>
                              <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-sm text-gray-400 mb-1">Entries Logged</div>
                                <div className="text-2xl font-bold text-white">
                                  {stats.entries}
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress Chart */}
                            <div className="bg-white/5 rounded-xl p-6">
                              <h4 className="text-lg font-semibold text-white mb-4">Weight Over Time</h4>
                              <div className="relative h-64">
                                {/* Chart Y-axis labels */}
                                <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400">
                                  {(() => {
                                    const weights = weightEntries.map(e => e.weight);
                                    const maxWeight = Math.max(...weights);
                                    const minWeight = Math.min(...weights);
                                    const range = maxWeight - minWeight || 10;
                                    const paddedMax = maxWeight + range * 0.1;
                                    const paddedMin = minWeight - range * 0.1;
                                    return (
                                      <>
                                        <span>{paddedMax.toFixed(0)}</span>
                                        <span>{((paddedMax + paddedMin) / 2).toFixed(0)}</span>
                                        <span>{paddedMin.toFixed(0)}</span>
                                      </>
                                    );
                                  })()}
                                </div>
                                
                                {/* Chart area */}
                                <div className="ml-14 h-56 flex items-end gap-1 border-b border-l border-white/20">
                                  {weightEntries.map((entry, index) => {
                                    const weights = weightEntries.map(e => e.weight);
                                    const maxWeight = Math.max(...weights);
                                    const minWeight = Math.min(...weights);
                                    const range = maxWeight - minWeight || 10;
                                    const paddedMax = maxWeight + range * 0.1;
                                    const paddedMin = minWeight - range * 0.1;
                                    const heightPercent = ((entry.weight - paddedMin) / (paddedMax - paddedMin)) * 100;
                                    
                                    return (
                                      <motion.div
                                        key={entry.id}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(heightPercent, 5)}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                        className="flex-1 min-w-[20px] max-w-[60px] bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md relative group cursor-pointer"
                                      >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                          {entry.weight} {stats.unit}
                                          <br />
                                          {new Date(entry.date.seconds * 1000).toLocaleDateString()}
                                          {entry.note && <><br />{entry.note}</>}
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                                
                                {/* X-axis labels */}
                                <div className="ml-14 flex gap-1 mt-2">
                                  {weightEntries.length <= 7 ? (
                                    weightEntries.map((entry) => (
                                      <div key={entry.id} className="flex-1 min-w-[20px] max-w-[60px] text-xs text-gray-400 text-center truncate">
                                        {new Date(entry.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                    ))
                                  ) : (
                                    <>
                                      <div className="text-xs text-gray-400">
                                        {new Date(weightEntries[0].date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                      <div className="flex-1" />
                                      <div className="text-xs text-gray-400">
                                        {new Date(weightEntries[weightEntries.length - 1].date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Recent Entries */}
                            <div className="bg-white/5 rounded-xl p-6">
                              <h4 className="text-lg font-semibold text-white mb-4">Recent Entries</h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {[...weightEntries].reverse().slice(0, 5).map((entry) => (
                                  <div key={entry.id} className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-3">
                                    <div>
                                      <span className="text-white font-semibold">{entry.weight} {stats.unit}</span>
                                      {entry.note && <span className="text-gray-400 text-sm ml-2">- {entry.note}</span>}
                                    </div>
                                    <span className="text-gray-400 text-sm">
                                      {new Date(entry.date.seconds * 1000).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Additional Info */}
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  {/* Journey Started */}
                  <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                    <CardHeader>
                      <h3 className="text-xl font-bold text-white">🚀 Journey Started</h3>
                    </CardHeader>
                    <CardBody>
                      <p className="text-gray-300 text-lg">
                        {userProfile.createdAt ? 
                          new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 
                          "Unknown"
                        }
                      </p>
                    </CardBody>
                  </Card>

                  {/* Tips Based on Goal */}
                  <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
                    <CardHeader>
                      <h3 className="text-xl font-bold text-white">💡 Tips for {formatGoal(userProfile.goal)}</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-2 text-gray-300">
                        {userProfile.goal === 'gain-weight' ? (
                          <>
                            <p>• Eat in a caloric surplus (300-500 extra calories/day)</p>
                            <p>• Focus on protein-rich foods</p>
                            <p>• Strength train 3-4 times per week</p>
                            <p>• Track your weight weekly</p>
                          </>
                        ) : userProfile.goal === 'lose-weight' ? (
                          <>
                            <p>• Eat in a caloric deficit (300-500 fewer calories/day)</p>
                            <p>• Stay hydrated - drink plenty of water</p>
                            <p>• Combine cardio with strength training</p>
                            <p>• Get 7-9 hours of sleep</p>
                          </>
                        ) : (
                          <>
                            <p>• Eat at maintenance calories</p>
                            <p>• Stay consistent with exercise routine</p>
                            <p>• Monitor your weight weekly</p>
                            <p>• Focus on overall health and fitness</p>
                          </>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
                
                {/* Debug Reset Button */}
                <div className="mt-12 text-center">
                  <Button 
                    color="danger" 
                    variant="flat" 
                    size="sm" 
                    onPress={handleResetData}
                    className="opacity-50 hover:opacity-100"
                  >
                    Reset All Progress Data (Debug)
                  </Button>
                </div>
              </>
            ) : (
              /* No Profile Data */
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 max-w-2xl mx-auto">
                  <CardBody className="text-center py-16">
                    <div className="text-8xl mb-6 opacity-50">📋</div>
                    <h3 className="text-3xl font-bold text-white mb-4">No Profile Data Found</h3>
                    <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-md mx-auto">
                      It looks like you haven't completed your health profile yet. Complete your profile to start tracking your goals!
                    </p>
                    <Button 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-8 py-6 text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                      size="lg"
                      onClick={() => router.push('/')}
                    >
                      Go to Dashboard
                    </Button>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modals */}
      {/* Name Modal */}
      <Modal 
        isOpen={editingField === 'name'} 
        onClose={handleCancelField}
        size="xs"
        placement="center"
        classNames={{
          base: "backdrop-blur-xl bg-slate-900/95 border border-white/20 max-w-xs",
          wrapper: "items-center",
          header: "border-b border-white/10 py-3",
          body: "py-4",
          footer: "border-t border-white/10 py-3"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <span>Edit Name</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <Input
              placeholder="Enter your name"
              value={editedProfile?.name || ''}
              onChange={(e) => updateEditedProfile('name', e.target.value)}
              classNames={{
                input: "text-white",
                inputWrapper: "backdrop-blur-xl bg-white/10 border border-white/20"
              }}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="flat" onPress={handleCancelField} className="bg-white/10 text-white">
              Cancel
            </Button>
            <Button size="sm" color="success" onPress={() => handleSaveField('name')} isLoading={isSaving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Gender Modal */}
      <Modal 
        isOpen={editingField === 'gender'} 
        onClose={handleCancelField}
        size="xs"
        placement="center"
        classNames={{
          base: "backdrop-blur-xl bg-slate-900/95 border border-white/20 max-w-xs",
          wrapper: "items-center",
          header: "border-b border-white/10 py-3",
          body: "py-3",
          footer: "border-t border-white/10 py-3"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">👥</span>
              <span>Select Gender</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <Button
                className={`justify-start h-12 px-4 ${
                  editedProfile?.gender === 'male' 
                    ? 'bg-blue-500/20 border-2 border-blue-500 text-white' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
                onPress={() => updateEditedProfile('gender', 'male')}
              >
                <span className="text-lg mr-2">👨</span> Male
              </Button>
              <Button
                className={`justify-start h-12 px-4 ${
                  editedProfile?.gender === 'female' 
                    ? 'bg-pink-500/20 border-2 border-pink-500 text-white' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
                onPress={() => updateEditedProfile('gender', 'female')}
              >
                <span className="text-lg mr-2">👩</span> Female
              </Button>
              <Button
                className={`justify-start h-12 px-4 ${
                  editedProfile?.gender === 'prefer-not-to-say' 
                    ? 'bg-purple-500/20 border-2 border-purple-500 text-white' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
                onPress={() => updateEditedProfile('gender', 'prefer-not-to-say')}
              >
                <span className="text-lg mr-2">👤</span> Prefer not to say
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="flat" onPress={handleCancelField} className="bg-white/10 text-white">
              Cancel
            </Button>
            <Button size="sm" color="success" onPress={() => handleSaveField('gender')} isLoading={isSaving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Height Modal */}
      <Modal 
        isOpen={editingField === 'height'} 
        onClose={handleCancelField}
        size="xs"
        placement="center"
        classNames={{
          base: "backdrop-blur-xl bg-slate-900/95 border border-white/20 max-w-xs",
          wrapper: "items-center",
          header: "border-b border-white/10 py-3",
          body: "py-3",
          footer: "border-t border-white/10 py-3"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📏</span>
              <span>Edit Height</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {editedProfile?.height?.unit === 'imperial' ? (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Feet"
                    value={editedProfile?.height?.feet || ''}
                    onChange={(e) => updateEditedProfile('height', { 
                      ...editedProfile?.height, 
                      feet: e.target.value 
                    })}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "backdrop-blur-xl bg-white/10 border border-white/20"
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Inches"
                    value={editedProfile?.height?.inches || ''}
                    onChange={(e) => updateEditedProfile('height', { 
                      ...editedProfile?.height, 
                      inches: e.target.value 
                    })}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "backdrop-blur-xl bg-white/10 border border-white/20"
                    }}
                  />
                </div>
              ) : (
                <Input
                  type="number"
                  placeholder="Centimeters"
                  value={editedProfile?.height?.cm || ''}
                  onChange={(e) => updateEditedProfile('height', { 
                    ...editedProfile?.height, 
                    cm: e.target.value 
                  })}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "backdrop-blur-xl bg-white/10 border border-white/20"
                  }}
                />
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="flat" onPress={handleCancelField} className="bg-white/10 text-white">
              Cancel
            </Button>
            <Button size="sm" color="success" onPress={() => handleSaveField('height')} isLoading={isSaving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Weight Modal */}
      <Modal 
        isOpen={editingField === 'weight'} 
        onClose={handleCancelField}
        size="xs"
        placement="center"
        classNames={{
          base: "backdrop-blur-xl bg-slate-900/95 border border-white/20 max-w-xs",
          wrapper: "items-center",
          header: "border-b border-white/10 py-3",
          body: "py-3",
          footer: "border-t border-white/10 py-3"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚖️</span>
              <span>Edit Weight</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {editedProfile?.weight?.unit === 'imperial' ? (
                <Input
                  type="number"
                  placeholder="Pounds"
                  value={editedProfile?.weight?.pounds || ''}
                  onChange={(e) => updateEditedProfile('weight', { 
                    ...editedProfile?.weight, 
                    pounds: e.target.value 
                  })}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "backdrop-blur-xl bg-white/10 border border-white/20"
                  }}
                />
              ) : (
                <Input
                  type="number"
                  placeholder="Kilograms"
                  value={editedProfile?.weight?.kg || ''}
                  onChange={(e) => updateEditedProfile('weight', { 
                    ...editedProfile?.weight, 
                    kg: e.target.value 
                  })}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "backdrop-blur-xl bg-white/10 border border-white/20"
                  }}
                />
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="flat" onPress={handleCancelField} className="bg-white/10 text-white">
              Cancel
            </Button>
            <Button size="sm" color="success" onPress={() => handleSaveField('weight')} isLoading={isSaving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Goal Modal */}
      <Modal 
        isOpen={editingField === 'goal'} 
        onClose={handleCancelField}
        size="sm"
        placement="center"
        classNames={{
          base: "backdrop-blur-xl bg-slate-900/95 border border-white/20 max-w-sm",
          wrapper: "items-center",
          header: "border-b border-white/10 py-3",
          body: "py-3",
          footer: "border-t border-white/10 py-3"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span>Select Your Goal</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className={`justify-start h-10 px-3 ${
                  editedProfile?.goal === 'lose-weight' 
                    ? 'bg-red-500/20 border-2 border-red-500 text-white' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
                onPress={() => updateEditedProfile('goal', 'lose-weight')}
              >
                <span className="mr-2">📉</span> Lose Weight
              </Button>
              <Button
                size="sm"
                className={`justify-start h-10 px-3 ${
                  editedProfile?.goal === 'gain-weight' 
                    ? 'bg-green-500/20 border-2 border-green-500 text-white' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
                onPress={() => updateEditedProfile('goal', 'gain-weight')}
              >
                <span className="mr-2">📈</span> Gain Weight
              </Button>
              <Button
                size="sm"
                className={`justify-start h-10 px-3 ${
                  editedProfile?.goal === 'maintain-weight' 
                    ? 'bg-blue-500/20 border-2 border-blue-500 text-white' 
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
                onPress={() => updateEditedProfile('goal', 'maintain-weight')}
              >
                <span className="mr-2">⚖️</span> Maintain Weight
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="flat" onPress={handleCancelField} className="bg-white/10 text-white">
              Cancel
            </Button>
            <Button size="sm" color="success" onPress={() => handleSaveField('goal')} isLoading={isSaving}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Log Weight Modal */}
      <Modal 
        isOpen={showLogWeightModal} 
        onClose={() => {
          setShowLogWeightModal(false);
          setNewWeight('');
          setWeightNote('');
        }}
        size="xs"
        placement="center"
        classNames={{
          base: "backdrop-blur-xl bg-slate-900/95 border border-white/20 max-w-xs",
          wrapper: "items-center",
          header: "border-b border-white/10 py-3",
          body: "py-3",
          footer: "border-t border-white/10 py-3"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <span>Log Your Weight</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder={`Weight in ${userProfile?.weight?.unit === 'imperial' ? 'lbs' : 'kg'}`}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                classNames={{
                  input: "text-white text-lg",
                  inputWrapper: "backdrop-blur-xl bg-white/10 border border-white/20"
                }}
                autoFocus
                endContent={
                  <span className="text-gray-400 text-sm">
                    {userProfile?.weight?.unit === 'imperial' ? 'lbs' : 'kg'}
                  </span>
                }
              />
              <Input
                placeholder="Note (optional)"
                value={weightNote}
                onChange={(e) => setWeightNote(e.target.value)}
                classNames={{
                  input: "text-white",
                  inputWrapper: "backdrop-blur-xl bg-white/10 border border-white/20"
                }}
              />
              <p className="text-xs text-gray-400">
                Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              size="sm" 
              variant="flat" 
              onPress={() => {
                setShowLogWeightModal(false);
                setNewWeight('');
                setWeightNote('');
              }} 
              className="bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              color="success" 
              onPress={handleLogWeight} 
              isLoading={isLoggingWeight}
              isDisabled={!newWeight}
            >
              Log Weight
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Workout Goal Modal */}
      <Modal 
        isOpen={showWorkoutGoalModal} 
        onClose={() => setShowWorkoutGoalModal(false)}
        size="xs"
        placement="center"
        classNames={{
          base: "backdrop-blur-xl bg-slate-900/95 border border-white/20 max-w-xs",
          wrapper: "items-center",
          header: "border-b border-white/10 py-3",
          body: "py-3",
          footer: "border-t border-white/10 py-3"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span>Weekly Goal</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Workouts per week"
                value={newWorkoutGoal}
                onChange={(e) => setNewWorkoutGoal(e.target.value)}
                classNames={{
                  input: "text-white",
                  inputWrapper: "backdrop-blur-xl bg-white/10 border border-white/20"
                }}
                autoFocus
                endContent={
                  <span className="text-gray-400 text-sm">
                    / week
                  </span>
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              size="sm" 
              variant="flat" 
              onPress={() => setShowWorkoutGoalModal(false)} 
              className="bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              color="success" 
              onPress={handleUpdateWorkoutGoal}
            >
              Save Goal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
}
