import Database from "@tauri-apps/plugin-sql";
import type {
  Category,
  Entry,
  TimeEntry,
  TimeEntryWithDetails,
} from "@/types";

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:timeloop.db");
  }
  return db;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const database = await getDatabase();
  return database.select<Category[]>("SELECT * FROM categories ORDER BY name");
}

export async function createCategory(
  name: string,
  color: string = "#6366f1"
): Promise<number> {
  const database = await getDatabase();
  const result = await database.execute(
    "INSERT INTO categories (name, color) VALUES ($1, $2)",
    [name, color]
  );
  return result.lastInsertId ?? 0;
}

export async function updateCategory(
  id: number,
  name: string,
  color: string
): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    "UPDATE categories SET name = $1, color = $2 WHERE id = $3",
    [name, color, id]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  const database = await getDatabase();
  console.log("Deleting category:", id);
  
  // First, set category_id to NULL for all entries using this category
  const updateResult = await database.execute(
    "UPDATE entries SET category_id = NULL WHERE category_id = $1",
    [id]
  );
  console.log("Update result:", updateResult);
  
  // Then delete the category
  const deleteResult = await database.execute("DELETE FROM categories WHERE id = $1", [id]);
  console.log("Delete result:", deleteResult);
}

// Entries
export async function getEntries(): Promise<Entry[]> {
  const database = await getDatabase();
  return database.select<Entry[]>(`
    SELECT e.*, c.name as category_name, c.color as category_color
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    ORDER BY e.title
  `);
}

export async function getEntriesForPeriod(
  startDate: string,
  endDate: string
): Promise<Entry[]> {
  const database = await getDatabase();
  return database.select<Entry[]>(
    `
    SELECT DISTINCT e.*, c.name as category_name, c.color as category_color
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    INNER JOIN time_entries te ON e.id = te.entry_id
    WHERE te.date >= $1 AND te.date <= $2
    ORDER BY e.title
  `,
    [startDate, endDate]
  );
}

export async function searchEntries(query: string): Promise<Entry[]> {
  const database = await getDatabase();
  return database.select<Entry[]>(
    `
    SELECT e.*, c.name as category_name, c.color as category_color
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.title LIKE $1
    ORDER BY e.title
    LIMIT 10
  `,
    [`%${query}%`]
  );
}

export async function createEntry(
  title: string,
  categoryId: number | null
): Promise<number> {
  const database = await getDatabase();
  const result = await database.execute(
    "INSERT INTO entries (title, category_id) VALUES ($1, $2)",
    [title, categoryId]
  );
  return result.lastInsertId ?? 0;
}

export async function updateEntry(
  id: number,
  title: string,
  categoryId: number | null
): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    "UPDATE entries SET title = $1, category_id = $2 WHERE id = $3",
    [title, categoryId, id]
  );
}

export async function deleteEntry(id: number): Promise<void> {
  const database = await getDatabase();
  await database.execute("DELETE FROM entries WHERE id = $1", [id]);
}

export async function getEntryById(id: number): Promise<Entry | null> {
  const database = await getDatabase();
  const results = await database.select<Entry[]>(
    `
    SELECT e.*, c.name as category_name, c.color as category_color
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.id = $1
  `,
    [id]
  );
  return results[0] || null;
}

// Time Entries
export async function getTimeEntries(
  limit: number = 50,
  offset: number = 0
): Promise<TimeEntryWithDetails[]> {
  const database = await getDatabase();
  return database.select<TimeEntryWithDetails[]>(
    `
    SELECT 
      te.*,
      e.title as entry_title,
      c.name as category_name,
      c.color as category_color
    FROM time_entries te
    JOIN entries e ON te.entry_id = e.id
    LEFT JOIN categories c ON e.category_id = c.id
    ORDER BY te.date DESC, te.created_at DESC
    LIMIT $1 OFFSET $2
  `,
    [limit, offset]
  );
}

export async function getEntriesWithTotalTime(): Promise<
  Array<{
    id: number;
    title: string;
    category_id: number | null;
    category_name: string | null;
    category_color: string | null;
    total_duration: number;
    first_date: string;
    last_date: string;
    entry_count: number;
  }>
