import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';

export type GrcRole = 'super_admin' | 'ciso' | 'risk_manager' | 'auditor' | 'asset_owner' | 'risk_owner' | 'department_head' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: GrcRole;
  status: 'active' | 'locked' | 'pending';
  departmentId?: string | null;
  isUnregistered?: boolean;
}

export interface PreviewRoleInfo {
  role: GrcRole;
  label: string;
  badge: string;
  description: string;
  personaName: string;
  personaEmail: string;
  personaId: string;
  departmentId?: string;
  departmentName?: string;
}

export const PREVIEW_ROLES: Record<Exclude<GrcRole, 'super_admin'>, PreviewRoleInfo> = {
  viewer: {
    role: 'viewer',
    label: 'Viewer',
    badge: 'Read-Only',
    description: 'Read-only GRC Dashboard access',
    personaName: 'Rachel Green',
    personaEmail: 'rachel.green@enterprise.io',
    personaId: 'usr-vw-07',
    departmentId: '8d61c22e-9126-4c40-b47b-a4b1b666b585',
    departmentName: 'Enterprise HQ',
  },
  ciso: {
    role: 'ciso',
    label: 'CISO',
    badge: 'Executive',
    description: 'Complete Policy, Risk Accept, and Log audits',
    personaName: 'Sarah Chen',
    personaEmail: 'sarah.chen@enterprise.io',
    personaId: 'usr-ciso-01',
    departmentId: 'org-sec-02',
    departmentName: 'InfoSec & Compliance',
  },
  risk_manager: {
    role: 'risk_manager',
    label: 'Risk Manager',
    badge: 'Assessment',
    description: 'Assess risks, controls, and treatments',
    personaName: 'Marcus Vance',
    personaEmail: 'marcus.vance@enterprise.io',
    personaId: 'usr-rm-02',
    departmentId: 'org-sec-02',
    departmentName: 'InfoSec & Compliance',
  },
  auditor: {
    role: 'auditor',
    label: 'Auditor',
    badge: 'Independent',
    description: 'Independent log auditing and read-only reviews',
    personaName: 'Elena Rostova',
    personaEmail: 'elena.rostova@auditpartners.com',
    personaId: 'usr-aud-03',
    departmentId: 'org-sec-02',
    departmentName: 'External Audit',
  },
  asset_owner: {
    role: 'asset_owner',
    label: 'Asset Owner',
    badge: 'Systems',
    description: 'Owns information systems inventory',
    personaName: 'David Kim',
    personaEmail: 'david.kim@enterprise.io',
    personaId: 'usr-ao-04',
    departmentId: 'org-it-01',
    departmentName: 'Information Technology',
  },
  risk_owner: {
    role: 'risk_owner',
    label: 'Risk Owner',
    badge: 'Remediation',
    description: 'Mitigates and treats assigned risk items',
    personaName: 'Alicia Mendez',
    personaEmail: 'alicia.mendez@enterprise.io',
    personaId: 'usr-ro-05',
    departmentId: 'org-eng-04',
    departmentName: 'Platform Engineering',
  },
  department_head: {
    role: 'department_head',
    label: 'Department Head',
    badge: 'Scoped View',
    description: 'View department scope only',
    personaName: 'Robert Sterling',
    personaEmail: 'robert.sterling@enterprise.io',
    personaId: 'usr-dh-06',
    departmentId: 'org-fin-03',
    departmentName: 'Finance & Accounting',
  },
};

