import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { RadioGroup, Radio } from "@heroui/radio";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface SignupData {
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
  password: string;
  confirmPassword: string;
}

interface MultiStepSignupProps {
  onClose: () => void;
  onSuccess: () => void;
}

const steps = [
  { 
    title: "What's your name?", 
    subtitle: "Let's start with the basics",
    description: "🌟 Your personalized AI health journey begins here!",
    benefit: "Get customized recommendations"
  },
  { 
    title: "Gender", 
    subtitle: "Help us personalize your experience",
    description: "👤 This helps us create better health insights for you",
    benefit: "More accurate health metrics"
  },
  { 
    title: "Height", 
    subtitle: "We'll use this for accurate calculations",
    description: "📏 Essential for calculating your BMI and calorie needs",
    benefit: "Precise health calculations"
  },
  { 
    title: "Weight", 
    subtitle: "Current weight for your health profile",
    description: "⚖️ We'll track your progress from this starting point",
    benefit: "Personalized weight tracking"
  },
  { 
    title: "What's your goal?", 
    subtitle: "What do you want to achieve?",
    description: "🎯 Choose your health mission - we'll guide you there!",
    benefit: "Tailored workout & meal plans"
  },
  { 
    title: "Email", 
    subtitle: "Create your account credentials",
    description: "📧 Your secure gateway to AI-powered health insights",
    benefit: "Daily progress updates & tips"
  },
  { 
    title: "Password", 
    subtitle: "Secure your account",
    description: "🔐 Keep your health data safe and private",
    benefit: "Complete your transformation!"
  },
];

