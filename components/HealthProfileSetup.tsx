import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalBody,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Progress,
} from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";

interface HealthProfileData {
  name: string;
  gender: string;
  height: {
    feet: string;
    inches: string;
    cm: string;
    unit: "imperial" | "metric";
  };
  weight: {
    pounds: string;
    kg: string;
    unit: "imperial" | "metric";
  };
  goal: string;
}

interface HealthProfileSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const steps = [
  {
    title: "What's your name?",
    subtitle: "Let's personalize your health journey",
    description: "🌟 Your AI health companion needs to know what to call you!",
    benefit: "Get personalized recommendations",
  },
  {
    title: "Gender",
    subtitle: "Help us personalize your experience", 
    description: "👤 This helps us create better health insights for you",
    benefit: "More accurate health metrics",
  },
  {
    title: "Height",
    subtitle: "We'll use this for accurate calculations",
    description: "📏 Essential for calculating your BMI and calorie needs",
    benefit: "Precise health calculations",
  },
  {
    title: "Weight", 
    subtitle: "Current weight for your health profile",
    description: "⚖️ We'll track your progress from this starting point",
    benefit: "Personalized weight tracking",
  },
  {
    title: "What's your goal?",
    subtitle: "What do you want to achieve?",
    description: "🎯 Choose your health mission - we'll guide you there!",
    benefit: "Tailored workout & meal plans",
  },
];

const goals = [
  {
    value: "weight_loss",
    label: "Lose Weight",
    emoji: "🏃‍♀️",
    description: "Shed pounds and feel great",
    color: "from-red-500 to-pink-600",
  },
  {
    value: "muscle_gain",
    label: "Build Muscle", 
    emoji: "💪",
    description: "Gain strength and mass",
    color: "from-blue-500 to-indigo-600",
  },
  {
    value: "maintenance",
    label: "Stay Healthy",
    emoji: "⚖️", 
    description: "Maintain current fitness",
    color: "from-green-500 to-emerald-600",
  },
  {
    value: "endurance",
    label: "Improve Endurance",
    emoji: "🏃‍♂️",
    description: "Build cardiovascular fitness",
    color: "from-orange-500 to-yellow-600",
  },
];

