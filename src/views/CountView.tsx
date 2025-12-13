import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Search, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntryModal } from "@/components/EntryModal";
import { getEntriesWithTotalTimeForPeriod, getCategories, calculateTimeForPeriod, getEntryById } from "@/lib/database";
import type { Category, Entry } from "@/types";

interface EntryWithTotal {
  id: number;
  title: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  total_duration: number;
  first_date: string;
  last_date: string;
  entry_count: number;
}

export function CountView() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allEntries, setAllEntries] = useState<EntryWithTotal[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntryWithTotal[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [periodType, setPeriodType] = useState<"today" | "week" | "month" | "30days" | "custom">("30days");
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Set default period: last 30 days
    updatePeriod("30days");
  }, []);

  // Reload entries when period changes
  useEffect(() => {
    if (startDate && endDate) {
      loadEntriesForPeriod();
    }
  }, [startDate, endDate]);

  const loadData = async () => {
    const cats = await getCategories();
    setCategories(cats);
    await loadEntriesForPeriod();
  };

  const loadEntriesForPeriod = async () => {
    if (!startDate || !endDate) return;
    
    const entries = await getEntriesWithTotalTimeForPeriod(startDate, endDate);
    setAllEntries(entries);
    setFilteredEntries(entries);
  };

  const updatePeriod = (type: "today" | "week" | "month" | "30days" | "custom") => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    setPeriodType(type);
    
    switch (type) {
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

  useEffect(() => {
    // Filter entries based on search
    let filtered = allEntries;
    if (searchQuery.trim()) {
      filtered = allEntries.filter((entry) =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort: selected entries first
    const sorted = [...filtered].sort((a, b) => {
      const aSelected = selectedEntries.has(a.id);
      const bSelected = selectedEntries.has(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
    
    setFilteredEntries(sorted);
  }, [searchQuery, allEntries, selectedEntries]);

  const toggleEntry = (id: number) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  // Recalculate total when selection, period, or data changes
  useEffect(() => {
    const calculate = async () => {
      if (selectedEntries.size === 0 || !startDate || !endDate) {
        setTotalMinutes(0);
        return;
      }
      
      const entryIds = Array.from(selectedEntries);
      const total = await calculateTimeForPeriod(entryIds, startDate, endDate);
      setTotalMinutes(total);
    };
    
    calculate();
  }, [selectedEntries, startDate, endDate, allEntries]); // Added allEntries dependency

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  const handleOpenEntry = async (entryId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const entry = await getEntryById(entryId);
    if (entry) {
      setSelectedEntry(entry);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
    loadEntriesForPeriod();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sticky header: Period + Search */}
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b p-4 space-y-3 shadow-sm">
        {/* Title + Period buttons */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">{t('count.title')}</h1>
          
          {/* Period quick buttons */}
          <div className="flex gap-2 flex-wrap">
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

        {/* Search + Selected count */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
            <Input
              placeholder={t('count.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {selectedEntries.size > 0 && (
            <Badge 
              variant="default" 
              className="px-3 py-1 text-sm shrink-0"
            >
              {selectedEntries.size} {t('count.selected')}
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable entries list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-20">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <p>{t('count.noEntriesFound')}</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = selectedEntries.has(entry.id);
            return (
              <div
                key={entry.id}
                onClick={() => toggleEntry(entry.id)}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-50 border-blue-400 ring-2 ring-blue-400 shadow-md"
                    : "bg-[var(--card)] hover:bg-[var(--accent)]/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <div className="shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEntry(entry.id)}
                      className="w-5 h-5 rounded cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{entry.title}</span>
                      {entry.category_name && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${entry.category_color}20`,
                            color: entry.category_color || undefined,
                          }}
                        >
                          {entry.category_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)] mt-0.5">
                      {entry.entry_count} {entry.entry_count > 1 ? t('count.entries') : t('count.entry')}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-right min-w-[80px]">
                    <span className="text-lg font-bold">
                      {formatDuration(entry.total_duration)}
                    </span>
                  </div>

                  {/* Edit button */}
                  <div className="shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleOpenEntry(entry.id, e)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky footer: Total */}
      <div className="sticky bottom-0 z-10 bg-[var(--card)] border-t p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <div className="text-sm text-[var(--muted-foreground)]">
              {selectedEntries.size} {selectedEntries.size > 1 ? t('count.entries') : t('count.entry')} {t('count.selected')}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {t('track.from')} {startDate ? new Date(startDate).toLocaleDateString(i18n.language) : "..."} {t('track.to')}{" "}
              {endDate ? new Date(endDate).toLocaleDateString(i18n.language) : "..."}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[var(--muted-foreground)]">{t('count.total')}</div>
            <div className="text-2xl font-bold text-[var(--primary)]">
              {formatDuration(totalMinutes)}
            </div>
          </div>
        </div>
      </div>

      {/* Entry Modal */}
      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          categories={categories}
          onDataChanged={loadData}
        />
      )}
    </div>
  );
}