interface AuthState {
  user: UserProfile | null;
  realUser: UserProfile | null;
  previewRole: GrcRole | null;
  previewInfo: PreviewRoleInfo | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  needsSetup: boolean;
  isConfiguringPassword?: boolean;
  setupEmail?: string;
  setAuth: (user: UserProfile | null, token: string | null) => void;
  setPreviewRole: (role: GrcRole | null) => void;
  exitPreview: () => void;
  setNeedsSetup: (needsSetup: boolean) => void;
  setTransientSetupState?: (isConfiguring: boolean, email: string) => void;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  realUser: null,
  previewRole: null,
  previewInfo: null,
  token: null,
  loading: true,
  initialized: false,
  needsSetup: false,
  isConfiguringPassword: false,
  setupEmail: '',
  setAuth: (user, token) => {
    if (!user) {
      try {
        sessionStorage.removeItem('grc_preview_role');
      } catch {}
      set({ user: null, realUser: null, previewRole: null, previewInfo: null, token: null, loading: false });
    } else {
      set({ user, token, loading: false });
    }
  },
  setPreviewRole: (role: GrcRole | null) => {
    if (!role || role === 'super_admin') {
      get().exitPreview();
      return;
    }
    const currentRealUser = get().realUser || get().user;
    const persona = PREVIEW_ROLES[role as keyof typeof PREVIEW_ROLES];
    if (!persona) return;

    try {
      sessionStorage.setItem('grc_preview_role', role);
    } catch (e) {
      console.warn('Could not save preview role to storage:', e);
    }

    set({
      realUser: currentRealUser,
      previewRole: role,
      previewInfo: persona,
      user: {
        id: persona.personaId,
        email: persona.personaEmail,
        name: persona.personaName,
        role: persona.role,
        status: 'active',
        departmentId: persona.departmentId,
      }
    });
  },
  exitPreview: () => {
    try {
      sessionStorage.removeItem('grc_preview_role');
    } catch (e) {
      console.warn('Could not clear preview role from storage:', e);
    }
    const realUser = get().realUser;
    if (realUser) {
      set({
        user: realUser,
        realUser: null,
        previewRole: null,
        previewInfo: null,
      });
    } else {
      set({
        previewRole: null,
        previewInfo: null,
      });
    }
  },
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
            let profile: UserProfile | null = null;
            try {
              profile = await res.json();
            } catch (jsonErr) {
              console.error('Failed parsing /api/auth/me response JSON:', jsonErr);
            }

            if (profile && profile.id) {
              let activeUser = profile;
              let activePreviewRole: GrcRole | null = null;
              let activePreviewInfo: PreviewRoleInfo | null = null;
              let savedRealUser: UserProfile | null = null;

              try {
                const savedPreview = sessionStorage.getItem('grc_preview_role') as GrcRole | null;
                if (savedPreview && savedPreview in PREVIEW_ROLES && profile.role === 'super_admin') {
                  const persona = PREVIEW_ROLES[savedPreview as keyof typeof PREVIEW_ROLES];
                  if (persona) {
                    activePreviewRole = savedPreview;
                    activePreviewInfo = persona;
                    savedRealUser = profile;
                    activeUser = {
                      id: persona.personaId,
                      email: persona.personaEmail,
                      name: persona.personaName,
                      role: persona.role,
                      status: 'active',
                      departmentId: persona.departmentId,
                    };
                  }
                }
              } catch (e) {
                console.warn('Error reading preview role from storage:', e);
              }

              set({ 
                user: activeUser, 
                realUser: savedRealUser,
                previewRole: activePreviewRole,
                previewInfo: activePreviewInfo,
                token, 
                needsSetup: false, 
                loading: false, 
                initialized: true 
              });
            } else {
              set({ user: null, token: null, loading: false, initialized: true });
            }
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
                realUser: null,
                previewRole: null,
                previewInfo: null,
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
                realUser: null,
                previewRole: null,
                previewInfo: null,
                token,
                needsSetup: false,
                loading: false,
                initialized: true
              });
            }
          } else {
            set({ user: null, realUser: null, previewRole: null, previewInfo: null, token: null, loading: false, initialized: true });
          }
        } catch (error) {
          console.error('Error syncing authentication session:', error);
          set({ user: null, realUser: null, previewRole: null, previewInfo: null, token: null, loading: false, initialized: true });
        }
      } else {
        set({ user: null, realUser: null, previewRole: null, previewInfo: null, token: null, loading: false, initialized: true });
      }
    });

    set({ initialized: true });
    return unsubscribe;
  }
}));
