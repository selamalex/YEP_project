import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Mail,
  Plus,
  Edit3,
  Trash2,
  Eye,
  LogOut,
  CheckCircle2,
  Clock,
  MapPin,
  Upload,
  X,
  Search,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Lock,
  Loader2,
  Image as ImageIcon,
  Check,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from "react";
import { pageMeta } from "@/lib/seo";
import {
  supabase,
  isSupabaseConfigured,
  checkIsAdmin,
  getAllEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadEventCoverImage,
  getContactSubmissionsAdmin,
  markContactSubmissionRead,
  deleteContactSubmission,
  type DatabaseEvent,
  type ContactSubmission,
} from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  head: () => pageMeta("Admin Dashboard", "Manage YEP Initiative events and contact submissions."),
  component: AdminPage,
});

type TabType = "overview" | "events" | "messages";

export function AdminPage() {
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Data state
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [messages, setMessages] = useState<ContactSubmission[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // --- Auth verification ---
  const verifySession = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthChecking(false);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const authorized = await checkIsAdmin(session.user.id);
        if (authorized) {
          setSessionUser({ id: session.user.id, email: session.user.email || "" });
          setIsAdmin(true);
        } else {
          setSessionUser(null);
          setIsAdmin(false);
          setAuthError(
            "Access Denied: Your account is not registered as an authorized administrator. Please contact the administrator.",
          );
          await supabase.auth.signOut();
        }
      } else {
        setSessionUser(null);
        setIsAdmin(false);
      }
    } catch (err: unknown) {
      console.error("Auth check error:", err);
      setAuthError("Failed to verify authentication session.");
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    verifySession();

    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setSessionUser(null);
        setIsAdmin(false);
      } else if (event === "SIGNED_IN" && session.user) {
        const authorized = await checkIsAdmin(session.user.id);
        if (authorized) {
          setSessionUser({ id: session.user.id, email: session.user.email || "" });
          setIsAdmin(true);
          setAuthError(null);
        } else {
          setAuthError("This account is not authorized as an administrator.");
          await supabase.auth.signOut();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [verifySession]);

  // --- Load dashboard data ---
  const loadDashboardData = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingData(true);
    setDataError(null);
    try {
      const [fetchedEvents, fetchedMessages] = await Promise.all([
        getAllEventsAdmin(),
        getContactSubmissionsAdmin(),
      ]);
      setEvents(fetchedEvents);
      setMessages(fetchedMessages);
    } catch (err: unknown) {
      console.error("Error loading dashboard data:", err);
      setDataError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoadingData(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin, loadDashboardData]);

  // Handle Login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    if (!isSupabaseConfigured || !supabase) {
      setAuthError(
        "Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
      );
      setIsLoggingIn(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const authorized = await checkIsAdmin(data.user.id);
        if (!authorized) {
          await supabase.auth.signOut();
          throw new Error(
            "Access Denied: This account is authenticated in Supabase but lacks administrator permissions in public.admin_users.",
          );
        }

        setSessionUser({ id: data.user.id, email: data.user.email || "" });
        setIsAdmin(true);
      }
    } catch (err: unknown) {
      console.error("Login failed:", err);
      setAuthError(err instanceof Error ? err.message : "Invalid credentials or login failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSessionUser(null);
    setIsAdmin(false);
    setEvents([]);
    setMessages([]);
  };

  // Loading indicator for initial auth state
  if (authChecking) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Verifying administrator session...</p>
        </div>
      </div>
    );
  }

  // If not logged in or not authorized, show Admin Login Card
  if (!isAdmin || !sessionUser) {
    return (
      <div className="section-pad">
        <div className="container-yep max-w-md">
          <div className="surface-card p-8 shadow-lift">
            <div className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="size-7" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                Administrator Portal
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in with authorized administrator credentials.
              </p>
            </div>

            {!isSupabaseConfigured && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-foreground">
                <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                <p>
                  <strong>Supabase credentials missing:</strong> Please set <code className="bg-background px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{" "}
                  <code className="bg-background px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in your environment file.
                </p>
              </div>
            )}

            {authError && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
                <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@yepinitiative.org"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn || !isSupabaseConfigured}
                className="bg-gradient-brand mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In to Admin"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard Layout
  return (
    <div className="min-h-screen bg-background">
      {/* Top Admin Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container-yep flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Admin Dashboard</h2>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                YEP Initiative Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground sm:inline-block">
              {sessionUser.email}
            </span>
            <button
              onClick={handleLogout}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              title="Log out"
            >
              <LogOut className="size-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="container-yep py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === "events"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="size-4" />
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === "messages"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="size-4" />
            Contact Messages
            {messages.filter((m) => !m.is_read).length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                {messages.filter((m) => !m.is_read).length} new
              </span>
            )}
          </button>
        </div>

        {dataError && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
            <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
            <p>{dataError}</p>
          </div>
        )}

        {/* Tab Views */}
        <div className="mt-8">
          {activeTab === "overview" && (
            <AdminOverviewTab
              events={events}
              messages={messages}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "events" && (
            <AdminEventsTab
              events={events}
              loading={loadingData}
              onReload={loadDashboardData}
            />
          )}

          {activeTab === "messages" && (
            <AdminMessagesTab
              messages={messages}
              loading={loadingData}
              onReload={loadDashboardData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-TAB 1: OVERVIEW TAB
// =============================================================================

function AdminOverviewTab({
  events,
  messages,
  onNavigate,
}: {
  events: DatabaseEvent[];
  messages: ContactSubmission[];
  onNavigate: (tab: TabType) => void;
}) {
  const now = new Date();
  const publishedCount = events.filter((e) => e.is_published).length;
  const unpublishedCount = events.filter((e) => !e.is_published).length;
  const upcomingCount = events.filter((e) => {
    const cutoff = e.end_date ? new Date(e.end_date) : new Date(e.start_date);
    return cutoff >= now;
  }).length;
  const unreadMessagesCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Events
            </span>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Calendar className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-foreground">{events.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {publishedCount} published · {unpublishedCount} draft
          </p>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming Events
            </span>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-foreground">{upcomingCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Visible on the live Events page
          </p>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact Messages
            </span>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Mail className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-foreground">{messages.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Total inquiries received
          </p>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Unread Messages
            </span>
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <MessageSquare className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-foreground">{unreadMessagesCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Require review or reply
          </p>
        </div>
      </div>

      {/* Quick Actions & Recent Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Events Card */}
        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Recent Events</h3>
            <button
              onClick={() => onNavigate("events")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-border">
            {events.slice(0, 4).map((e) => (
              <div key={e.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.start_date).toLocaleDateString()} · {e.venue}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    e.is_published
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {e.is_published ? "Published" : "Draft"}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No events created yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Messages Card */}
        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Recent Inquiries</h3>
            <button
              onClick={() => onNavigate("messages")}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-border">
            {messages.slice(0, 4).map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    {!m.is_read && (
                      <span className="size-2 rounded-full bg-primary" title="Unread" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{m.subject}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No messages received yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-TAB 2: EVENT MANAGEMENT
// =============================================================================

function AdminEventsTab({
  events,
  loading,
  onReload,
}: {
  events: DatabaseEvent[];
  loading: boolean;
  onReload: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Modal states
  const [editingEvent, setEditingEvent] = useState<DatabaseEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<DatabaseEvent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "published"
          ? e.is_published
          : !e.is_published;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this event?")) return;
    setDeletingId(id);
    try {
      await deleteEvent(id);
      await onReload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete event.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (event: DatabaseEvent) => {
    try {
      await updateEvent(event.id, { is_published: !event.is_published });
      await onReload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update event status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border border-input bg-card pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
            className="rounded-full border border-input bg-card px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          Create Event
        </button>
      </div>

      {/* Events Listing */}
      {loading ? (
        <div className="surface-card p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span>Loading events...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          No events found. Click "Create Event" to schedule your first event.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredEvents.map((e) => {
            const isUpcoming = new Date(e.end_date || e.start_date) >= new Date();
            return (
              <div
                key={e.id}
                className="surface-card flex flex-col justify-between p-6 transition-all"
              >
                <div>
                  {e.cover_image && (
                    <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-muted">
                      <img
                        src={e.cover_image}
                        alt={e.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        e.is_published
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {e.is_published ? "Published" : "Draft (Unpublished)"}
                    </span>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                      {isUpcoming ? "Upcoming" : "Past"}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-foreground">{e.title}</h3>

                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3.5 text-primary" />
                    <span>{new Date(e.start_date).toLocaleString()}</span>
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" />
                    <span>{e.venue}</span>
                  </p>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {e.short_description || e.full_description}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewEvent(e)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                      title="Preview live card"
                    >
                      <Eye className="size-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => handleTogglePublish(e)}
                      className="text-xs font-semibold text-primary hover:underline ml-2"
                    >
                      {e.is_published ? "Unpublish" : "Publish"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingEvent(e)}
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      title="Edit event"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={deletingId === e.id}
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
                      title="Delete event"
                    >
                      {deletingId === e.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {(isCreating || editingEvent) && (
        <EventFormModal
          event={editingEvent}
          onClose={() => {
            setIsCreating(false);
            setEditingEvent(null);
          }}
          onSaved={async () => {
            setIsCreating(false);
            setEditingEvent(null);
            await onReload();
          }}
        />
      )}

      {/* Preview Live Card Modal */}
      {previewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="surface-card max-w-lg w-full p-6 shadow-lift max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground">Live Event Card Preview</h3>
              <button
                onClick={() => setPreviewEvent(null)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6">
              <div className="surface-card p-6">
                {previewEvent.cover_image && (
                  <div className="relative mb-5 aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-muted">
                    <img
                      src={previewEvent.cover_image}
                      alt={previewEvent.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-xl font-bold">{previewEvent.title}</h3>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4 text-primary" />{" "}
                  {new Date(previewEvent.start_date).toLocaleDateString()} ·{" "}
                  {new Date(previewEvent.start_date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4 text-primary" /> {previewEvent.venue}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {previewEvent.short_description || previewEvent.full_description}
                </p>
                {previewEvent.registration_link && (
                  <div className="mt-6">
                    <span className="bg-gradient-brand inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                      Register
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPreviewEvent(null)}
                className="rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold hover:border-primary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: EVENT CREATE / EDIT MODAL
// =============================================================================

function EventFormModal({
  event,
  onClose,
  onSaved,
}: {
  event: DatabaseEvent | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(event?.title || "");
  const [shortDesc, setShortDesc] = useState(event?.short_description || "");
  const [fullDesc, setFullDesc] = useState(event?.full_description || "");
  const [venue, setVenue] = useState(event?.venue || "");
  const [startDate, setStartDate] = useState(
    event?.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : "",
  );
  const [endDate, setEndDate] = useState(
    event?.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : "",
  );
  const [registrationLink, setRegistrationLink] = useState(event?.registration_link || "");
  const [isPublished, setIsPublished] = useState(event?.is_published || false);
  const [coverImageUrl, setCoverImageUrl] = useState(event?.cover_image || "");

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Handle Cover Image Upload
  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadProgress(0);

    try {
      const url = await uploadEventCoverImage(file, (p) => setUploadProgress(p));
      setCoverImageUrl(url);
    } catch (err: unknown) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Event title is required.");
      return;
    }
    if (!venue.trim()) {
      setFormError("Venue or location is required.");
      return;
    }
    if (!startDate) {
      setFormError("Start date and time is required.");
      return;
    }
    if (!fullDesc.trim()) {
      setFormError("Full description is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        short_description: shortDesc.trim() || null,
        full_description: fullDesc.trim(),
        venue: venue.trim(),
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        registration_link: registrationLink.trim() || null,
        is_published: isPublished,
        cover_image: coverImageUrl.trim() || null,
      };

      if (event?.id) {
        await updateEvent(event.id, payload);
      } else {
        await createEvent(payload);
      }

      await onSaved();
    } catch (err: unknown) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="surface-card max-w-2xl w-full p-7 shadow-lift max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-bold text-foreground">
            {event ? "Edit Event" : "Create New Event"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {formError && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
            <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
            <p>{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cover Image (Supabase Storage)
            </label>

            {coverImageUrl ? (
              <div className="mt-2 relative aspect-video w-full max-w-md overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={coverImageUrl}
                  alt="Cover Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl("")}
                  className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-sm hover:bg-background"
                  title="Remove image"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-input p-6 text-center hover:border-primary transition-colors">
                <ImageIcon className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">Upload Cover Image</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: JPEG, PNG, WEBP, GIF (Max 5MB)
                </p>
                <label className="bg-gradient-brand mt-4 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft">
                  <Upload className="size-3.5 inline mr-1.5" /> Choose File
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              </div>
            )}

            {uploadProgress !== null && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {uploadProgress}%
                </span>
              </div>
            )}

            {uploadError && (
              <p className="mt-2 text-xs font-medium text-destructive">{uploadError}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Event Title *
            </label>
            <input
              required
              maxLength={150}
              placeholder="e.g. Master's Scholarship Bootcamp 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Dates & Times */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                End Date & Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Venue / Location *
            </label>
            <input
              required
              maxLength={150}
              placeholder="e.g. Online (Zoom & Telegram) or Addis Ababa"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Registration URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Registration URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://forms.gle/... or https://t.me/..."
              value={registrationLink}
              onChange={(e) => setRegistrationLink(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Short Description (Card Summary)
            </label>
            <input
              maxLength={200}
              placeholder="Brief summary for event previews (optional)"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Full Description *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Detailed agenda, speakers, requirements, and takeaways..."
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Publication Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="size-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="is_published" className="text-sm font-semibold cursor-pointer">
              Publish event immediately (visible on public Events page)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-brand inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving...
                </>
              ) : event ? (
                "Update Event"
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-TAB 3: CONTACT MESSAGES
// =============================================================================

function AdminMessagesTab({
  messages,
  loading,
  onReload,
}: {
  messages: ContactSubmission[];
  loading: boolean;
  onReload: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredMessages = messages.filter((m) => {
    const matchesFilter =
      filter === "all" ? true : filter === "unread" ? !m.is_read : m.is_read;
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleToggleRead = async (message: ContactSubmission) => {
    try {
      await markContactSubmissionRead(message.id, !message.is_read);
      if (selectedMessage?.id === message.id) {
        setSelectedMessage({ ...selectedMessage, is_read: !message.is_read });
      }
      await onReload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update read status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this contact message?"))
      return;
    setDeletingId(id);
    try {
      await deleteContactSubmission(id);
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      await onReload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete submission.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border border-input bg-card pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-64"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "unread" | "read")}
            className="rounded-full border border-input bg-card px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>

        <span className="text-xs text-muted-foreground">
          Showing {filteredMessages.length} of {messages.length} messages
        </span>
      </div>

      {/* Messages List & Detail Layout */}
      {loading ? (
        <div className="surface-card p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span>Loading contact messages...</span>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          No contact messages match your criteria.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          {/* List Column */}
          <div className="space-y-3">
            {filteredMessages.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedMessage(m);
                  if (!m.is_read) {
                    handleToggleRead(m);
                  }
                }}
                className={`surface-card p-5 cursor-pointer transition-all border ${
                  selectedMessage?.id === m.id
                    ? "border-primary bg-primary/5"
                    : m.is_read
                      ? "border-border opacity-85"
                      : "border-primary/40 bg-card font-semibold"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!m.is_read && (
                      <span className="size-2 rounded-full bg-primary" title="Unread" />
                    )}
                    <span className="text-sm font-bold text-foreground">{m.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-foreground truncate">{m.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.message}</p>
              </div>
            ))}
          </div>

          {/* Details Column */}
          <div>
            {selectedMessage ? (
              <div className="surface-card p-7 sticky top-24">
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {selectedMessage.subject}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      From: <span className="font-semibold text-foreground">{selectedMessage.name}</span> · Received {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRead(selectedMessage)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary transition-colors"
                      title={selectedMessage.is_read ? "Mark as unread" : "Mark as read"}
                    >
                      {selectedMessage.is_read ? "Mark Unread" : "Mark Read"}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      disabled={deletingId === selectedMessage.id}
                      className="rounded-full border border-border bg-card p-1.5 text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
                      title="Delete message"
                    >
                      {deletingId === selectedMessage.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Message
                  </h4>
                  <div className="mt-3 whitespace-pre-wrap rounded-xl border border-input bg-background/60 p-5 text-sm leading-relaxed text-foreground">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="surface-card p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
                <Mail className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold">Select a message to view full details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

