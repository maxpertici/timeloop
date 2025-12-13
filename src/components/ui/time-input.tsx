import { forwardRef, useState, useEffect } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface TimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
}

export const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, value = "", onChange, placeholder = "HH:MM", ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
      setDisplayValue(value);
    }, [value]);

    const formatTime = (input: string): string => {
      // Remove all non-digits
      const digits = input.replace(/\D/g, "");
      
      if (digits.length === 0) return "";
      if (digits.length <= 2) {
        const hours = parseInt(digits);
        if (hours > 23) return "23";
        return digits;
      }
      
      // Format as HH:MM
      let hours = digits.slice(0, 2);
      let minutes = digits.slice(2, 4);
      
      // Validate hours
      if (parseInt(hours) > 23) hours = "23";
      
      // Validate minutes
      if (minutes.length > 0 && parseInt(minutes) > 59) minutes = "59";
      
      return minutes ? `${hours}:${minutes}` : hours;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const formatted = formatTime(input);
      setDisplayValue(formatted);
      
      // Only call onChange if we have a complete time (HH:MM)
      if (formatted.includes(":") && formatted.length === 5) {
        onChange?.(formatted);
      } else if (formatted === "") {
        onChange?.("");
      }
    };

    const handleBlur = () => {
      // Auto-complete on blur if we have partial input
      if (displayValue && !displayValue.includes(":")) {
        const hours = displayValue.padStart(2, "0");
        const completed = `${hours}:00`;
        setDisplayValue(completed);
        onChange?.(completed);
      } else if (displayValue && displayValue.length === 4 && displayValue.includes(":")) {
        // Handle cases like "8:3" -> "08:30"
        const [h, m] = displayValue.split(":");
        const completed = `${h.padStart(2, "0")}:${m.padEnd(2, "0")}`;
        setDisplayValue(completed);
        onChange?.(completed);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.key === "Enter" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        return;
      }

      // Allow: Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
      if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) {
        return;
      }

      // Ensure that it is a number or colon
      if (!/[0-9:]/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn("font-mono", className)}
        maxLength={5}
        {...props}
      />
    );
  }
);

TimeInput.displayName = "TimeInput";