export default function MultiStepSignup({ onClose, onSuccess }: MultiStepSignupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState<SignupData>({
    name: "",
    gender: "",
    height: { feet: "", inches: "", cm: "", unit: 'imperial' },
    weight: { pounds: "", kg: "", unit: 'imperial' },
    goal: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const updateFormData = (field: keyof SignupData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return formData.name.trim().length >= 2;
      case 1:
        return formData.gender !== "";
      case 2:
        if (formData.height.unit === 'imperial') {
          return formData.height.feet !== "" && formData.height.inches !== "";
        }
        return formData.height.cm !== "";
      case 3:
        if (formData.weight.unit === 'imperial') {
          return formData.weight.pounds !== "";
        }
        return formData.weight.kg !== "";
      case 4:
        return formData.goal !== "";
      case 5:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 6:
        return formData.password.length >= 6 && formData.password === formData.confirmPassword;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        
        // Add celebration effect for completed step
        const celebration = document.createElement('div');
        celebration.innerHTML = '✨';
        celebration.style.position = 'fixed';
        celebration.style.top = '50%';
        celebration.style.left = '50%';
        celebration.style.fontSize = '2rem';
        celebration.style.pointerEvents = 'none';
        celebration.style.zIndex = '9999';
        celebration.style.animation = 'bounce 0.6s ease-out forwards';
        document.body.appendChild(celebration);
        
        setTimeout(() => {
          document.body.removeChild(celebration);
        }, 600);
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
      case 0:
        return "Please enter your name (at least 2 characters)";
      case 1:
        return "Please select your gender";
      case 2:
        return formData.height.unit === 'imperial' 
          ? "Please enter your height in feet and inches"
          : "Please enter your height in centimeters";
      case 3:
        return formData.weight.unit === 'imperial'
          ? "Please enter your weight in pounds"
          : "Please enter your weight in kilograms";
      case 4:
        return "Please select your goal";
      case 5:
        return "Please enter a valid email address";
      case 6:
        if (formData.password.length < 6) {
          return "Password must be at least 6 characters";
        }
        if (formData.password !== formData.confirmPassword) {
          return "Passwords don't match";
        }
        return "";
      default:
        return "";
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      // Save profile data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: formData.name,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight,
        goal: formData.goal,
        email: formData.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="relative">
              <Input
                size="lg"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                startContent={
                  <div className="text-indigo-400 text-xl">👋</div>
                }
                classNames={{
                  base: "text-white",
                  input: "text-white placeholder:text-gray-400 text-lg px-4",
                  inputWrapper: "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 group-data-[focused=true]:bg-white/15 transition-all duration-300 h-14 rounded-xl"
                }}
                variant="bordered"
              />
              {formData.name.length >= 2 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm"
                >
                  ✓
                </motion.div>
              )}
            </div>
            {formData.name.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 rounded-lg bg-indigo-500/20 border border-indigo-400/30"
              >
                <span className="text-indigo-300">Hey {formData.name.split(' ')[0]}! 👋 Ready to start your health journey?</span>
              </motion.div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-3">
              {[
                { value: 'male', label: 'Male', icon: '👨', color: 'from-blue-500 to-indigo-600' },
                { value: 'female', label: 'Female', icon: '👩', color: 'from-pink-500 to-purple-600' },
                { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: '👤', color: 'from-gray-500 to-slate-600' }
              ].map((option) => (
                <motion.div
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${
                    formData.gender === option.value
                      ? 'border-indigo-400 bg-gradient-to-r ' + option.color + ' shadow-lg'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                  onClick={() => updateFormData('gender', option.value)}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="text-2xl">{option.icon}</div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-lg">{option.label}</div>
                    </div>
                    {formData.gender === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
                      >
                        <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            {formData.gender && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 rounded-lg bg-green-500/20 border border-green-400/30"
              >
                <span className="text-green-300">Perfect! This helps us customize your health insights ✨</span>
              </motion.div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Unit Switcher */}
            <div className="flex gap-2 p-1 bg-white/10 rounded-xl backdrop-blur-sm">
              {[
                { key: 'imperial', label: 'Feet & Inches', icon: '🇺🇸' },
                { key: 'metric', label: 'Centimeters', icon: '🌍' }
              ].map((unit) => (
                <button
                  key={unit.key}
                  onClick={() => updateFormData('height', { ...formData.height, unit: unit.key as 'imperial' | 'metric' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-300 ${
                    formData.height.unit === unit.key
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{unit.icon}</span>
                  <span className="font-medium">{unit.label}</span>
                </button>
              ))}
            </div>

            {formData.height.unit === 'imperial' ? (
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Input
                    size="lg"
                    placeholder="5"
                    type="number"
                    min="0"
                    max="8"
                    value={formData.height.feet}
                    onChange={(e) => updateFormData('height', { ...formData.height, feet: e.target.value })}
                    startContent={<div className="text-indigo-400">📏</div>}
                    endContent={<span className="text-gray-400 text-sm">ft</span>}
                    classNames={{
                      base: "text-white",
                      input: "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                      inputWrapper: "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl"
                    }}
                    variant="bordered"
                  />
                </div>
                <div className="flex-1 relative">
                  <Input
                    size="lg"
                    placeholder="8"
                    type="number"
                    min="0"
                    max="11"
                    value={formData.height.inches}
                    onChange={(e) => updateFormData('height', { ...formData.height, inches: e.target.value })}
                    startContent={<div className="text-indigo-400">📏</div>}
                    endContent={<span className="text-gray-400 text-sm">in</span>}
                    classNames={{
                      base: "text-white",
                      input: "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                      inputWrapper: "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl"
                    }}
                    variant="bordered"
                  />
                </div>
              </div>
            ) : (
              <Input
                size="lg"
                placeholder="170"
                type="number"
                min="120"
                max="220"
                value={formData.height.cm}
                onChange={(e) => updateFormData('height', { ...formData.height, cm: e.target.value })}
                startContent={<div className="text-indigo-400 text-xl">📏</div>}
                endContent={<span className="text-gray-400">cm</span>}
                classNames={{
                  base: "text-white",
                  input: "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                  inputWrapper: "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl"
                }}
                variant="bordered"
              />
            )}
            
            {/* Height conversion display */}
            {((formData.height.unit === 'imperial' && formData.height.feet && formData.height.inches) || 
              (formData.height.unit === 'metric' && formData.height.cm)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 rounded-lg bg-blue-500/20 border border-blue-400/30"
              >
                <span className="text-blue-300">
                  {formData.height.unit === 'imperial' 
                    ? `That's ${Math.round((parseInt(formData.height.feet || '0') * 12 + parseInt(formData.height.inches || '0')) * 2.54)} cm`
                    : `That's ${Math.floor(parseInt(formData.height.cm || '0') / 30.48)}'${Math.round((parseInt(formData.height.cm || '0') % 30.48) / 2.54)}"`
                  } 📊
                </span>
              </motion.div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Unit Switcher */}
            <div className="flex gap-2 p-1 bg-white/10 rounded-xl backdrop-blur-sm">
              {[
                { key: 'imperial', label: 'Pounds', icon: '⚖️' },
                { key: 'metric', label: 'Kilograms', icon: '🌍' }
              ].map((unit) => (
                <button
                  key={unit.key}
                  onClick={() => updateFormData('weight', { ...formData.weight, unit: unit.key as 'imperial' | 'metric' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-300 ${
                    formData.weight.unit === unit.key
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{unit.icon}</span>
                  <span className="font-medium">{unit.label}</span>
                </button>
              ))}
            </div>

            {formData.weight.unit === 'imperial' ? (
              <Input
                size="lg"
                placeholder="150"
                type="number"
                min="50"
                max="500"
                value={formData.weight.pounds}
                onChange={(e) => updateFormData('weight', { ...formData.weight, pounds: e.target.value })}
                startContent={<div className="text-indigo-400 text-xl">⚖️</div>}
                endContent={<span className="text-gray-400">lbs</span>}
                classNames={{
                  base: "text-white",
                  input: "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                  inputWrapper: "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl"
                }}
                variant="bordered"
              />
            ) : (
              <Input
                size="lg"
                placeholder="70"
                type="number"
                min="30"
                max="200"
                value={formData.weight.kg}
                onChange={(e) => updateFormData('weight', { ...formData.weight, kg: e.target.value })}
                startContent={<div className="text-indigo-400 text-xl">⚖️</div>}
                endContent={<span className="text-gray-400">kg</span>}
                classNames={{
                  base: "text-white",
                  input: "text-white placeholder:text-gray-400 text-lg px-4 text-center",
                  inputWrapper: "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl"
                }}
                variant="bordered"
              />
            )}
            
            {/* Weight conversion display */}
            {((formData.weight.unit === 'imperial' && formData.weight.pounds) || 
              (formData.weight.unit === 'metric' && formData.weight.kg)) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 rounded-lg bg-purple-500/20 border border-purple-400/30"
              >
                <span className="text-purple-300">
                  {formData.weight.unit === 'imperial' 
                    ? `That's ${Math.round(parseFloat(formData.weight.pounds || '0') * 0.453592)} kg`
                    : `That's ${Math.round(parseFloat(formData.weight.kg || '0') * 2.20462)} lbs`
                  } ⚖️
                </span>
              </motion.div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid gap-3">
              {[
                { 
                  value: 'lose-weight', 
                  label: 'Lose Weight', 
                  icon: '🔥', 
                  description: 'Burn fat & get lean',
                  color: 'from-red-500 to-orange-500',
                  bgColor: 'bg-red-500/20 border-red-400/30'
                },
                { 
                  value: 'gain-weight', 
                  label: 'Gain Weight', 
                  icon: '💪', 
                  description: 'Build muscle & strength',
                  color: 'from-green-500 to-emerald-600',
                  bgColor: 'bg-green-500/20 border-green-400/30'
                },
                { 
                  value: 'maintain-weight', 
                  label: 'Maintain Weight', 
                  icon: '⚖️', 
                  description: 'Stay healthy & balanced',
                  color: 'from-blue-500 to-cyan-600',
                  bgColor: 'bg-blue-500/20 border-blue-400/30'
                }
              ].map((goal) => (
                <motion.div
                  key={goal.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${
                    formData.goal === goal.value
                      ? 'border-indigo-400 bg-gradient-to-r ' + goal.color + ' shadow-lg shadow-indigo-500/25'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                  onClick={() => updateFormData('goal', goal.value)}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="text-3xl">{goal.icon}</div>
                      <div className="flex-1">
                        <div className="text-white font-bold text-lg">{goal.label}</div>
                        <div className="text-gray-300 text-sm">{goal.description}</div>
                      </div>
                      {formData.goal === goal.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                        >
                          <div className="text-indigo-600 font-bold text-lg">✓</div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {formData.goal === goal.value && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`px-5 pb-3 rounded-b-xl ${goal.bgColor} mx-2 mb-2`}
                    >
                      <div className="text-center text-sm text-white">
                        ✨ Perfect! We'll create a personalized plan for you
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            {formData.goal && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30"
              >
                <span className="text-indigo-300 font-medium">
                  Awesome choice! Our AI will customize everything for your goal 🎯
                </span>
              </motion.div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="relative">
              <Input
                size="lg"
                placeholder="your.email@example.com"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                startContent={<div className="text-indigo-400 text-xl">📧</div>}
                classNames={{
                  base: "text-white",
                  input: "text-white placeholder:text-gray-400 text-lg px-4",
                  inputWrapper: `backdrop-blur-xl bg-white/10 border-2 transition-all duration-300 h-14 rounded-xl ${
                    formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                      ? 'border-green-400/70 bg-green-400/10'
                      : formData.email && formData.email.length > 0
                      ? 'border-red-400/70 bg-red-400/10'
                      : 'border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500'
                  }`
                }}
                variant="bordered"
              />
              {formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shadow-lg"
                >
                  ✓
                </motion.div>
              )}
            </div>
            
            {/* Real-time validation feedback */}
            {formData.email && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center p-3 rounded-lg ${
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                    ? 'bg-green-500/20 border border-green-400/30'
                    : 'bg-amber-500/20 border border-amber-400/30'
                }`}
              >
                <span className={`text-sm ${
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                    ? 'text-green-300'
                    : 'text-amber-300'
                }`}>
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                    ? '✓ Perfect! This email looks great'
                    : '⚠️ Please enter a valid email address'
                  }
                </span>
              </motion.div>
            )}
            
            {formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 rounded-lg bg-indigo-500/20 border border-indigo-400/30"
              >
                <span className="text-indigo-300 text-sm">
                  🎉 Almost there! Just one more step to unlock your AI health coach
                </span>
              </motion.div>
            )}
          </div>
        );

      case 6:
        const passwordStrength = formData.password.length >= 8 ? 'strong' : formData.password.length >= 6 ? 'medium' : 'weak';
        const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
        
        return (
          <div className="space-y-6">
            <div className="relative">
              <Input
                size="lg"
                placeholder="Create a strong password (min 6 characters)"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                startContent={<div className="text-indigo-400 text-xl">🔐</div>}
                classNames={{
                  base: "text-white",
                  input: "text-white placeholder:text-gray-400 text-lg px-4",
                  inputWrapper: "backdrop-blur-xl bg-white/10 border-2 border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500 transition-all duration-300 h-14 rounded-xl"
                }}
                variant="bordered"
              />
              {formData.password.length >= 6 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -right-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-lg ${
                    passwordStrength === 'strong' ? 'bg-green-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                >
                  {passwordStrength === 'strong' ? '✓' : passwordStrength === 'medium' ? '!' : '!'}
                </motion.div>
              )}
            </div>
            
            {/* Password strength indicator */}
            {formData.password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex gap-2">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                        (passwordStrength === 'weak' && level === 1) ||
                        (passwordStrength === 'medium' && level <= 2) ||
                        (passwordStrength === 'strong' && level <= 3)
                          ? level === 1 ? 'bg-red-400' : level === 2 ? 'bg-yellow-400' : 'bg-green-400'
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-center text-sm">
                  <span className={`${
                    passwordStrength === 'strong' ? 'text-green-400' : 
                    passwordStrength === 'medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    Password strength: {passwordStrength === 'strong' ? 'Strong 💪' : 
                                       passwordStrength === 'medium' ? 'Good 👍' : 'Weak ⚠️'}
                  </span>
                </div>
              </motion.div>
            )}
            
            <div className="relative">
              <Input
                size="lg"
                placeholder="Confirm your password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                startContent={<div className="text-indigo-400 text-xl">🔒</div>}
                classNames={{
                  base: "text-white",
                  input: "text-white placeholder:text-gray-400 text-lg px-4",
                  inputWrapper: `backdrop-blur-xl bg-white/10 border-2 transition-all duration-300 h-14 rounded-xl ${
                    formData.confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-400/70 bg-green-400/10'
                        : 'border-red-400/70 bg-red-400/10'
                      : 'border-white/20 hover:border-indigo-400/70 group-data-[focused=true]:border-indigo-500'
                  }`
                }}
                variant="bordered"
              />
              {passwordsMatch && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-2 -top-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm shadow-lg"
                >
                  ✓
                </motion.div>
              )}
            </div>
            
            {/* Password match feedback */}
            {formData.confirmPassword.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center p-3 rounded-lg ${
                  passwordsMatch
                    ? 'bg-green-500/20 border border-green-400/30'
                    : 'bg-red-500/20 border border-red-400/30'
                }`}
              >
                <span className={`text-sm ${
                  passwordsMatch ? 'text-green-300' : 'text-red-300'
                }`}>
                  {passwordsMatch ? '✓ Passwords match perfectly!' : '✖ Passwords don\'t match'}
                </span>
              </motion.div>
            )}
            
            {formData.password.length >= 6 && passwordsMatch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30"
              >
                <div className="text-green-300 font-bold text-lg mb-2">
                  🎉 You're all set!
                </div>
                <div className="text-green-300 text-sm">
                  Ready to launch your personalized AI health journey?
                </div>
              </motion.div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto glass-strong border border-white/20 animate-glow">
      <CardHeader className="text-center pb-6">
        <div className="w-full">
          {/* Header with close button and step indicator */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold animate-neural-pulse">
                {currentStep + 1}
              </div>
              <div className="text-sm text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl transition-colors duration-200 hover:scale-110"
            >
              ✕
            </button>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="relative mb-6">
            <Progress
              value={(currentStep + 1) / steps.length * 100}
              className="mb-2"
              classNames={{
                track: "bg-white/10 backdrop-blur-sm h-2",
                indicator: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-shift",
              }}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Getting Started</span>
              <span className="gradient-text font-semibold">{Math.round((currentStep + 1) / steps.length * 100)}% Complete</span>
            </div>
          </div>
          
          {/* Step Title and Description */}
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-3"
          >
            <h3 className="text-2xl font-bold gradient-text mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-300 text-base">
              {steps[currentStep].description}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-400/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-medium">{steps[currentStep].benefit}</span>
            </div>
          </motion.div>
        </div>
      </CardHeader>

      <CardBody className="pt-0 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ 
              duration: 0.4, 
              type: "spring",
              stiffness: 100,
              damping: 20
            }}
            className="space-y-6"
          >
            {renderStep()}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg bg-red-500/20 border border-red-400/30 text-center"
              >
                <div className="text-red-400 text-sm font-medium flex items-center justify-center gap-2">
                  <span>⚠️</span>
                  {error}
                </div>
              </motion.div>
            )}

            {/* Success feedback for each step */}
            {validateStep(currentStep) && !error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Ready for next step!</span>
                </div>
              </motion.div>
            )}

            <div className="flex gap-4 pt-6">
              {currentStep > 0 && (
                <Button
                  variant="bordered"
                  className="flex-1 glass-strong border-white/30 text-white hover:bg-white/10 transition-all duration-300 h-12 font-semibold"
                  onClick={prevStep}
                  startContent={<span className="text-lg">←</span>}
                >
                  Back
                </Button>
              )}
              
              <Button
                className={`flex-1 btn-ai-primary relative overflow-hidden group h-12 font-bold text-lg ${
                  currentStep === 0 ? 'w-full' : ''
                } ${
                  !validateStep(currentStep) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={nextStep}
                isLoading={loading}
                disabled={loading || !validateStep(currentStep)}
                endContent={
                  !loading && (
                    <span className="text-lg transition-transform group-hover:translate-x-1 duration-200">
                      {currentStep === steps.length - 1 ? '🚀' : '→'}
                    </span>
                  )
                }
              >
                <span className="relative z-10">
                  {currentStep === steps.length - 1 ? 'Launch My Journey!' : 'Continue'}
                </span>
                {validateStep(currentStep) && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardBody>
    </Card>
  );
}