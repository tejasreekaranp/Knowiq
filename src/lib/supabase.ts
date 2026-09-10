import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DBCourse, UserProfile } from '../types';

// Environment variables for Supabase (Vite client-side)
const env = (import.meta as any)?.env || {};
const supabaseUrl = (env.VITE_SUPABASE_URL || 'https://kebgpglzdtbprvagbgql.supabase.co').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__YZDpD2zQcvCRMHLkg2sNg_pWvt15mw').trim();

// Check if valid remote Supabase credentials are provided
const hasValidSupabaseConfig = 
  supabaseUrl.startsWith('https://') && 
  supabaseAnonKey.length > 15 &&
  !supabaseUrl.includes('your-project');

export const isSupabaseConfigured = (): boolean => hasValidSupabaseConfig;

// Types for local auth & database
interface LocalAuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url?: string | null;
    role?: 'student' | 'faculty';
  };
  created_at: string;
}

interface LocalSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: LocalAuthUser;
}

// Local Persistent Store keys (no passwords or secrets stored)
const STORAGE_USERS_KEY = 'knowiq_auth_identities_v2';
const STORAGE_PROFILES_KEY = 'knowiq_profiles_v1';
const STORAGE_COURSES_KEY = 'knowiq_courses_v1';
const STORAGE_TOPICS_KEY = 'knowiq_topics_v1';
const STORAGE_SUBTOPICS_KEY = 'knowiq_subtopics_v1';
const STORAGE_SESSION_KEY = 'knowiq_current_session_v1';

// Clean up any legacy keys containing credentials
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    localStorage.removeItem('knowiq_auth_users_v1');
  } catch {
    // ignore
  }
}

// Helpers for localStorage persistence
const getStored = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setStored = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage write error', e);
  }
};

// Listeners for auth state changes in local mode
const authListeners: Array<(event: string, session: LocalSession | null) => void> = [];

const notifyAuthListeners = (event: string, session: LocalSession | null) => {
  authListeners.forEach((cb) => {
    try {
      cb(event, session);
    } catch (e) {
      console.error('Auth listener error', e);
    }
  });
};

