import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Input } from "@heroui/input";
import { useAuth } from "@/providers/AuthProvider";
import DefaultLayout from "@/layouts/default";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity?: number;
  baseValues?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
};

type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

type DailyNutrition = {
  [key in MealType]: FoodItem[];
};

const DEFAULT_GOALS = {
  calories: 2500,
  protein: 150,
  carbs: 300,
  fats: 80,
};

export default function NutritionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [date, setDate] = useState(new Date());
  const [nutritionData, setNutritionData] = useState<DailyNutrition>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  });
  
  const [selectedMeal, setSelectedMeal] = useState<MealType>("breakfast");
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string, foods?: FoodItem[]}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [selectedMealForAI, setSelectedMealForAI] = useState<MealType | null>(null);
  const [pendingFoodToAdd, setPendingFoodToAdd] = useState<FoodItem | null>(null);

  // Format date as YYYY-MM-DD for Firestore document ID
  const dateString = date.toISOString().split('T')[0];

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid, "nutrition", dateString);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setNutritionData(docSnap.data() as DailyNutrition);
      } else {
        // Reset data if no document exists for this date
        setNutritionData({
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: [],
        });
      }
    });

    return () => unsubscribe();
  }, [user, dateString]);

  const handleSearchFood = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/usda?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.foods) {
        setSearchResults(data.foods);
      }
    } catch (error) {
      console.error("Error searching food:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFood = (food: any) => {
    // USDA Nutrient IDs:
    // 1008: Energy (kcal)
    // 1003: Protein (g)
    // 1004: Total lipid (fat) (g)
    // 1005: Carbohydrate, by difference (g)
    
    const getNutrient = (id: number) => {
      const nutrient = food.foodNutrients.find((n: any) => n.nutrientId === id);
      return nutrient ? Math.round(nutrient.value) : 0;
    };

    const baseCalories = getNutrient(1008);
    const baseProtein = getNutrient(1003);
    const baseFats = getNutrient(1004);
    const baseCarbs = getNutrient(1005);

    const newFoodItem: FoodItem = {
      id: crypto.randomUUID(),
      name: food.description,
      calories: baseCalories,
      protein: baseProtein,
      fats: baseFats,
      carbs: baseCarbs,
      quantity: 1,
      baseValues: {
        calories: baseCalories,
        protein: baseProtein,
        carbs: baseCarbs,
        fats: baseFats,
      }
    };

    setSelectedFoods([...selectedFoods, newFoodItem]);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setSelectedFoods(selectedFoods.map(item => {
      if (item.id === id && item.baseValues) {
        return {
          ...item,
          quantity: newQuantity,
          calories: Math.round(item.baseValues.calories * newQuantity),
          protein: Math.round(item.baseValues.protein * newQuantity),
          carbs: Math.round(item.baseValues.carbs * newQuantity),
          fats: Math.round(item.baseValues.fats * newQuantity),
        };
      }
      return item;
    }));
  };

  const handleRemoveSelectedFood = (id: string) => {
    setSelectedFoods(selectedFoods.filter(item => item.id !== id));
  };

  const handleAddFood = async () => {
    if (!user || selectedFoods.length === 0) return;

    const docRef = doc(db, "users", user.uid, "nutrition", dateString);

    try {
      await setDoc(docRef, {
        [selectedMeal]: arrayUnion(...selectedFoods)
      }, { merge: true });

      onClose();
      setSelectedFoods([]);
    } catch (error) {
      console.error("Error adding food:", error);
    }
  };

  const handleDeleteFood = async (meal: MealType, item: FoodItem) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "nutrition", dateString);
    await updateDoc(docRef, {
      [meal]: arrayRemove(item)
    });
  };

  const calculateTotals = () => {
    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    Object.values(nutritionData).forEach((meal) => {
      meal?.forEach((item) => {
        totals.calories += item.calories;
        totals.protein += item.protein;
        totals.carbs += item.carbs;
        totals.fats += item.fats;
      });
    });
    return totals;
  };

  const totals = calculateTotals();

  // Calculate Macro Percentages for Chart
  const macroCalories = {
    protein: totals.protein * 4,
    carbs: totals.carbs * 4,
    fats: totals.fats * 9
  };
  const totalMacroCalories = macroCalories.protein + macroCalories.carbs + macroCalories.fats;
  
  const percentages = totalMacroCalories > 0 ? {
    protein: Math.round((macroCalories.protein / totalMacroCalories) * 100),
    carbs: Math.round((macroCalories.carbs / totalMacroCalories) * 100),
    fats: Math.round((macroCalories.fats / totalMacroCalories) * 100)
  } : { protein: 0, carbs: 0, fats: 0 };

  const changeDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    setDate(newDate);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoadingChat) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setIsLoadingChat(true);

    try {
      const remainingMacros = {
        calories: DEFAULT_GOALS.calories - totals.calories,
        protein: DEFAULT_GOALS.protein - totals.protein,
        carbs: DEFAULT_GOALS.carbs - totals.carbs,
        fats: DEFAULT_GOALS.fats - totals.fats,
      };

      const res = await fetch('/api/nutrition-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          remainingMacros 
        }),
      });

      const data = await res.json();
      
      if (data.isStructured && data.foods && Array.isArray(data.foods)) {
        // Structured response with foods array
        const foodItems: FoodItem[] = data.foods.map((food: any) => ({
          id: crypto.randomUUID(),
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
        }));
        
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.explanation || 'Here are some recommendations:',
          foods: foodItems 
        }]);
      } else {
        // Fallback text response
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply || 'Sorry, I could not generate a response.' 
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleAddAIFood = async (food: FoodItem, meal: MealType) => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid, "nutrition", dateString);

    try {
      await setDoc(docRef, {
        [meal]: arrayUnion(food)
      }, { merge: true });

      setSelectedMealForAI(null);
      setPendingFoodToAdd(null);
    } catch (error) {
      console.error("Error adding AI food:", error);
    }
  };

  const handleFoodClick = (food: FoodItem) => {
    setPendingFoodToAdd(food);
    setSelectedMealForAI(null); // Will trigger the meal selector modal
  };

  if (loading || !user) return null;

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20 pt-20">
        <div className="container mx-auto max-w-4xl px-4 pt-8">
          
          {/* Header & Date Navigation */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <Button 
              variant="ghost" 
              className="text-white"
              onPress={() => router.push("/")}
            >
              ← Back
            </Button>
            
            <div className="flex items-center gap-4 bg-white/5 rounded-full p-1 backdrop-blur-md border border-white/10">
              <Button isIconOnly variant="light" onPress={() => changeDate(-1)} className="text-white">
                ←
              </Button>
              <span className="text-white font-medium min-w-[120px] text-center">
                {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <Button isIconOnly variant="light" onPress={() => changeDate(1)} className="text-white">
                →
              </Button>
            </div>
            
            <div className="w-[88px]"></div> {/* Spacer for alignment */}
          </div>

          {/* Nutrition Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 border border-white/10 backdrop-blur-md">
              <CardBody className="p-4">
                <div className="flex flex-col gap-1 mb-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Calories</span>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-2xl font-bold text-white">{totals.calories}</span>
                    <span className="text-gray-500 text-xs">/ {DEFAULT_GOALS.calories}</span>
                  </div>
                </div>
                <Progress 
                  value={(totals.calories / DEFAULT_GOALS.calories) * 100} 
                  color="success"
                  className="h-1.5"
                />
              </CardBody>
            </Card>
            <Card className="bg-white/5 border border-white/10 backdrop-blur-md">
              <CardBody className="p-4">
                <div className="flex flex-col gap-1 mb-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Protein</span>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-2xl font-bold text-white">{totals.protein}g</span>
                    <span className="text-gray-500 text-xs">/ {DEFAULT_GOALS.protein}g</span>
                  </div>
                </div>
                <Progress 
                  value={(totals.protein / DEFAULT_GOALS.protein) * 100} 
                  color="primary"
                  className="h-1.5"
                />
              </CardBody>
            </Card>
            <Card className="bg-white/5 border border-white/10 backdrop-blur-md">
              <CardBody className="p-4">
                <div className="flex flex-col gap-1 mb-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Carbs</span>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-2xl font-bold text-white">{totals.carbs}g</span>
                    <span className="text-gray-500 text-xs">/ {DEFAULT_GOALS.carbs}g</span>
                  </div>
                </div>
                <Progress 
                  value={(totals.carbs / DEFAULT_GOALS.carbs) * 100} 
                  color="warning"
                  className="h-1.5"
                />
              </CardBody>
            </Card>
            <Card className="bg-white/5 border border-white/10 backdrop-blur-md">
              <CardBody className="p-4">
                <div className="flex flex-col gap-1 mb-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Fats</span>
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-2xl font-bold text-white">{totals.fats}g</span>
                    <span className="text-gray-500 text-xs">/ {DEFAULT_GOALS.fats}g</span>
                  </div>
                </div>
                <Progress 
                  value={(totals.fats / DEFAULT_GOALS.fats) * 100} 
                  color="danger"
                  className="h-1.5"
                />
              </CardBody>
            </Card>
          </div>

          {/* Macro Distribution Chart */}
          {totalMacroCalories > 0 && (
            <Card className="bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <CardHeader className="px-6 py-4 border-b border-white/5">
                <h3 className="text-xl font-bold text-white">Macro Distribution</h3>
              </CardHeader>
              <CardBody className="p-6 flex flex-col md:flex-row items-center justify-center gap-12">
                {/* Donut Chart */}
                <div className="relative w-48 h-48 rounded-full shadow-xl" style={{
                  background: `conic-gradient(
                    #3b82f6 0% ${percentages.protein}%, 
                    #f59e0b ${percentages.protein}% ${percentages.protein + percentages.carbs}%, 
                    #ef4444 ${percentages.protein + percentages.carbs}% 100%
                  )`
                }}>
                  <div className="absolute inset-4 bg-slate-800 rounded-full flex flex-col items-center justify-center z-10">
                    <span className="text-3xl font-bold text-white">{totals.calories}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">kcal</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-1 gap-4 min-w-[200px]">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                      <span className="text-gray-300">Protein</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-white font-bold">{percentages.protein}%</span>
                      <span className="text-xs text-gray-500">{macroCalories.protein} kcal</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                      <span className="text-gray-300">Carbs</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-white font-bold">{percentages.carbs}%</span>
                      <span className="text-xs text-gray-500">{macroCalories.carbs} kcal</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                      <span className="text-gray-300">Fats</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-white font-bold">{percentages.fats}%</span>
                      <span className="text-xs text-gray-500">{macroCalories.fats} kcal</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Meals Sections */}
          <div className="space-y-6">
            {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map((meal) => (
              <Card key={meal} className="bg-white/5 border border-white/10 backdrop-blur-md">
                <CardHeader className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                  <h3 className="text-xl font-bold text-white capitalize">{meal}</h3>
                  <Button 
                    size="sm" 
                    color="primary" 
                    variant="flat"
                    onPress={() => {
                      setSelectedMeal(meal);
                      onOpen();
                    }}
                  >
                    + Add Food
                  </Button>
                </CardHeader>
                <CardBody className="px-6 py-4">
                  {nutritionData[meal]?.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 italic">No food logged yet</p>
                  ) : (
                    <div className="space-y-3">
                      {nutritionData[meal]?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-white/5 rounded-lg p-3 group">
                          <div>
                            <p className="text-white font-medium">{item.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fats}g
                            </p>
                          </div>
                          <Button 
                            isIconOnly 
                            size="sm" 
                            color="danger" 
                            variant="light"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onPress={() => handleDeleteFood(meal, item)}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Add Food Modal */}
          <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            backdrop="blur"
            placement="center"
            scrollBehavior="inside"
          >
            <ModalContent className="bg-slate-800 border border-white/10 text-white">
              <ModalHeader className="border-b border-white/10">Add Food to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}</ModalHeader>
              <ModalBody className="py-6">
                {/* Search Section */}
                <div className="mb-6">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search USDA Database..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchFood()}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "border-white/20 hover:border-white/40",
                        input: "text-white"
                      }}
                    />
                    <Button 
                      isLoading={isSearching}
                      color="primary"
                      onPress={handleSearchFood}
                    >
                      Search
                    </Button>
                  </div>
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto bg-slate-900/50 rounded-lg border border-white/10">
                      {searchResults.map((food) => (
                        <button
                          key={food.fdcId}
                          className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-colors border-b border-white/5 last:border-0"
                          onClick={() => handleSelectFood(food)}
                        >
                          <div className="font-medium truncate">{food.description}</div>
                          <div className="text-xs text-gray-500">
                            {food.brandOwner ? `${food.brandOwner} • ` : ''}
                            {Math.round(food.foodNutrients.find((n: any) => n.nutrientId === 1008)?.value || 0)} kcal
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Foods List */}
                {selectedFoods.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Selected Items</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedFoods.map((item) => (
                        <div key={item.id} className="flex flex-col gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 mr-2">
                              <p className="text-white font-medium truncate">{item.name}</p>
                              <p className="text-xs text-gray-400">
                                {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fats}g
                              </p>
                            </div>
                            <Button 
                              isIconOnly 
                              size="sm" 
                              color="danger" 
                              variant="light"
                              onPress={() => handleRemoveSelectedFood(item.id)}
                            >
                              ✕
                            </Button>
                          </div>
                          
                          <div className="mt-3 bg-slate-900/40 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Portion Size</span>
                              <span className="text-xs font-mono text-blue-400">
                                {item.quantity || 1} serving{(item.quantity || 1) !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                isIconOnly
                                size="sm"
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                onPress={() => handleQuantityChange(item.id, Math.max(0.25, (item.quantity || 1) - 0.25))}
                              >
                                -
                              </Button>
                              
                              <div className="flex-1 relative">
                                <Input
                                  type="number"
                                  size="sm"
                                  variant="bordered"
                                  value={item.quantity?.toString() || "1"}
                                  onValueChange={(v) => handleQuantityChange(item.id, parseFloat(v) || 0)}
                                  classNames={{
                                    input: "text-center text-white font-bold text-lg",
                                    inputWrapper: "h-8 border-white/10 bg-white/5 hover:border-white/20"
                                  }}
                                  min={0.1}
                                  step={0.25}
                                />
                              </div>

                              <Button
                                isIconOnly
                                size="sm"
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                onPress={() => handleQuantityChange(item.id, (item.quantity || 1) + 0.25)}
                              >
                                +
                              </Button>
                            </div>

                            {/* Quick Select Pills */}
                            <div className="flex gap-2 mt-3 justify-center">
                              {[0.5, 1, 1.5, 2].map((qty) => (
                                <button
                                  key={qty}
                                  onClick={() => handleQuantityChange(item.id, qty)}
                                  className={`
                                    text-[10px] font-medium px-3 py-1.5 rounded-full transition-all
                                    ${item.quantity === qty 
                                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105' 
                                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
                                  `}
                                >
                                  {qty}x
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="border-t border-white/10">
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleAddFood}
                  isDisabled={selectedFoods.length === 0}
                >
                  Add {selectedFoods.length > 0 ? `${selectedFoods.length} Items` : 'Food'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* AI Chat Floating Button */}
          <AnimatePresence>
            {!isChatOpen && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform z-50"
              >
                🤖
              </motion.button>
            )}
          </AnimatePresence>

          {/* AI Chat Modal */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-8 right-8 w-96 h-[600px] bg-slate-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden z-50"
              >
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h3 className="text-white font-bold">AI Nutrition Coach</h3>
                      <p className="text-white/80 text-xs">Ask me anything about nutrition!</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Remaining Macros Summary */}
                <div className="bg-slate-800 px-4 py-3 border-b border-white/5">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Remaining Today</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{Math.max(0, DEFAULT_GOALS.calories - totals.calories)}</p>
                      <p className="text-[10px] text-gray-500">cal</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-400">{Math.max(0, DEFAULT_GOALS.protein - totals.protein)}g</p>
                      <p className="text-[10px] text-gray-500">protein</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-orange-400">{Math.max(0, DEFAULT_GOALS.carbs - totals.carbs)}g</p>
                      <p className="text-[10px] text-gray-500">carbs</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-400">{Math.max(0, DEFAULT_GOALS.fats - totals.fats)}g</p>
                      <p className="text-[10px] text-gray-500">fats</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                      <p className="text-sm mb-4">💬 Start a conversation!</p>
                      <div className="space-y-2 text-xs text-left bg-white/5 rounded-lg p-4">
                        <p className="font-semibold text-gray-400 uppercase tracking-wider">Try asking:</p>
                        <button 
                          onClick={() => setChatInput("What foods can I eat to get 20g of protein with my remaining calories?")}
                          className="block w-full text-left text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded p-2 transition-colors"
                        >
                          "What foods can I eat to get 20g of protein?"
                        </button>
                        <button 
                          onClick={() => setChatInput("Suggest a healthy dinner with my remaining macros")}
                          className="block w-full text-left text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded p-2 transition-colors"
                        >
                          "Suggest a healthy dinner"
                        </button>
                        <button 
                          onClick={() => setChatInput("What's a good post-workout snack?")}
                          className="block w-full text-left text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded p-2 transition-colors"
                        >
                          "What's a good post-workout snack?"
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'bg-white/10 text-gray-200'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap mb-2">{msg.content}</p>
                        
                        {/* AI Food Recommendations */}
                        {msg.foods && msg.foods.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {msg.foods.map((food) => (
                              <button
                                key={food.id}
                                onClick={() => handleFoodClick(food)}
                                className="w-full bg-slate-800 hover:bg-slate-700 rounded-lg p-3 text-left transition-colors border border-white/10 hover:border-purple-400"
                              >
                                <p className="text-white font-semibold text-sm mb-1">{food.name}</p>
                                <p className="text-xs text-gray-400">
                                  {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fats}g
                                </p>
                                <p className="text-xs text-purple-400 mt-2">Click to add to meal →</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isLoadingChat && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-white/10 bg-slate-800">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about nutrition..."
                      value={chatInput}
                      onValueChange={setChatInput}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={isLoadingChat}
                      variant="bordered"
                      classNames={{
                        inputWrapper: "border-white/20 hover:border-white/40 bg-slate-900",
                        input: "text-white"
                      }}
                    />
                    <Button 
                      isIconOnly
                      color="primary"
                      isLoading={isLoadingChat}
                      onPress={handleSendMessage}
                      className="bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      ↑
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Meal Selection Modal for AI Recommendations */}
          <Modal 
            isOpen={pendingFoodToAdd !== null && selectedMealForAI === null} 
            onClose={() => {
              setPendingFoodToAdd(null);
              setSelectedMealForAI(null);
            }}
            backdrop="blur"
            placement="center"
          >
            <ModalContent className="bg-slate-800 border border-white/10 text-white">
              <ModalHeader className="border-b border-white/10">
                Add "{pendingFoodToAdd?.name}" to...
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="grid grid-cols-2 gap-3">
                  {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map((meal) => (
                    <button
                      key={meal}
                      onClick={() => {
                        if (pendingFoodToAdd) {
                          handleAddAIFood(pendingFoodToAdd, meal);
                        }
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400 rounded-lg p-4 transition-all capitalize font-medium text-white"
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </ModalBody>
            </ModalContent>
          </Modal>

        </div>
      </div>
    </DefaultLayout>
  );
}
