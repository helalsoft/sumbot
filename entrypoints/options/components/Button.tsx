import React from "react";

type ButtonSize = "sm" | "md" | "lg";
type ButtonColor = "primary" | "secondary" | "danger" | "default";
type ButtonVariant = "solid" | "bordered" | "text";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: ButtonSize;
  color?: ButtonColor;
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  color = "default",
  variant = "solid",
  className = "",
  disabled = false,
  ...props
}) => {
  // Base classes
  const baseClasses = `rounded transition-colors ${
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
  }`;

  // Size classes
  const sizeClasses = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-5 py-2 text-base",
    lg: "px-6 py-2.5 text-lg",
  };

  // Color classes
  const colorClasses = {
    primary: {
      solid: `bg-green-600 ${
        disabled ? "" : "hover:bg-green-700"
      } text-white font-medium shadow-sm`,
      bordered: `border border-green-600 text-green-600 ${disabled ? "" : "hover:bg-green-600/10"}`,
      text: `text-green-600 ${disabled ? "" : "hover:bg-green-600/10"}`,
    },
    secondary: {
      solid: `bg-blue-600 ${disabled ? "" : "hover:bg-blue-700"} text-white font-medium shadow-sm`,
      bordered: `border border-blue-600 text-blue-600 ${disabled ? "" : "hover:bg-blue-600/10"}`,
      text: `text-blue-600 ${disabled ? "" : "hover:bg-blue-600/10"}`,
    },
    danger: {
      solid: `bg-red-600 ${disabled ? "" : "hover:bg-red-700"} text-white font-medium shadow-sm`,
      bordered: `border border-red-600 text-red-600 ${disabled ? "" : "hover:bg-red-600/10"}`,
      text: `text-red-600 ${
        disabled ? "" : "hover:bg-red-600/10 dark:text-red-400 dark:hover:bg-red-400/10"
      }`,
    },
    default: {
      solid: `bg-foreground ${
        disabled ? "" : "hover:bg-foreground/80"
      } text-background font-medium shadow-sm`,
      bordered: `border border-foreground/50 text-foreground ${
        disabled ? "" : "hover:bg-foreground/10"
      }`,
      text: `text-foreground ${disabled ? "" : "hover:bg-foreground/10"}`,
    },
  };

  // Combine classes
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${colorClasses[color][variant]} ${className}`;

  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
