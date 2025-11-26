import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Chip } from "@heroui/chip";
import DefaultLayout from "@/layouts/default";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string; // String to allow ranges like "8-12"
  weight?: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WorkoutPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  
  // Form State
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
    name: "",
    sets: 3,
    reps: "10",
    weight: ""
  });

  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Fetch completed exercises for today
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid, "workoutLogs", todayDateString);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCompletedExercises(docSnap.data().completed || []);
      } else {
        setCompletedExercises([]);
      }
    });

    return () => unsubscribe();
  }, [user, todayDateString]);

  // Fetch exercises for the selected day
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid, "workoutSchedule", selectedDay);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setExercises(docSnap.data().exercises || []);
      } else {
        setExercises([]);
      }
    });

    return () => unsubscribe();
  }, [user, selectedDay]);

  const handleToggleComplete = async (exerciseId: string) => {
    if (!user) return;
    
    const docRef = doc(db, "users", user.uid, "workoutLogs", todayDateString);
    const isCompleted = completedExercises.includes(exerciseId);

    try {
      await setDoc(docRef, {
        completed: isCompleted ? arrayRemove(exerciseId) : arrayUnion(exerciseId)
      }, { merge: true });
    } catch (error) {
      console.error("Error toggling completion:", error);
    }
  };

  const handleAddExercise = async () => {
    if (!user || !newExercise.name) return;

    const exerciseToAdd: Exercise = {
      id: crypto.randomUUID(),
      name: newExercise.name,
      sets: Number(newExercise.sets) || 3,
      reps: newExercise.reps || "10",
      weight: newExercise.weight || ""
    };

    const docRef = doc(db, "users", user.uid, "workoutSchedule", selectedDay);

    try {
      // Use setDoc with merge: true to create the document if it doesn't exist
      await setDoc(docRef, {
        exercises: arrayUnion(exerciseToAdd)
      }, { merge: true });

      onClose();
      setNewExercise({ name: "", sets: 3, reps: "10", weight: "" });
    } catch (error) {
      console.error("Error adding exercise:", error);
    }
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "workoutSchedule", selectedDay);
    try {
      await updateDoc(docRef, {
        exercises: arrayRemove(exercise)
      });
    } catch (error) {
      console.error("Error deleting exercise:", error);
    }
  };

  if (loading || !user) return null;

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20 pt-20">
        <div className="container mx-auto max-w-4xl px-4 pt-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              className="text-white"
              onPress={() => router.push("/")}
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Weekly Schedule</h1>
              <p className="text-gray-400 text-sm">Plan your workouts for the week</p>
            </div>
          </div>

          {/* Day Selector */}
          <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`
                  px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap
                  ${selectedDay === day 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25 scale-105' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedDay}'s Routine</h2>
              <Button 
                color="primary" 
                className="bg-gradient-to-r from-orange-500 to-red-500 font-semibold"
                onPress={onOpen}
                startContent={<span className="text-xl">+</span>}
              >
                Add Exercise
              </Button>
            </div>

            {exercises.length === 0 ? (
              <Card className="bg-white/5 border border-white/10 backdrop-blur-md min-h-[300px] flex items-center justify-center">
                <CardBody className="text-center p-12">
                  <div className="text-6xl mb-4 opacity-50">💤</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Rest Day?</h3>
                  <p className="text-gray-400 max-w-xs mx-auto">
                    No exercises scheduled for {selectedDay}. Take a break or add a workout to get started!
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid gap-4">
                {exercises.map((exercise) => {
                  const isCompleted = completedExercises.includes(exercise.id);
                  return (
                    <Card 
                      key={exercise.id} 
                      isPressable
                      onPress={() => handleToggleComplete(exercise.id)}
                      className={`
                        border backdrop-blur-md transition-all duration-300
                        ${isCompleted 
                          ? 'bg-emerald-500/20 border-emerald-500/50' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'}
                      `}
                    >
                      <CardBody className="p-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center border transition-colors
                            ${isCompleted 
                              ? 'bg-emerald-500 text-white border-emerald-400' 
                              : 'bg-orange-500/20 text-orange-400 border-orange-500/20'}
                          `}>
                            {isCompleted ? '✓' : '💪'}
                          </div>
                          <div className="text-left">
                            <h3 className={`text-lg font-bold transition-colors ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                              {exercise.name}
                            </h3>
                            <div className={`flex items-center gap-6 mt-2 ${isCompleted ? "text-emerald-200" : "text-gray-400"}`}>
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">Sets</span>
                                <span className={`text-xl font-bold leading-none ${isCompleted ? "text-emerald-100" : "text-white"}`}>
                                  {exercise.sets}
                                </span>
                              </div>
                              <div className="w-px h-8 bg-white/10"></div>
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">Reps</span>
                                <span className={`text-xl font-bold leading-none ${isCompleted ? "text-emerald-100" : "text-white"}`}>
                                  {exercise.reps}
                                </span>
                              </div>
                              {exercise.weight && (
                                <>
                                  <div className="w-px h-8 bg-white/10"></div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">Weight</span>
                                    <span className={`text-xl font-bold leading-none ${isCompleted ? "text-emerald-100" : "text-white"}`}>
                                      {exercise.weight}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          onPress={() => handleDeleteExercise(exercise)}
                          className="opacity-50 hover:opacity-100"
                        >
                          ✕
                        </Button>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Exercise Modal */}
          <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            backdrop="blur"
            placement="center"
            classNames={{
              base: "bg-slate-900 border border-white/10",
              header: "border-b border-white/10",
              footer: "border-t border-white/10",
              closeButton: "hover:bg-white/5 active:bg-white/10",
            }}
          >
            <ModalContent>
              <ModalHeader className="text-white">Add Exercise to {selectedDay}</ModalHeader>
              <ModalBody className="py-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400 font-medium">Exercise Name</label>
                  <Input
                    autoFocus
                    placeholder="e.g. Bench Press"
                    variant="bordered"
                    value={newExercise.name}
                    onValueChange={(v) => setNewExercise({ ...newExercise, name: v })}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "border-white/20 hover:border-white/40"
                    }}
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm text-gray-400 font-medium">Sets</label>
                    <Input
                      type="number"
                      placeholder="3"
                      variant="bordered"
                      value={newExercise.sets?.toString()}
                      onValueChange={(v) => setNewExercise({ ...newExercise, sets: parseInt(v) || 0 })}
                      classNames={{
                        input: "text-white",
                        inputWrapper: "border-white/20 hover:border-white/40"
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm text-gray-400 font-medium">Reps</label>
                    <Input
                      placeholder="8-12"
                      variant="bordered"
                      value={newExercise.reps}
                      onValueChange={(v) => setNewExercise({ ...newExercise, reps: v })}
                      classNames={{
                        input: "text-white",
                        inputWrapper: "border-white/20 hover:border-white/40"
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400 font-medium">Target Weight (Optional)</label>
                  <Input
                    placeholder="e.g. 135 lbs"
                    variant="bordered"
                    value={newExercise.weight}
                    onValueChange={(v) => setNewExercise({ ...newExercise, weight: v })}
                    classNames={{
                      input: "text-white",
                      inputWrapper: "border-white/20 hover:border-white/40"
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
                  onPress={handleAddExercise}
                  isDisabled={!newExercise.name}
                >
                  Add to Schedule
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

        </div>
      </div>
    </DefaultLayout>
  );
}
