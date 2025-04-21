import React from "react";

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
}

export function Progress({ 
  value = 0, 
  max = 100, 
  className = "" 
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div 
      className={`relative h-1 w-full overflow-hidden rounded-full bg-gray-light ${className}`}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
} 