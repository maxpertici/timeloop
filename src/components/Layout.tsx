import { cn } from "@/lib/utils";
import { Clock, Calculator, List, Tags } from "lucide-react";

type View = "track" | "count" | "entries" | "categories";

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "track", label: "Track", icon: <Clock className="h-5 w-5" /> },
  { id: "count", label: "Count", icon: <Calculator className="h-5 w-5" /> },
  { id: "entries", label: "Entries", icon: <List className="h-5 w-5" /> },
  { id: "categories", label: "Categories", icon: <Tags className="h-5 w-5" /> },
];

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  return (
    <div className="h-screen bg-[var(--background)] flex flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>

      {/* Bottom navigation */}
      <nav className="border-t bg-[var(--card)] px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                currentView === item.id
                  ? "text-[var(--primary)] bg-[var(--accent)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/50"
              )}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

