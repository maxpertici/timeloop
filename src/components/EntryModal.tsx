import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getTimeEntriesForEntry,
  createTimeEntry,
  deleteTimeEntry,
  updateEntry,
} from "@/lib/database";
import type { Category, Entry, TimeEntry } from "@/types";

interface EntryModalProps {
  entry: Entry;
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  isNewEntry?: boolean;
  onDataChanged?: () => void;
}

export function EntryModal({
  entry,
  isOpen,
  onClose,
  categories,
  isNewEntry = false,
  onDataChanged,
}: EntryModalProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState(
    entry.category_id?.toString() || "none"
  );

  const loadTimeEntries = async () => {
    const entries = await getTimeEntriesForEntry(entry.id);
    setTimeEntries(entries);
  };

  useEffect(() => {
    if (isOpen) {
      loadTimeEntries();
      setCategoryId(entry.category_id?.toString() || "none");
    }
  }, [isOpen, entry.id, entry.category_id]);

  const handleAddTime = async () => {
    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) return;

    await createTimeEntry(
      entry.id,
      durationMinutes,
      date,
      note.trim() || null
    );

    setDuration("");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    await loadTimeEntries();
    onDataChanged?.(); // Notify parent
  };

  const handleDeleteTimeEntry = async (id: number) => {
    await deleteTimeEntry(id);
    await loadTimeEntries();
    onDataChanged?.(); // Notify parent
  };

  const handleCategoryChange = async (value: string) => {
    setCategoryId(value);
    const newCategoryId = value && value !== "none" ? parseInt(value) : null;
    await updateEntry(entry.id, entry.title, newCategoryId);
    onDataChanged?.(); // Notify parent
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  const totalTime = timeEntries.reduce((acc, te) => acc + te.duration, 0);
  const currentCategory = categories.find(
    (c) => c.id.toString() === categoryId
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {entry.title}
            {currentCategory && (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${currentCategory.color}20`,
                  color: currentCategory.color,
                }}
              >
                {currentCategory.name}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isNewEntry
              ? "Nouvelle entrée créée. Ajoutez du temps ci-dessous."
              : `Total: ${formatDuration(totalTime)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Catégorie</label>
            <Select value={categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add time form */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Ajouter du temps</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Minutes"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9 w-[160px]"
                />
              </div>
              <Button onClick={handleAddTime} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Note (optionnel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Time entries history */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Historique</label>
            {timeEntries.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                Aucun temps enregistré
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {timeEntries.map((te) => (
                  <div
                    key={te.id}
                    className="flex items-center justify-between bg-[var(--muted)] rounded-lg p-3"
                  >
                    <div>
                      <span className="font-medium">
                        {formatDuration(te.duration)}
                      </span>
                      <span className="text-sm text-[var(--muted-foreground)] ml-2">
                        {formatDate(te.date)}
                      </span>
                      {te.note && (
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                          {te.note}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTimeEntry(te.id)}
                      className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

