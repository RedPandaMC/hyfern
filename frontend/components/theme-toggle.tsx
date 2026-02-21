"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
  variant?: "ghost" | "outline";
}

export function ThemeToggle({ className, variant = "ghost" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggle}
      className={`${className} transition-transform duration-300 ease-in-out`}
      style={{
        transform: isAnimating ? "rotate(360deg)" : "rotate(0deg)",
      }}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            theme === "dark" 
              ? "opacity-100 rotate-0 scale-100" 
              : "opacity-0 rotate-180 scale-0"
          }`} 
        />
        <Moon 
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            theme === "dark" 
              ? "opacity-0 -rotate-180 scale-0" 
              : "opacity-100 rotate-0 scale-100"
          }`} 
        />
      </div>
    </Button>
  );
}