> {
  const database = await getDatabase();
  return database.select(
    `
    SELECT 
      e.id,
      e.title,
      e.category_id,
      c.name as category_name,
      c.color as category_color,
      COALESCE(SUM(te.duration), 0) as total_duration,
      MIN(te.date) as first_date,
      MAX(te.date) as last_date,
      COUNT(te.id) as entry_count
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN time_entries te ON e.id = te.entry_id
    GROUP BY e.id, e.title, e.category_id, c.name, c.color
    HAVING COUNT(te.id) > 0
    ORDER BY MAX(te.date) DESC
  `
  );
}

export async function getEntriesWithTotalTimeIncludingEmpty(): Promise<
  Array<{
    id: number;
    title: string;
    category_id: number | null;
    category_name: string | null;
    category_color: string | null;
    total_duration: number;
    first_date: string | null;
    last_date: string | null;
    entry_count: number;
  }>
> {
  const database = await getDatabase();
  return database.select(
    `
    SELECT 
      e.id,
      e.title,
      e.category_id,
      c.name as category_name,
      c.color as category_color,
      COALESCE(SUM(te.duration), 0) as total_duration,
      MIN(te.date) as first_date,
      MAX(te.date) as last_date,
      COUNT(te.id) as entry_count
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN time_entries te ON e.id = te.entry_id
    GROUP BY e.id, e.title, e.category_id, c.name, c.color
    ORDER BY 
      CASE WHEN MAX(te.date) IS NULL THEN 1 ELSE 0 END,
      MAX(te.date) DESC,
      e.title ASC
  `
  );
}

export async function getTimeEntriesForEntry(
  entryId: number
): Promise<TimeEntry[]> {
  const database = await getDatabase();
  return database.select<TimeEntry[]>(
    `
    SELECT * FROM time_entries
    WHERE entry_id = $1
    ORDER BY date DESC
  `,
    [entryId]
  );
}

export async function createTimeEntry(
  entryId: number,
  duration: number,
  date: string,
  note: string | null = null
): Promise<number> {
  const database = await getDatabase();
  const result = await database.execute(
    "INSERT INTO time_entries (entry_id, duration, date, note) VALUES ($1, $2, $3, $4)",
    [entryId, duration, date, note]
  );
  return result.lastInsertId ?? 0;
}

export async function updateTimeEntry(
  id: number,
  duration: number,
  date: string,
  note: string | null
): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    "UPDATE time_entries SET duration = $1, date = $2, note = $3 WHERE id = $4",
    [duration, date, note, id]
  );
}

export async function deleteTimeEntry(id: number): Promise<void> {
  const database = await getDatabase();
  await database.execute("DELETE FROM time_entries WHERE id = $1", [id]);
}

// Calculate total time for specific entries in a date range
export async function calculateTimeForPeriod(
  entryIds: number[],
  startDate: string,
  endDate: string
): Promise<number> {
  if (entryIds.length === 0) return 0;
  
  const database = await getDatabase();
  const placeholders = entryIds.map((_, i) => `$${i + 3}`).join(", ");
  
  const result = await database.select<Array<{ total: number }>>(
    `
    SELECT COALESCE(SUM(duration), 0) as total
    FROM time_entries
    WHERE entry_id IN (${placeholders})
      AND date >= $1
      AND date <= $2
  `,
    [startDate, endDate, ...entryIds]
  );
  
  return result[0]?.total || 0;
}

// Get entries with total time filtered by date range
export async function getEntriesWithTotalTimeForPeriod(
  startDate: string,
  endDate: string
): Promise<
  Array<{
    id: number;
    title: string;
    category_id: number | null;
    category_name: string | null;
    category_color: string | null;
    total_duration: number;
    first_date: string;
    last_date: string;
    entry_count: number;
  }>
> {
  const database = await getDatabase();
  return database.select(
    `
    SELECT 
      e.id,
      e.title,
      e.category_id,
      c.name as category_name,
      c.color as category_color,
      COALESCE(SUM(te.duration), 0) as total_duration,
      MIN(te.date) as first_date,
      MAX(te.date) as last_date,
      COUNT(te.id) as entry_count
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN time_entries te ON e.id = te.entry_id 
      AND te.date >= $1 
      AND te.date <= $2
    GROUP BY e.id, e.title, e.category_id, c.name, c.color
    HAVING COUNT(te.id) > 0
    ORDER BY MAX(te.date) DESC
  `,
    [startDate, endDate]
  );
}

