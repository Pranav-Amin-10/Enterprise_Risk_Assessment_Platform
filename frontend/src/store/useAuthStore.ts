import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'ciso' | 'risk_manager' | 'auditor' | 'asset_owner' | 'risk_owner' | 'department_head' | 'viewer';
  status: 'active' | 'locked' | 'pending';
  isUnregistered?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  needsSetup: boolean;
  isConfiguringPassword?: boolean;
  setupEmail?: string;
  setAuth: (user: UserProfile | null, token: string | null) => void;
  setNeedsSetup: (needsSetup: boolean) => void;
  setTransientSetupState?: (isConfiguring: boolean, email: string) => void;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,
  initialized: false,
  needsSetup: false,
  isConfiguringPassword: false,
  setupEmail: '',
  setAuth: (user, token) => set({ user, token, loading: false }),
  setNeedsSetup: (needsSetup) => set({ needsSetup }),
  setTransientSetupState: (isConfiguring, email) => {
    if (isConfiguring) {
      set({ 
        isConfiguringPassword: true, 
        setupEmail: email,
        user: {
          id: 'temp-setup-id',
          email: email,
          name: 'Setup Administrator',
          role: 'super_admin',
          status: 'active'
        }
      });
    } else {
      set({ isConfiguringPassword: false, setupEmail: '', user: null });
    }
  },
  initialize: () => {
    if (get().initialized) return () => {};

    // Check if platform database needs setup first
    fetch('/api/setup/check')
      .then(async (res) => {
        if (!res.ok) return { needsSetup: false };
        const data = await res.json();
        return data;
      })
      .then(data => {
        if (data && data.needsSetup) {
          set({ needsSetup: true, loading: false });
        }
      })
      .catch(err => console.warn('Setup check skipped:', err));

    // Subscribe to Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      set({ loading: true });

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true);
          
          // Query Hono backend to fetch resolved user role and D1 database profile
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (res.ok) {
            const profile = await res.json();
            set({ user: profile, token, needsSetup: false, loading: false, initialized: true });
          } else if (res.status === 401) {
            // User authenticated in Firebase, but profile not in D1.
            let needsBootstrap = false;
            try {
              const setupRes = await fetch('/api/setup/check');
              if (setupRes.ok) {
                const setupData = await setupRes.json();
                needsBootstrap = !!setupData.needsSetup;
              }
            } catch (e) {
              console.warn('Setup check error:', e);
            }
            
            if (needsBootstrap) {
              set({
                user: {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  name: firebaseUser.displayName || 'Setup Administrator',
                  role: 'super_admin',
                  status: 'active',
                  isUnregistered: true
                },
                token,
                needsSetup: true,
                loading: false,
                initialized: true
              });
            } else {
              set({
                user: {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Unregistered User',
                  role: 'viewer',
                  status: 'pending',
                  isUnregistered: true
                },
                token,
                needsSetup: false,
                loading: false,
                initialized: true
              });
            }
          } else {
            set({ user: null, token: null, loading: false, initialized: true });
          }
        } catch (error) {
          console.error('Error syncing authentication session:', error);
          set({ user: null, token: null, loading: false, initialized: true });
        }
      } else {
        set({ user: null, token: null, loading: false, initialized: true });
      }
    });

    set({ initialized: true });
    return unsubscribe;
  }
}));