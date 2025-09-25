import { motion } from "framer-motion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { ReactNode } from "react";

interface AICardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export const AICard: React.FC<AICardProps> = ({ 
  children, 
  className = "", 
  hover = true, 
  glow = false 
}) => {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`ai-card ${glow ? "animate-glow" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface AIPrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const AIPrimaryButton: React.FC<AIPrimaryButtonProps> = ({
  children,
  onClick,
  size = "md",
  disabled = false,
  loading = false,
  className = ""
}) => {
  const sizeClasses = {
    sm: "px-6 py-2 text-sm",
    md: "px-8 py-3 text-base",
    lg: "px-10 py-4 text-lg"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`btn-ai-primary ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

interface AIGlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "bordered" | "solid";
  className?: string;
}

export const AIGlassButton: React.FC<AIGlassButtonProps> = ({
  children,
  onClick,
  variant = "bordered",
  className = ""
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`glass-strong rounded-xl px-6 py-3 font-semibold transition-all duration-300 
        ${variant === "bordered" 
          ? "border border-white/20 text-white hover:bg-white/10" 
          : "text-white bg-white/10 hover:bg-white/20"
        } ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

interface AIProgressCardProps {
  title: string;
  description: string;
  progress: number;
  icon: ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
}

export const AIProgressCard: React.FC<AIProgressCardProps> = ({
  title,
  description,
  progress,
  icon,
  color = "primary"
}) => {
  const colorClasses = {
    primary: "from-ai-primary to-ai-secondary",
    secondary: "from-ai-accent to-ai-primary",
    success: "from-green-500 to-emerald-500",
    warning: "from-yellow-500 to-orange-500",
    danger: "from-red-500 to-pink-500"
  };

  return (
    <AICard className="group cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorClasses[color]} p-2 text-white flex items-center justify-center group-hover:animate-neural-pulse`}>
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{title}</h3>
              <p className="text-gray-400 text-sm">{description}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Progress</span>
            <span className="text-white font-semibold">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
            classNames={{
              track: "glass",
              indicator: `bg-gradient-to-r ${colorClasses[color]}`
            }}
          />
        </div>
      </CardBody>
    </AICard>
  );
};

interface AIMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  trend?: "up" | "down" | "stable";
}

export const AIMetricCard: React.FC<AIMetricCardProps> = ({
  title,
  value,
  change,
  icon,
  trend = "stable"
}) => {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    stable: "text-gray-400"
  };

  const trendIcons = {
    up: "↗",
    down: "↘",
    stable: "→"
  };

  return (
    <AICard className="group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 ${trendColors[trend]} text-sm`}>
              <span>{trendIcons[trend]}</span>
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className="text-3xl group-hover:animate-neural-pulse">
          {icon}
        </div>
      </div>
    </AICard>
  );
};

interface AINotificationProps {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  onClose?: () => void;
}

export const AINotification: React.FC<AINotificationProps> = ({
  title,
  message,
  type = "info",
  onClose
}) => {
  const typeStyles = {
    info: "border-blue-400/30 bg-blue-500/10",
    success: "border-green-400/30 bg-green-500/10",
    warning: "border-yellow-400/30 bg-yellow-500/10",
    error: "border-red-400/30 bg-red-500/10"
  };

  const typeColors = {
    info: "text-blue-400",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`glass-strong border rounded-xl p-4 ${typeStyles[type]}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className={`font-semibold ${typeColors[type]} mb-1`}>{title}</h4>
          <p className="text-gray-300 text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
};

interface AIChipProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AIChip: React.FC<AIChipProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = ""
}) => {
  const variantStyles = {
    primary: "bg-ai-gradient",
    secondary: "bg-ai-gradient-secondary",
    success: "bg-gradient-to-r from-green-500 to-emerald-500",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500",
    danger: "bg-gradient-to-r from-red-500 to-pink-500"
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold text-white ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};

export const AILoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ 
  size = "md" 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} rounded-full border-2 border-white/20 border-t-white animate-spin`} />
    </div>
  );
};

interface AIDataVisualizationProps {
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
}

export const AIDataVisualization: React.FC<AIDataVisualizationProps> = ({
  data,
  title
}) => {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <AICard>
      {title && (
        <CardHeader>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </CardHeader>
      )}
      <CardBody>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">{item.label}</span>
                <span className="text-white font-semibold">{item.value}</span>
              </div>
              <div className="h-2 glass rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-full ${item.color || "bg-ai-gradient"} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </AICard>
  );
};