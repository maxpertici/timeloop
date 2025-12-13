import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, Trash2, Tag, CheckSquare, Square, AlertTriangle, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntryModal } from "@/components/EntryModal";
import {
  getCategories,
  getEntries,
  getEntriesForPeriod,
  deleteEntry,
  updateEntry,
} from "@/lib/database";
import type { Category, Entry } from "@/types";

export function EntriesView() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignCategoryDialogOpen, setAssignCategoryDialogOpen] = useState(false);
  const [selectedCategoryForBatch, setSelectedCategoryForBatch] = useState<string>("none");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [periodType, setPeriodType] = useState<"all" | "today" | "week" | "month" | "30days" | "custom">("all");
  const [showCustomDates, setShowCustomDates] = useState(false);

  const loadData = useCallback(async () => {
    const cats = await getCategories();
    setCategories(cats);
    await loadEntriesForPeriod();
  }, [startDate, endDate, periodType]);

  const loadEntriesForPeriod = async () => {
    if (periodType === "all") {
      const allEntries = await getEntries();
      setEntries(allEntries);
    } else if (startDate && endDate) {
      const periodEntries = await getEntriesForPeriod(startDate, endDate);
      setEntries(periodEntries);
    }
  };

  useEffect(() => {
    // Set default period: all entries
    updatePeriod("all");
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updatePeriod = (type: "all" | "today" | "week" | "month" | "30days" | "custom") => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    setPeriodType(type);
    
    switch (type) {
      case "all":
        setStartDate("");
        setEndDate("");
        setShowCustomDates(false);
        break;
      
      case "today":
        setStartDate(todayStr);
        setEndDate(todayStr);
        setShowCustomDates(false);
        break;
      
      case "week": {
        // Start of week (Monday)
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);
        setStartDate(startOfWeek.toISOString().split("T")[0]);
        setEndDate(todayStr);
        setShowCustomDates(false);
        break;
      }
      
      case "month": {
        // Start of month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(startOfMonth.toISOString().split("T")[0]);
        setEndDate(todayStr);
        setShowCustomDates(false);
        break;
      }
      
      case "30days": {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
        setEndDate(todayStr);
        setShowCustomDates(false);
        break;
      }
      
      case "custom":
        setShowCustomDates(true);
        break;
    }
  };

  const filteredEntries = entries.filter((entry) =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectEntry = (entryId: number) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredEntries.map((e) => e.id)));
    }
  };

  const handleOpenEntry = (entry: Entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
    loadData();
  };

  const handleDeleteBatch = () => {
    if (selectedEntries.size === 0) return;
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteBatch = async () => {
    try {
      await Promise.all(
        Array.from(selectedEntries).map((id) => deleteEntry(id))
      );
      setSelectedEntries(new Set());
      await loadData();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("Unable to delete some entries.");
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleAssignCategory = () => {
    if (selectedEntries.size === 0) return;
    setAssignCategoryDialogOpen(true);
  };

  const handleConfirmAssignCategory = async () => {
    try {
      const categoryId = selectedCategoryForBatch && selectedCategoryForBatch !== "none" 
        ? parseInt(selectedCategoryForBatch) 
        : null;

      await Promise.all(
        Array.from(selectedEntries).map((id) => {
          const entry = entries.find((e) => e.id === id);
          if (entry) {
            return updateEntry(id, entry.title, categoryId);
          }
          return Promise.resolve();
        })
      );

      setSelectedEntries(new Set());
      setSelectedCategoryForBatch("none");
      await loadData();
      setAssignCategoryDialogOpen(false);
    } catch (error) {
      console.error("Error during assignment:", error);
      alert("Unable to assign category.");
    }
  };

  const handleCancelAssignCategory = () => {
    setAssignCategoryDialogOpen(false);
    setSelectedCategoryForBatch("none");
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b p-4 space-y-3 shadow-sm">
        {/* Title + Period buttons */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">{t('entries.title')}</h1>
          
          {/* Period quick buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={periodType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => updatePeriod("all")}
            >
              {t('entries.all')}
            </Button>
            <Button
              variant={periodType === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => updatePeriod("today")}
            >
              {t('count.today')}
            </Button>
            <Button
              variant={periodType === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => updatePeriod("week")}
            >
              {t('count.thisWeek')}
            </Button>
            <Button
              variant={periodType === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => updatePeriod("month")}
            >
              {t('count.thisMonth')}
            </Button>
            <Button
              variant={periodType === "30days" ? "default" : "outline"}
              size="sm"
              onClick={() => updatePeriod("30days")}
            >
              {t('count.last30Days')}
            </Button>
            <Button
              variant={periodType === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => updatePeriod("custom")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {t('count.custom')}
            </Button>
          </div>
        </div>

        {/* Custom date inputs (only shown when custom is selected) */}
        {showCustomDates && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">→</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
          <Input
            placeholder={t('entries.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Batch actions */}
        {selectedEntries.size > 0 && (
          <div className="flex items-center gap-2 bg-[var(--accent)] p-2 rounded-lg">
            <span className="text-sm font-medium flex-1">
              {selectedEntries.size} {t('entries.selected')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAssignCategory}
              className="h-8"
            >
              <Tag className="h-4 w-4 mr-1" />
              {t('entries.assignCategory')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteBatch}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('entries.delete')}
            </Button>
          </div>
        )}
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Select all + entries count */}
        {filteredEntries.length > 0 && (
          <div className="flex items-center justify-between pb-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {selectedEntries.size === filteredEntries.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {t('entries.selectAll')}
            </button>
            <div className="text-sm text-[var(--muted-foreground)]">
              {entries.length} {entries.length > 1 ? t('entries.entries') : t('entries.entry')}
            </div>
          </div>
        )}

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <p>{t('entries.noEntriesFound')}</p>
            <p className="text-sm mt-1">
              {searchQuery
                ? t('entries.tryAnotherSearch')
                : t('entries.createFirstEntry')}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-[var(--card)] border rounded-lg p-3 hover:bg-[var(--accent)]/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelectEntry(entry.id)}
                  className="shrink-0"
                >
                  {selectedEntries.has(entry.id) ? (
                    <CheckSquare className="h-5 w-5 text-[var(--primary)]" />
                  ) : (
                    <Square className="h-5 w-5 text-[var(--muted-foreground)]" />
                  )}
                </button>

                {/* Entry info */}
                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => handleOpenEntry(entry)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{entry.title}</span>
                    {(entry as any).category_name && (
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${(entry as any).category_color}20`,
                          color: (entry as any).category_color,
                        }}
                      >
                        {(entry as any).category_name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Entry Modal */}
      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          categories={categories}
          isNewEntry={false}
          onDataChanged={loadData}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--destructive)]" />
              {t('entries.confirmDelete')}
            </DialogTitle>
            <DialogDescription>
              {t('entries.confirmDeleteMessage', { 
                count: selectedEntries.size, 
                entriesWord: selectedEntries.size > 1 ? t('entries.entries') : t('entries.entry') 
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              {t('entries.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteBatch}>
              {t('entries.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign category dialog */}
      <Dialog open={assignCategoryDialogOpen} onOpenChange={setAssignCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('entries.assignCategoryTitle')}</DialogTitle>
            <DialogDescription>
              {t('entries.assignCategoryMessage', { 
                count: selectedEntries.size, 
                entriesWord: selectedEntries.size > 1 ? t('entries.entries') : t('entries.entry') 
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedCategoryForBatch}
              onValueChange={setSelectedCategoryForBatch}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('entries.selectCategoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('entries.categoryNone')}</SelectItem>
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
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAssignCategory}>
              {t('entries.cancel')}
            </Button>
            <Button onClick={handleConfirmAssignCategory}>
              {t('entries.assign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
