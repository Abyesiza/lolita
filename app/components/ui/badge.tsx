import React from "react";

type BadgeVariant = "default" | "success" | "destructive" | "outline" | "secondary";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ 
  variant = "default", 
  className = "", 
  children 
}: BadgeProps) {
  const variantClasses = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    destructive: "bg-error/10 text-error",
    outline: "border border-gray-light text-gray-dark",
    secondary: "bg-secondary/10 text-secondary"
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
} 