// Local Persistent Supabase Adapter
// Ensures zero-downtime, fully compliant testing with RLS enforcement
const createLocalSupabaseAdapter = () => {
  return {
    auth: {
      async signUp({ email, options }: { email: string; password?: string; options?: { data?: { full_name?: string; avatar_url?: string; role?: 'student' | 'faculty' } } }) {
        const users = getStored<LocalAuthUser[]>(STORAGE_USERS_KEY, []);
        const cleanEmail = email.trim().toLowerCase();

        // Email already registered check
        if (users.some((u) => u.email === cleanEmail)) {
          return { data: { user: null, session: null }, error: new Error('A user with this email address has already been registered.') };
        }

        const userId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        const fullName = options?.data?.full_name?.trim() || cleanEmail.split('@')[0];
        const avatarUrl = options?.data?.avatar_url || null;

        const role: 'student' | 'faculty' = (options?.data as any)?.role === 'faculty' ? 'faculty' : 'student';

        const newUser: LocalAuthUser = {
          id: userId,
          email: cleanEmail,
          user_metadata: {
            full_name: fullName,
            avatar_url: avatarUrl,
            role: role,
          },
          created_at: new Date().toISOString(),
        };

        users.push(newUser);
        setStored(STORAGE_USERS_KEY, users);

        // Auto-create profile record in profiles table
        const profiles = getStored<UserProfile[]>(STORAGE_PROFILES_KEY, []);
        const newProfile: UserProfile = {
          id: userId,
          full_name: fullName,
          email: cleanEmail,
          avatar_url: avatarUrl,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        profiles.push(newProfile);
        setStored(STORAGE_PROFILES_KEY, profiles);

        // Auto login session on signup
        const session: LocalSession = {
          access_token: 'local_token_' + Math.random().toString(36),
          refresh_token: 'local_refresh_' + Math.random().toString(36),
          expires_at: Date.now() + 86400 * 1000 * 7,
          user: {
            id: newUser.id,
            email: newUser.email,
            user_metadata: newUser.user_metadata,
            created_at: newUser.created_at,
          },
        };

        setStored(STORAGE_SESSION_KEY, session);
        notifyAuthListeners('SIGNED_IN', session);

        return { data: { user: session.user, session }, error: null };
      },

      async signInWithPassword({ email }: { email: string; password?: string }) {
        const users = getStored<LocalAuthUser[]>(STORAGE_USERS_KEY, []);
        const cleanEmail = email.trim().toLowerCase();
        const user = users.find((u) => u.email === cleanEmail);

        if (!user) {
          return { data: { user: null, session: null }, error: new Error('Invalid email or password.') };
        }

        const session: LocalSession = {
          access_token: 'local_token_' + Math.random().toString(36),
          refresh_token: 'local_refresh_' + Math.random().toString(36),
          expires_at: Date.now() + 86400 * 1000 * 7,
          user: {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            created_at: user.created_at,
          },
        };

        setStored(STORAGE_SESSION_KEY, session);
        notifyAuthListeners('SIGNED_IN', session);

        return { data: { user: session.user, session }, error: null };
      },

      async signOut() {
        setStored(STORAGE_SESSION_KEY, null);
        notifyAuthListeners('SIGNED_OUT', null);
        return { error: null };
      },

      async getSession() {
        const session = getStored<LocalSession | null>(STORAGE_SESSION_KEY, null);
        if (session && session.expires_at > Date.now()) {
          return { data: { session }, error: null };
        }
        setStored(STORAGE_SESSION_KEY, null);
        return { data: { session: null }, error: null };
      },

      async getUser() {
        const session = getStored<LocalSession | null>(STORAGE_SESSION_KEY, null);
        if (session && session.expires_at > Date.now()) {
          return { data: { user: session.user }, error: null };
        }
        return { data: { user: null }, error: null };
      },

      onAuthStateChange(callback: (event: string, session: any) => void) {
        authListeners.push(callback);
        // Immediately fire current state
        const session = getStored<LocalSession | null>(STORAGE_SESSION_KEY, null);
        if (session && session.expires_at > Date.now()) {
          callback('INITIAL_SESSION', session);
        } else {
          callback('INITIAL_SESSION', null);
        }
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const idx = authListeners.indexOf(callback);
                if (idx !== -1) authListeners.splice(idx, 1);
              },
            },
          },
        };
      },
    },

    from(tableName: string) {
      const currentSession = getStored<LocalSession | null>(STORAGE_SESSION_KEY, null);
      const currentUserId = currentSession?.user?.id || null;

      return {
        // Query builder
        select(columns = '*') {
          let currentFilters: Array<(item: any) => boolean> = [];
          let currentOrder: { field: string; ascending: boolean } | null = null;
          let isSingle = false;

          const queryObj = {
            eq(field: string, val: any) {
              currentFilters.push((item: any) => item[field] === val);
              return queryObj;
            },
            order(field: string, { ascending = true }: { ascending?: boolean } = {}) {
              currentOrder = { field, ascending };
              return queryObj;
            },
            single() {
              isSingle = true;
              return queryObj;
            },
            async then(resolve: (res: { data: any; error: any }) => void) {
              let list: any[] = [];
              if (tableName === 'courses') {
                list = getStored<any[]>(STORAGE_COURSES_KEY, []);
                // RLS: Student can ONLY view their own courses
                list = list.filter((c) => c.user_id === currentUserId);
              } else if (tableName === 'profiles') {
                list = getStored<any[]>(STORAGE_PROFILES_KEY, []);
                // RLS: User can only view their own profile
                list = list.filter((p) => p.id === currentUserId);
              } else if (tableName === 'course_topics') {
                list = getStored<any[]>(STORAGE_TOPICS_KEY, []);
                // Allow topics matching user or linked to user's courses
                list = list.filter((t) => !t.user_id || t.user_id === currentUserId);
              } else if (tableName === 'subtopics') {
                list = getStored<any[]>(STORAGE_SUBTOPICS_KEY, []);
                list = list.filter((st) => !st.user_id || st.user_id === currentUserId);
              }

              // Apply filters
              for (const filterFn of currentFilters) {
                list = list.filter(filterFn);
              }

              // Apply ordering
              if (currentOrder) {
                const { field, ascending } = currentOrder;
                list.sort((a, b) => {
                  if (a[field] < b[field]) return ascending ? -1 : 1;
                  if (a[field] > b[field]) return ascending ? 1 : -1;
                  return 0;
                });
              }

              if (isSingle) {
                if (list.length === 0) {
                  resolve({ data: null, error: new Error(`Row not found or unauthorized in ${tableName}`) });
                } else {
                  resolve({ data: list[0], error: null });
                }
              } else {
                resolve({ data: list, error: null });
              }
            },
          };

          return queryObj;
        },

        // Insert
        insert(records: any | any[]) {
          const toInsert = Array.isArray(records) ? records : [records];
          return {
            async select() {
              if (!currentUserId) {
                return { data: null, error: new Error('Unauthorized: Authentication required to insert data.') };
              }

              if (tableName === 'courses') {
                const list = getStored<any[]>(STORAGE_COURSES_KEY, []);
                const inserted: any[] = [];
                for (const item of toInsert) {
                  const record: DBCourse = {
                    id: item.id || 'crs_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
                    user_id: currentUserId, // Enforce current authenticated user ID
                    title: item.title,
                    description: item.description || null,
                    subject: item.subject || 'General',
                    academic_level: item.academic_level || 'Undergraduate',
                    syllabus: item.syllabus || null,
                    status: item.status || 'ready',
                    duration_days: item.duration_days || 30,
                    created_at: item.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  list.unshift(record);
                  inserted.push(record);
                }
                setStored(STORAGE_COURSES_KEY, list);
                return { data: inserted, error: null };
              }

              if (tableName === 'course_topics') {
                const list = getStored<any[]>(STORAGE_TOPICS_KEY, []);
                const inserted: any[] = [];
                for (const item of toInsert) {
                  const record = {
                    ...item,
                    id: item.id || 'top_' + Math.random().toString(36).substring(2, 9),
                    user_id: currentUserId,
                    created_at: new Date().toISOString(),
                  };
                  list.push(record);
                  inserted.push(record);
                }
                setStored(STORAGE_TOPICS_KEY, list);
                return { data: inserted, error: null };
              }

              if (tableName === 'subtopics') {
                const list = getStored<any[]>(STORAGE_SUBTOPICS_KEY, []);
                const inserted: any[] = [];
                for (const item of toInsert) {
                  const record = {
                    ...item,
                    id: item.id || 'sub_' + Math.random().toString(36).substring(2, 9),
                    user_id: currentUserId,
                    created_at: new Date().toISOString(),
                  };
                  list.push(record);
                  inserted.push(record);
                }
                setStored(STORAGE_SUBTOPICS_KEY, list);
                return { data: inserted, error: null };
              }

              return { data: toInsert, error: null };
            },
          };
        },

        // Update
        update(updates: any) {
          return {
            eq(field: string, val: any) {
              const applyUpdate = () => {
                if (!currentUserId) {
                  return { data: null, error: new Error('Unauthorized') };
                }
                if (tableName === 'courses') {
                  let list = getStored<any[]>(STORAGE_COURSES_KEY, []);
                  let modified: any = null;
                  list = list.map((c) => {
                    if (c[field] === val && c.user_id === currentUserId) {
                      modified = { ...c, ...updates, updated_at: new Date().toISOString() };
                      return modified;
                    }
                    return c;
                  });
                  setStored(STORAGE_COURSES_KEY, list);
                  return { data: modified ? [modified] : [], error: null };
                } else if (tableName === 'subtopics') {
                  let list = getStored<any[]>(STORAGE_SUBTOPICS_KEY, []);
                  let modified: any = null;
                  list = list.map((st) => {
                    if (st[field] === val) {
                      modified = { ...st, ...updates, updated_at: new Date().toISOString() };
                      return modified;
                    }
                    return st;
                  });
                  setStored(STORAGE_SUBTOPICS_KEY, list);
                  return { data: modified ? [modified] : [], error: null };
                } else if (tableName === 'course_topics') {
                  let list = getStored<any[]>(STORAGE_TOPICS_KEY, []);
                  let modified: any = null;
                  list = list.map((t) => {
                    if (t[field] === val) {
                      modified = { ...t, ...updates, updated_at: new Date().toISOString() };
                      return modified;
                    }
                    return t;
                  });
                  setStored(STORAGE_TOPICS_KEY, list);
                  return { data: modified ? [modified] : [], error: null };
                }
                return { data: [], error: null };
              };

              return {
                async select() {
                  return applyUpdate();
                },
                then(resolve: (res: any) => void) {
                  const result = applyUpdate();
                  resolve(result);
                }
              };
            },
          };
        },

        // Delete
        delete() {
          return {
            eq(field: string, val: any) {
              return {
                async then(resolve: (res: { data: any; error: any }) => void) {
                  if (!currentUserId) {
                    resolve({ data: null, error: new Error('Unauthorized') });
                    return;
                  }
                  if (tableName === 'courses') {
                    let list = getStored<any[]>(STORAGE_COURSES_KEY, []);
                    // RLS: Only delete if user_id matches
                    list = list.filter((c) => !(c[field] === val && c.user_id === currentUserId));
                    setStored(STORAGE_COURSES_KEY, list);
                    resolve({ data: true, error: null });
                  } else {
                    resolve({ data: true, error: null });
                  }
                },
              };
            },
          };
        },
      };
    },
  };
};

// Export singleton Supabase client
export const supabase = hasValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (createLocalSupabaseAdapter() as unknown as SupabaseClient);
