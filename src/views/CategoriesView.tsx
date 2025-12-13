import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Edit2, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/database";
import type { Category } from "@/types";

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#64748b", // slate
];

export function CategoriesView() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const loadCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCategory(newName.trim(), newColor);
    setNewName("");
    setNewColor(PRESET_COLORS[0]);
    loadCategories();
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateCategory(editingId, editName.trim(), editColor);
    setEditingId(null);
    setEditName("");
    setEditColor("");
    loadCategories();
  };

  const handleDeleteClick = (id: number) => {
    console.log("handleDeleteClick called with id:", id);
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    
    console.log("Confirmation obtained, deleting...");
    try {
      await deleteCategory(categoryToDelete);
      console.log("Deletion successful, reloading categories");
      await loadCategories();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("Unable to delete this category.");
    }
  };

  const handleCancelDelete = () => {
    console.log("Deletion cancelled by user");
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <h1 className="text-xl font-semibold mb-4">{t('categories.title')}</h1>

      {/* Create form */}
      <div className="space-y-3 mb-6 p-4 bg-[var(--card)] border rounded-lg">
        <Input
          placeholder={t('categories.categoryName')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted-foreground)] shrink-0">{t('categories.color')}</span>
          <div className="flex gap-1 flex-wrap flex-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  newColor === color ? "ring-2 ring-offset-2 ring-[var(--primary)] scale-110" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button onClick={handleCreate} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            {t('categories.add')}
          </Button>
        </div>
      </div>

      {/* Categories list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <p>{t('categories.noCategories')}</p>
            <p className="text-sm mt-1">{t('categories.createFirstCategory')}</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3 bg-[var(--card)] border rounded-lg"
            >
              {editingId === cat.id ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: editColor }}
                  />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    {PRESET_COLORS.slice(0, 6).map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={`w-5 h-5 rounded-full ${
                          editColor === color ? "ring-2 ring-offset-1 ring-[var(--primary)]" : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 font-medium">{cat.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartEdit(cat)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(cat.id)}
                    className="text-[var(--destructive)] hover:text-[var(--destructive)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--destructive)]" />
              {t('categories.confirmDelete')}
            </DialogTitle>
            <DialogDescription>
              {t('categories.confirmDeleteMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              {t('categories.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t('categories.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

