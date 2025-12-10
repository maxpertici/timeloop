export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Entry {
  id: number;
  title: string;
  category_id: number | null;
  created_at: string;
  category?: Category;
}

export interface TimeEntry {
  id: number;
  entry_id: number;
  duration: number;
  date: string;
  note: string | null;
  created_at: string;
  entry?: Entry;
}

export interface TimeEntryWithDetails extends TimeEntry {
  entry_title: string;
  category_name: string | null;
  category_color: string | null;
}

