import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, List, Layers, Edit2, Trash2, AlertTriangle } from "lucide-react";
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
  getTimeEntries,
  getEntriesWithTotalTimeIncludingEmpty,
  searchEntries,
  createEntry,
  getEntryById,
  deleteEntry,
  deleteTimeEntry,
} from "@/lib/database";
import type { Category, Entry, TimeEntryWithDetails } from "@/types";

type ViewMode = "detailed" | "grouped";

export function TrackView() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithDetails[]>([]);
  const [groupedEntries, setGroupedEntries] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Entry[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'entry' | 'timeEntry', id: number } | null>(null);

  const loadData = useCallback(async () => {
    const [cats, entries, grouped] = await Promise.all([
      getCategories(),
      getTimeEntries(),
      getEntriesWithTotalTimeIncludingEmpty(),
    ]);
    setCategories(cats);
    setTimeEntries(entries);
    setGroupedEntries(grouped);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length > 0) {
        const results = await searchEntries(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    search();
  }, [searchQuery]);

  const handleSelectEntry = async (entry: Entry) => {
    setSelectedEntry(entry);
    setIsNewEntry(false);
    setIsModalOpen(true);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleCreateNewEntry = async () => {
    if (!searchQuery.trim()) return;

    const categoryId = selectedCategoryId && selectedCategoryId !== "none" ? parseInt(selectedCategoryId) : null;
    const newEntryId = await createEntry(searchQuery.trim(), categoryId);
    const newEntry = await getEntryById(newEntryId);

    if (newEntry) {
      setSelectedEntry(newEntry);
      setIsNewEntry(true);
      setIsModalOpen(true);
    }

    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
    loadData();
  };

  const handleDeleteClick = (type: 'entry' | 'timeEntry', id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      if (deleteTarget.type === 'entry') {
        await deleteEntry(deleteTarget.id);
      } else {
        await deleteTimeEntry(deleteTarget.id);
      }
      await loadData();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("Unable to delete.");
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
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

  // Filter entries by selected category
  const filteredTimeEntries = selectedCategoryId && selectedCategoryId !== "none"
    ? timeEntries.filter(te => {
        const categoryIdNum = parseInt(selectedCategoryId);
        // We need to match against the entry's category
        return te.category_name !== null && 
               categories.find(c => c.id === categoryIdNum && c.name === te.category_name);
      })
    : timeEntries;

  const filteredGroupedEntries = selectedCategoryId && selectedCategoryId !== "none"
    ? groupedEntries.filter(entry => {
        const categoryIdNum = parseInt(selectedCategoryId);
        return entry.category_id === categoryIdNum;
      })
    : groupedEntries;

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-full flex flex-col">
      {/* Sticky form header */}
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b p-4 space-y-3 shadow-sm">
        {/* Toggle view mode */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t('track.title')}</h1>
          <div className="flex gap-1 bg-[var(--muted)] p-1 rounded-lg">
            <Button
              variant={viewMode === "grouped" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grouped")}
              className="h-8 px-3"
            >
              <Layers className="h-4 w-4 mr-1" />
              {t('track.grouped')}
            </Button>
            <Button
              variant={viewMode === "detailed" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("detailed")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              {t('track.detailed')}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder={t('track.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  handleCreateNewEntry();
                }
                if (e.key === "Escape") {
                  setIsSearchOpen(false);
                }
              }}
              className="pl-9"
            />
            
            {/* Dropdown */}
            {isSearchOpen && (searchQuery.trim() || searchResults.length > 0) && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-[var(--popover)] border rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto"
              >
                {searchResults.length > 0 && (
                  <div className="p-1">
                    <div className="px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      {t('track.existingEntries')}
                    </div>
                    {searchResults.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => handleSelectEntry(entry)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--accent)] text-left"
                      >
                        <span>{entry.title}</span>
                        {(entry as Entry & { category_name?: string; category_color?: string }).category_name && (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${(entry as Entry & { category_color?: string }).category_color}20`,
                              color: (entry as Entry & { category_color?: string }).category_color,
                            }}
                          >
                            {(entry as Entry & { category_name?: string }).category_name}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.trim() && (
                  <div className="p-1 border-t">
                    <div className="px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      {t('track.newEntry')}
                    </div>
                    <button
                      onClick={handleCreateNewEntry}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-[var(--accent)] text-left"
                    >
                      <Plus className="h-4 w-4" />
                      {t('track.createEntry', { query: searchQuery })}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('track.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('track.categoryNone')}</SelectItem>
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
      </div>

      {/* Time entries list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {viewMode === "grouped" ? (
          // Grouped view
          filteredGroupedEntries.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              <p>{t('track.noEntries')}</p>
              <p className="text-sm mt-1">
                {selectedCategoryId && selectedCategoryId !== "none"
                  ? t('track.noEntriesCategory')
                  : t('track.noEntriesHint')}
              </p>
            </div>
          ) : (
            filteredGroupedEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-[var(--card)] border rounded-lg p-3 hover:bg-[var(--accent)]/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Colonne 1: Info */}
                  <div 
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={async () => {
                      const fullEntry = await getEntryById(entry.id);
                      if (fullEntry) {
                        setSelectedEntry(fullEntry);
                        setIsNewEntry(false);
                        setIsModalOpen(true);
                      }
                    }}
                  >
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
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mt-0.5">
                      {entry.entry_count > 0 ? (
                        <>
                          <span>{entry.entry_count} {entry.entry_count > 1 ? t('track.entries') : t('track.entry')}</span>
                          <span>•</span>
                          {entry.first_date === entry.last_date ? (
                            <span>{formatDate(entry.last_date)}</span>
                          ) : (
                            <span>{t('track.from')} {formatDate(entry.first_date)} {t('track.to')} {formatDate(entry.last_date)}</span>
                          )}
                        </>
                      ) : (
                        <span>{t('track.noTimeRecorded')}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Colonne 2: Temps */}
                  <div className="text-right min-w-[80px]">
                    <span className="text-lg font-bold">
                      {formatDuration(entry.total_duration)}
                    </span>
                  </div>
                  
                  {/* Colonne 3: Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={async () => {
                        const fullEntry = await getEntryById(entry.id);
                        if (fullEntry) {
                          setSelectedEntry(fullEntry);
                          setIsNewEntry(false);
                          setIsModalOpen(true);
                        }
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                      onClick={(e) => handleDeleteClick('entry', entry.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          // Detailed view
          filteredTimeEntries.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted-foreground)]">
              <p>{t('track.noEntries')}</p>
              <p className="text-sm mt-1">
                {selectedCategoryId && selectedCategoryId !== "none"
                  ? t('track.noEntriesCategory')
                  : t('track.noEntriesHint')}
              </p>
            </div>
          ) : (
            filteredTimeEntries.map((te) => (
              <div
                key={te.id}
                className="bg-[var(--card)] border rounded-lg p-3 hover:bg-[var(--accent)]/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Colonne 1: Info */}
                  <div 
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={async () => {
                      const entry = await getEntryById(te.entry_id);
                      if (entry) {
                        setSelectedEntry(entry);
                        setIsNewEntry(false);
                        setIsModalOpen(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{te.entry_title}</span>
                      {te.category_name && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${te.category_color}20`,
                            color: te.category_color || undefined,
                          }}
                        >
                          {te.category_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)] mt-0.5">
                      {formatDate(te.date)}
                      {te.note && <span className="ml-2">• {te.note}</span>}
                    </div>
                  </div>
                  
                  {/* Colonne 2: Temps */}
                  <div className="text-right min-w-[80px]">
                    <span className="text-lg font-semibold">
                      {formatDuration(te.duration)}
                    </span>
                  </div>
                  
                  {/* Colonne 3: Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={async () => {
                        const entry = await getEntryById(te.entry_id);
                        if (entry) {
                          setSelectedEntry(entry);
                          setIsNewEntry(false);
                          setIsModalOpen(true);
                        }
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                      onClick={(e) => handleDeleteClick('timeEntry', te.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Entry Modal */}
      {selectedEntry && (
        <EntryModal
          entry={selectedEntry}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          categories={categories}
          isNewEntry={isNewEntry}
          onDataChanged={loadData}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--destructive)]" />
              {t('track.confirmDelete')}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === 'entry'
                ? t('track.confirmDeleteEntry')
                : t('track.confirmDeleteTimeEntry')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              {t('track.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t('track.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

