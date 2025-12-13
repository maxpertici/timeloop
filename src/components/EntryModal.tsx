import { useState, useEffect, useRef } from "react";
import { Calendar, Plus, Trash2, Edit2, Check, X, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  deleteEntry,
  updateEntry,
  updateTimeEntry,
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
  const [title, setTitle] = useState(entry.title);
  const [categoryId, setCategoryId] = useState(
    entry.category_id?.toString() || "none"
  );
  const [editingTimeEntryId, setEditingTimeEntryId] = useState<number | null>(null);
  const [editDuration, setEditDuration] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timeEntryToDelete, setTimeEntryToDelete] = useState<number | null>(null);
  const [deleteEntryDialogOpen, setDeleteEntryDialogOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const durationInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const loadTimeEntries = async () => {
    const entries = await getTimeEntriesForEntry(entry.id);
    setTimeEntries(entries);
  };

  useEffect(() => {
    if (isOpen) {
      loadTimeEntries();
      setTitle(entry.title);
      setCategoryId(entry.category_id?.toString() || "none");
      setIsEditingTitle(false);
      // Focus on duration input after a small delay to ensure the dialog is fully rendered
      setTimeout(() => {
        durationInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, entry.id, entry.title, entry.category_id]);

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

  const handleDeleteClick = (id: number) => {
    setTimeEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!timeEntryToDelete) return;
    
    await deleteTimeEntry(timeEntryToDelete);
    await loadTimeEntries();
    onDataChanged?.();
    setDeleteDialogOpen(false);
    setTimeEntryToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTimeEntryToDelete(null);
  };

  const handleStartEdit = (te: TimeEntry) => {
    setEditingTimeEntryId(te.id);
    setEditDuration(te.duration.toString());
    setEditDate(te.date);
    setEditNote(te.note || "");
  };

  const handleCancelEdit = () => {
    setEditingTimeEntryId(null);
    setEditDuration("");
    setEditDate("");
    setEditNote("");
  };

  const handleSaveEdit = async () => {
    if (!editingTimeEntryId) return;
    
    const durationMinutes = parseInt(editDuration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) return;

    await updateTimeEntry(
      editingTimeEntryId,
      durationMinutes,
      editDate,
      editNote.trim() || null
    );
    
    setEditingTimeEntryId(null);
    setEditDuration("");
    setEditDate("");
    setEditNote("");
    await loadTimeEntries();
    onDataChanged?.();
  };

  const handleCategoryChange = async (value: string) => {
    setCategoryId(value);
    const newCategoryId = value && value !== "none" ? parseInt(value) : null;
    await updateEntry(entry.id, title, newCategoryId);
    onDataChanged?.(); // Notify parent
  };

  const handleTitleBlur = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitle(entry.title); // Reset to original if empty
      setIsEditingTitle(false);
      return;
    }
    if (trimmedTitle !== entry.title) {
      await updateEntry(entry.id, trimmedTitle, entry.category_id);
      onDataChanged?.(); // Notify parent
    }
    setIsEditingTitle(false);
  };

  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 50);
  };

  const handleDeleteEntry = () => {
    setDeleteEntryDialogOpen(true);
  };

  const handleConfirmDeleteEntry = async () => {
    await deleteEntry(entry.id);
    setDeleteEntryDialogOpen(false);
    onDataChanged?.();
    onClose();
  };

  const handleCancelDeleteEntry = () => {
    setDeleteEntryDialogOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
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
        <DialogHeader className="-mt-2">
          <div className="space-y-2">
            {/* Category badge at top left - aligned with close button */}
            <div className="min-h-[20px] flex items-center pb-3 mb-6 border-b">
              {currentCategory ? (
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${currentCategory.color}20`,
                    color: currentCategory.color,
                  }}
                >
                  {currentCategory.name}
                </Badge>
              ) : (
                <div className="h-[20px]"></div>
              )}
            </div>
            
            {/* Title with edit/delete buttons */}
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleBlur();
                    if (e.key === "Escape") {
                      setTitle(entry.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-lg font-semibold flex-1"
                  placeholder="Entry title"
                />
              ) : (
                <h2 className="text-lg font-semibold flex-1">{title}</h2>
              )}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStartEditTitle}
                  className="h-8 w-8 shrink-0"
                  title="Edit title"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteEntry}
                  className="h-8 w-8 shrink-0 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                  title="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <DialogDescription className="mt-4">
              {isNewEntry
                ? "New entry created. Add time below."
                : `Total: ${formatDuration(totalTime)}`}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Category selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
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
            <label className="text-sm font-medium">Add time</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  ref={durationInputRef}
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
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Time entries history */}
          <div className="space-y-2">
            <label className="text-sm font-medium">History</label>
            {timeEntries.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                No time recorded
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {timeEntries.map((te) => (
                  <div
                    key={te.id}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    {editingTimeEntryId === te.id ? (
                      // Edit mode
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Minutes"
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            min="1"
                            className="flex-1 bg-white"
                          />
                          <Input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="flex-1 bg-white"
                          />
                        </div>
                        <Input
                          placeholder="Note (optional)"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="bg-white"
                        />
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSaveEdit}
                          >
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div>
                            <span className="font-medium">
                              {formatDuration(te.duration)}
                            </span>
                            <span className="text-sm text-[var(--muted-foreground)] ml-2">
                              {formatDate(te.date)}
                            </span>
                          </div>
                          {te.note && (
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">
                              {te.note}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(te)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(te.id)}
                            className="h-8 w-8 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Delete time entry confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--destructive)]" />
              Confirm deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recorded time? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete entry confirmation dialog */}
      <Dialog open={deleteEntryDialogOpen} onOpenChange={setDeleteEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--destructive)]" />
              Confirm entry deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entire entry and all its associated times? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDeleteEntry}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteEntry}>
              Delete entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

