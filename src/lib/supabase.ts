import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DatabaseEvent = {
  id: string;
  title: string;
  short_description: string | null;
  full_description: string;
  start_date: string;
  end_date: string | null;
  venue: string;
  cover_image: string | null;
  registration_link: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactSubmission = {
  id: string;
  name: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

// Client-safe environment variables
const supabaseUrl = (import.meta.env["VITE_SUPABASE_URL"] as string) || "";
const supabaseAnonKey = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string) || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (null as unknown as SupabaseClient);

/**
 * Check if the currently authenticated user has an entry in admin_users
 */
export async function checkIsAdmin(userId?: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const id = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!id) return false;

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  } catch (err) {
    console.error("Error checking admin privileges:", err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// Events API
// -----------------------------------------------------------------------------

/**
 * Fetch all published events for public display (Events page & mascot assistant)
 */
export async function getPublishedEvents(): Promise<DatabaseEvent[]> {
  if (!supabase) {
    console.warn("Supabase is not configured. Returning empty events list.");
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Failed to fetch published events:", error);
    throw new Error(error.message || "Failed to load events.");
  }

  return (data as DatabaseEvent[]) || [];
}

/**
 * Fetch all events (published & unpublished) for authorized administrators
 */
export async function getAllEventsAdmin(): Promise<DatabaseEvent[]> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch admin events:", error);
    throw new Error(error.message || "Failed to load events.");
  }

  return (data as DatabaseEvent[]) || [];
}

/**
 * Create a new event (Admin only)
 */
export async function createEvent(
  event: Omit<DatabaseEvent, "id" | "created_at" | "updated_at">,
): Promise<DatabaseEvent> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("events")
    .insert([event])
    .select()
    .single();

  if (error) {
    console.error("Failed to create event:", error);
    throw new Error(error.message || "Failed to create event.");
  }

  return data as DatabaseEvent;
}

/**
 * Update an existing event (Admin only)
 */
export async function updateEvent(
  id: string,
  updates: Partial<Omit<DatabaseEvent, "id" | "created_at" | "updated_at">>,
): Promise<DatabaseEvent> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update event:", error);
    throw new Error(error.message || "Failed to update event.");
  }

  return data as DatabaseEvent;
}

/**
 * Delete an event (Admin only)
 */
export async function deleteEvent(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete event:", error);
    throw new Error(error.message || "Failed to delete event.");
  }
}

/**
 * Upload event cover image to Supabase Storage with validation
 */
export async function uploadEventCoverImage(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");

  // Validation: format and size
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WEBP, and GIF are supported.");
  }

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    throw new Error("File size exceeds 5MB limit.");
  }

  onProgress?.(10);
  const fileExt = file.name.split(".").pop() || "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `events/${uniqueName}`;

  onProgress?.(40);
  const { error: uploadError } = await supabase.storage
    .from("event-covers")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error(uploadError.message || "Failed to upload image.");
  }

  onProgress?.(90);
  const { data: publicData } = supabase.storage
    .from("event-covers")
    .getPublicUrl(filePath);

  onProgress?.(100);
  return publicData.publicUrl;
}

// -----------------------------------------------------------------------------
// Contact Submissions API
// -----------------------------------------------------------------------------

/**
 * Public submission of a contact message
 */
export async function submitContactMessage(submission: {
  name: string;
  subject: string;
  message: string;
}): Promise<void> {
  const name = submission.name.trim();
  const subject = submission.subject.trim();
  const message = submission.message.trim();

  if (!name || name.length > 100) {
    throw new Error("Name is required and must not exceed 100 characters.");
  }
  if (!subject || subject.length > 150) {
    throw new Error("Subject is required and must not exceed 150 characters.");
  }
  if (!message || message.length > 2000) {
    throw new Error("Message is required and must not exceed 2000 characters.");
  }

  if (!supabase) {
    throw new Error("Contact system is currently undergoing maintenance. Please reach out via email or Telegram.");
  }

  const { error } = await supabase.from("contact_submissions").insert([
    {
      name,
      subject,
      message,
      is_read: false,
    },
  ]);

  if (error) {
    console.error("Contact submission error:", error);
    throw new Error("Unable to deliver your message right now. Please try again later.");
  }
}

/**
 * Fetch all contact submissions (Admin only)
 */
export async function getContactSubmissionsAdmin(): Promise<ContactSubmission[]> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch contact submissions:", error);
    throw new Error(error.message || "Failed to load contact messages.");
  }

  return (data as ContactSubmission[]) || [];
}

/**
 * Mark contact submission as read or unread (Admin only)
 */
export async function markContactSubmissionRead(
  id: string,
  is_read: boolean,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase
    .from("contact_submissions")
    .update({ is_read })
    .eq("id", id);

  if (error) {
    console.error("Failed to update submission status:", error);
    throw new Error(error.message || "Failed to update status.");
  }
}

/**
 * Delete a contact submission (Admin only)
 */
export async function deleteContactSubmission(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase
    .from("contact_submissions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete contact submission:", error);
    throw new Error(error.message || "Failed to delete submission.");
  }
}