export default function HealthProfileSetup({
  isOpen,
  onClose,
  onSuccess,
}: HealthProfileSetupProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<HealthProfileData>({
    name: user?.displayName || "",
    gender: "",
    height: { feet: "", inches: "", cm: "", unit: "imperial" },
    weight: { pounds: "", kg: "", unit: "imperial" },
    goal: "",
  });

  const updateFormData = (field: keyof HealthProfileData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Name
        return formData.name.trim().length >= 2;
      case 1: // Gender
        return formData.gender !== "";
      case 2: // Height
        if (formData.height.unit === "imperial") {
          return (
            formData.height.feet !== "" &&
            formData.height.inches !== "" &&
            parseInt(formData.height.feet) >= 3 &&
            parseInt(formData.height.feet) <= 8
          );
        } else {
          return (
            formData.height.cm !== "" &&
            parseInt(formData.height.cm) >= 120 &&
            parseInt(formData.height.cm) <= 220
          );
        }
      case 3: // Weight
        if (formData.weight.unit === "imperial") {
          return (
            formData.weight.pounds !== "" &&
            parseInt(formData.weight.pounds) >= 80 &&
            parseInt(formData.weight.pounds) <= 500
          );
        } else {
          return (
            formData.weight.kg !== "" &&
            parseInt(formData.weight.kg) >= 35 &&
            parseInt(formData.weight.kg) <= 250
          );
        }
      case 4: // Goal
        return formData.goal !== "";
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setError("");
      } else {
        handleSubmit();
      }
    } else {
      setError(getValidationError(currentStep));
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getValidationError = (step: number): string => {
    switch (step) {
      case 0: // Name
        return "Please enter your name (at least 2 characters)";
      case 1: // Gender
        return "Please select your gender";
      case 2: // Height
        return formData.height.unit === "imperial"
          ? "Please enter your height in feet and inches"
          : "Please enter your height in centimeters";
      case 3: // Weight
        return formData.weight.unit === "imperial"
          ? "Please enter your weight in pounds"
          : "Please enter your weight in kilograms";
      case 4: // Goal
        return "Please select your fitness goal";
      default:
        return "";
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      // Calculate weight in both units for consistency
      let weightData = formData.weight;
      if (formData.weight.unit === "imperial" && formData.weight.pounds) {
        weightData.kg = (parseFloat(formData.weight.pounds) / 2.205).toFixed(1);
      } else if (formData.weight.unit === "metric" && formData.weight.kg) {
        weightData.pounds = (parseFloat(formData.weight.kg) * 2.205).toFixed(1);
      }

      // Calculate height in both units for consistency
      let heightData = formData.height;
      if (formData.height.unit === "imperial" && formData.height.feet && formData.height.inches) {
        const totalInches = parseInt(formData.height.feet) * 12 + parseInt(formData.height.inches);
        heightData.cm = (totalInches * 2.54).toFixed(0);
      } else if (formData.height.unit === "metric" && formData.height.cm) {
        const totalInches = parseInt(formData.height.cm) / 2.54;
        heightData.feet = Math.floor(totalInches / 12).toString();
        heightData.inches = Math.round(totalInches % 12).toString();
      }

      // Update user profile in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        name: formData.name,
        gender: formData.gender,
        height: heightData,
        weight: weightData,
        goal: formData.goal,
        updatedAt: new Date(),
        profileCompleted: true,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Name
        return (
          <div className="space-y-4">
            <div className="relative">
              <Input
                classNames={{
                  base: "text-white",
                  input: "text-white placeholder:text-gray-400 text-lg px-4",
                  inputWrapper:
                    "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 group-data-[focused=true]:bg-white/15 transition-all duration-300 h-14 rounded-xl",
                }}
                placeholder="Enter your full name"
                size="lg"
                startContent={<div className="text-indigo-400 text-xl">👋</div>}
                value={formData.name}
                variant="bordered"
                onChange={(e) => updateFormData("name", e.target.value)}
              />
              {formData.name.length >= 2 && (
                <motion.div
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm"
                  initial={{ scale: 0 }}
                >
                  ✓
                </motion.div>
              )}
            </div>
            {formData.name.length > 0 && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 rounded-lg bg-indigo-500/20 border border-indigo-400/30"
                initial={{ opacity: 0, y: 10 }}
              >
                <span className="text-indigo-300">
                  Hey {formData.name.split(" ")[0]}! 👋 Ready to start your
                  health journey?
                </span>
              </motion.div>
            )}
          </div>
        );

      case 1: // Gender
        return (
          <div className="space-y-4">
            <div className="grid gap-3">
              {[
                {
                  value: "male",
                  label: "Male",
                  icon: "👨",
                  color: "from-blue-500 to-indigo-600",
                },
                {
                  value: "female",
                  label: "Female",
                  icon: "👩",
                  color: "from-pink-500 to-purple-600",
                },
                {
                  value: "other",
                  label: "Other",
                  icon: "🏳️‍⚧️",
                  color: "from-emerald-500 to-teal-600",
                },
              ].map((option) => (
                <motion.div
                  key={option.value}
                  className={`cursor-pointer rounded-xl p-1 border-2 transition-all duration-300 ${
                    formData.gender === option.value
                      ? "border-indigo-400 bg-indigo-500/20"
                      : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateFormData("gender", option.value)}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="text-2xl">{option.icon}</div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-lg">
                        {option.label}
                      </div>
                    </div>
                    {formData.gender === option.value && (
                      <motion.div
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                      >
                        <div className="w-3 h-3 bg-indigo-600 rounded-full" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 2: // Height
        return (
          <div className="space-y-6">
            {/* Unit Switcher for Height */}
            <div className="flex gap-2 p-1 bg-white/10 rounded-xl backdrop-blur-sm">
              {[
                { key: "imperial", label: "Feet & Inches", icon: "🇺🇸" },
                { key: "metric", label: "Centimeters", icon: "🌍" },
              ].map((unit) => (
                <button
                  key={unit.key}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-300 ${
                    formData.height.unit === unit.key
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() =>
                    updateFormData("height", {
                      ...formData.height,
                      unit: unit.key as "imperial" | "metric",
                    })
                  }
                >
                  <span>{unit.icon}</span>
                  <span className="font-medium">{unit.label}</span>
                </button>
              ))}
            </div>

            {formData.height.unit === "imperial" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    classNames={{
                      base: "text-white",
                      input:
                        "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                      inputWrapper:
                        "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl",
                    }}
                    endContent={<span className="text-gray-400 text-sm">ft</span>}
                    max="8"
                    min="3"
                    placeholder="5"
                    size="lg"
                    startContent={<div className="text-indigo-400">📏</div>}
                    type="number"
                    value={formData.height.feet}
                    variant="bordered"
                    onChange={(e) =>
                      updateFormData("height", {
                        ...formData.height,
                        feet: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="relative">
                  <Input
                    classNames={{
                      base: "text-white",
                      input:
                        "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                      inputWrapper:
                        "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl",
                    }}
                    endContent={<span className="text-gray-400 text-sm">in</span>}
                    max="11"
                    min="0"
                    placeholder="8"
                    size="lg"
                    type="number"
                    value={formData.height.inches}
                    variant="bordered"
                    onChange={(e) =>
                      updateFormData("height", {
                        ...formData.height,
                        inches: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <Input
                classNames={{
                  base: "text-white",
                  input:
                    "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                  inputWrapper:
                    "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl",
                }}
                endContent={<span className="text-gray-400">cm</span>}
                max="220"
                min="120"
                placeholder="170"
                size="lg"
                startContent={<div className="text-indigo-400 text-xl">📏</div>}
                type="number"
                value={formData.height.cm}
                variant="bordered"
                onChange={(e) =>
                  updateFormData("height", {
                    ...formData.height,
                    cm: e.target.value,
                  })
                }
              />
            )}

            {/* Unit Switcher for Weight */}
            <div className="flex gap-2 p-1 bg-white/10 rounded-xl backdrop-blur-sm mt-6">
              {[
                { key: "imperial", label: "Pounds", icon: "⚖️" },
                { key: "metric", label: "Kilograms", icon: "🌍" },
              ].map((unit) => (
                <button
                  key={unit.key}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-300 ${
                    formData.weight.unit === unit.key
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() =>
                    updateFormData("weight", {
                      ...formData.weight,
                      unit: unit.key as "imperial" | "metric",
                    })
                  }
                >
                  <span>{unit.icon}</span>
                  <span className="font-medium">{unit.label}</span>
                </button>
              ))}
            </div>

            {formData.weight.unit === "imperial" ? (
              <Input
                classNames={{
                  base: "text-white",
                  input:
                    "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                  inputWrapper:
                    "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl",
                }}
                endContent={<span className="text-gray-400">lbs</span>}
                max="400"
                min="80"
                placeholder="150"
                size="lg"
                startContent={<div className="text-indigo-400 text-xl">⚖️</div>}
                type="number"
                value={formData.weight.pounds}
                variant="bordered"
                onChange={(e) =>
                  updateFormData("weight", {
                    ...formData.weight,
                    pounds: e.target.value,
                  })
                }
              />
            ) : (
              <Input
                classNames={{
                  base: "text-white",
                  input:
                    "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                  inputWrapper:
                    "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl",
                }}
                endContent={<span className="text-gray-400">kg</span>}
                max="200"
                min="30"
                placeholder="70"
                size="lg"
                startContent={<div className="text-indigo-400 text-xl">⚖️</div>}
                type="number"
                value={formData.weight.kg}
                variant="bordered"
                onChange={(e) =>
                  updateFormData("weight", {
                    ...formData.weight,
                    kg: e.target.value,
                  })
                }
              />
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {goals.map((goal) => (
              <motion.div
                key={goal.value}
                className={`cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                  formData.goal === goal.value
                    ? "border-indigo-400 bg-indigo-500/20 shadow-lg"
                    : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateFormData("goal", goal.value)}
              >
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{goal.emoji}</div>
                    <div className="flex-1">
                      <div className="text-white font-bold text-lg">
                        {goal.label}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {goal.description}
                      </div>
                    </div>
                    {formData.goal === goal.value && (
                      <motion.div
                        animate={{ scale: 1 }}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                        initial={{ scale: 0 }}
                      >
                        <div className="text-indigo-600 font-bold text-lg">✓</div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      hideCloseButton
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        wrapper: "items-center justify-center p-4",
      }}
      isOpen={isOpen}
      placement="center"
      onOpenChange={(open) => {
        console.log("HealthProfileSetup modal open change:", open);
        if (!open) onClose();
      }}
    >
      <ModalContent className="bg-transparent shadow-none border-0 max-w-lg w-full">
        <ModalBody className="p-0">
          <Card className="w-full max-w-lg mx-auto glass-strong border border-white/20 animate-glow">
            <CardHeader className="text-center pb-6">
              <div className="w-full">
                {/* Header with close button and step indicator */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold animate-neural-pulse">
                      {currentStep + 1}
                    </div>
                    <div className="text-sm text-gray-400">
                      Step {currentStep + 1} of {steps.length}
                    </div>
                  </div>
                  <button
                    aria-label="Close modal"
                    className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white"
                    onClick={onClose}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 mb-6">
                  <motion.div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Step title */}
                <motion.div
                  key={currentStep}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-2"
                  exit={{ opacity: 0, y: -20 }}
                  initial={{ opacity: 0, y: 20 }}
                >
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {steps[currentStep].subtitle}
                  </p>
                </motion.div>
              </div>
            </CardHeader>

            <CardBody className="pt-0 px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                  exit={{ opacity: 0, x: -30 }}
                  initial={{ opacity: 0, x: 30 }}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                  }}
                >
                  {renderStep()}

                  {error && (
                    <motion.div
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-lg bg-red-500/20 border border-red-400/30 text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                    >
                      <span className="text-red-400">{error}</span>
                    </motion.div>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex gap-4 pt-6">
                    {currentStep > 0 && (
                      <Button
                        className="flex-1 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium h-12 rounded-xl transition-all duration-200"
                        size="lg"
                        variant="bordered"
                        onClick={prevStep}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold h-12 rounded-xl shadow-xl transition-all duration-200 hover:scale-[1.02]"
                      isDisabled={loading}
                      isLoading={loading}
                      size="lg"
                      onClick={nextStep}
                    >
                      {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardBody>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}