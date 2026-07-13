import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { MediaItem, ConversionJob, OutputAsset, VaultProject, VaultCategory, MiniManifest } from './types';
import { appStorage } from './storage/appStorageV2';
import { podCustodian, PodCustodian } from './minis/PodCustodian';
import { MOCK_MEDIA_ITEMS, MOCK_JOBS, MOCK_PROJECTS, MOCK_OUTPUTS } from './mockData';

interface VaultState {
  projects: VaultProject[];
  media: MediaItem[];
  jobs: ConversionJob[];
  outputs: OutputAsset[];
  categories: VaultCategory[];
  minis: MiniManifest[]; // Wave 2: Mini apps (max 12 active)
  mass: number; // Sovereign Engine resource
  lastModified: number;
}

interface VaultContextType {
  state: VaultState;
  updateMedia: (media: MediaItem[]) => Promise<void>;
  addMedia: (item: MediaItem) => Promise<void>;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  updateJobs: (jobs: ConversionJob[]) => Promise<void>;
  addJob: (job: ConversionJob) => Promise<void>;
  updateJob: (id: string, updates: Partial<ConversionJob>) => Promise<void>;
  updateCategories: (categories: VaultCategory[]) => Promise<void>;
  addCategory: (category: VaultCategory) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Wave 2: Mini management
  addMini: (mini: MiniManifest) => Promise<void>;
  toggleMiniActive: (miniId: string) => Promise<void>;
  removeMini: (miniId: string) => Promise<void>;
  burnMass: (amount: number) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const USERID = 'vault-user'; // In production: from auth system

export function VaultProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VaultState>({
    projects: MOCK_PROJECTS,
    media: MOCK_MEDIA_ITEMS,
    jobs: MOCK_JOBS,
    outputs: MOCK_OUTPUTS,
    categories: [],
    minis: [PodCustodian.MINI_MANIFEST], // System mini always active
    mass: 100, // Starting mass for Sovereign Engine
    lastModified: Date.now(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load vault state on mount
  useEffect(() => {
    const initVault = async () => {
      try {
        setIsLoading(true);

        // Load from Pod Custodian (appStorageV2 backed)
        const savedState = await appStorage.get<VaultState>('vault', 'state');

        if (savedState) {
          setState(savedState);
        } else {
          // Initialize with mocks + Pod Custodian system mini
          const initialState: VaultState = {
            projects: MOCK_PROJECTS,
            media: MOCK_MEDIA_ITEMS,
            jobs: MOCK_JOBS,
            outputs: MOCK_OUTPUTS,
            categories: [],
            minis: [PodCustodian.MINI_MANIFEST],
            mass: 100,
            lastModified: Date.now(),
          };
          setState(initialState);
          await saveState(initialState);
        }

        // Verify Pod Custodian health
        const healthy = await podCustodian.healthCheck();
        if (!healthy) {
          setError('Pod Custodian health check failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vault');
        console.error('Failed to initialize vault:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initVault();
  }, []);

  // Save to transactional storage
  const saveState = async (newState: VaultState) => {
    try {
      await appStorage.set('vault', 'state', newState);
      setState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vault');
      console.error('Failed to save vault:', err);
    }
  };

  const updateMedia = async (media: MediaItem[]) => {
    await saveState({ ...state, media, lastModified: Date.now() });
  };

  const addMedia = async (item: MediaItem) => {
    await saveState({ ...state, media: [...state.media, item], lastModified: Date.now() });
  };

  const updateMediaItem = async (id: string, updates: Partial<MediaItem>) => {
    const updated = state.media.map(m =>
      m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
    );
    await saveState({ ...state, media: updated, lastModified: Date.now() });
  };

  const deleteMedia = async (id: string) => {
    await saveState({ ...state, media: state.media.filter(m => m.id !== id), lastModified: Date.now() });
  };

  const updateJobs = async (jobs: ConversionJob[]) => {
    await saveState({ ...state, jobs, lastModified: Date.now() });
  };

  const addJob = async (job: ConversionJob) => {
    await saveState({ ...state, jobs: [...state.jobs, job], lastModified: Date.now() });
  };

  const updateJob = async (id: string, updates: Partial<ConversionJob>) => {
    const updated = state.jobs.map(j => (j.id === id ? { ...j, ...updates } : j));
    await saveState({ ...state, jobs: updated, lastModified: Date.now() });
  };

  const updateCategories = async (categories: VaultCategory[]) => {
    await saveState({ ...state, categories, lastModified: Date.now() });
  };

  const addCategory = async (category: VaultCategory) => {
    await saveState({ ...state, categories: [...state.categories, category], lastModified: Date.now() });
  };

  const deleteCategory = async (id: string) => {
    const media = state.media.map(m => (m.categoryId === id ? { ...m, categoryId: undefined } : m));
    const categories = state.categories.filter(c => c.id !== id);
    await saveState({ ...state, media, categories, lastModified: Date.now() });
  };

  // Wave 2: Mini management
  const addMini = async (mini: MiniManifest) => {
    // Check 12-mini cap for active minis
    const activeMinis = state.minis.filter(m => m.active);
    if (mini.active && activeMinis.length >= 12) {
      throw new Error('Cannot activate more than 12 minis (dock is full)');
    }

    // Check mass cost
    if (state.mass < mini.mass_cost) {
      throw new Error(`Insufficient mass. Need ${mini.mass_cost}, have ${state.mass}`);
    }

    const minis = [...state.minis, mini];
    const mass = state.mass - mini.mass_cost;

    await saveState({ ...state, minis, mass, lastModified: Date.now() });
  };

  const toggleMiniActive = async (miniId: string) => {
    const mini = state.minis.find(m => m.id === miniId);
    if (!mini) throw new Error('Mini not found');

    // Check cap when activating
    if (!mini.active) {
      const activeMinis = state.minis.filter(m => m.active && m.id !== miniId);
      if (activeMinis.length >= 12) {
        throw new Error('Cannot activate: dock is full (12 minis max)');
      }
    }

    const minis = state.minis.map(m =>
      m.id === miniId ? { ...m, active: !m.active, updated_at: new Date().toISOString() } : m
    );

    await saveState({ ...state, minis, lastModified: Date.now() });
  };

  const removeMini = async (miniId: string) => {
    if (miniId === 'pod-custodian') {
      throw new Error('Cannot remove system mini (Pod Custodian)');
    }

    const mini = state.minis.find(m => m.id === miniId);
    const minis = state.minis.filter(m => m.id !== miniId);

    // Refund mass on removal
    const mass = mini ? state.mass + mini.mass_cost : state.mass;

    await saveState({ ...state, minis, mass, lastModified: Date.now() });
  };

  const burnMass = async (amount: number): Promise<boolean> => {
    if (state.mass >= amount) {
      const mass = state.mass - amount;
      await saveState({ ...state, mass, lastModified: Date.now() });
      return true;
    }
    return false;
  };

  return (
    <VaultContext.Provider
      value={{
        state,
        updateMedia,
        addMedia,
        updateMediaItem,
        deleteMedia,
        updateJobs,
        addJob,
        updateJob,
        updateCategories,
        addCategory,
        deleteCategory,
        addMini,
        toggleMiniActive,
        removeMini,
        burnMass,
        isLoading,
        error,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return context;
}
