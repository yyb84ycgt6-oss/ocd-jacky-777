import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { MediaItem, ConversionJob, OutputAsset, VaultProject, VaultCategory } from './types';
import { loadVaultState, saveVaultState } from './storage/vaultStorage';
import { MOCK_MEDIA_ITEMS, MOCK_JOBS, MOCK_PROJECTS, MOCK_OUTPUTS } from './mockData';

interface VaultState {
  projects: VaultProject[];
  media: MediaItem[];
  jobs: ConversionJob[];
  outputs: OutputAsset[];
  categories: VaultCategory[];
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
  isLoading: boolean;
  error: string | null;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VaultState>({
    projects: MOCK_PROJECTS,
    media: MOCK_MEDIA_ITEMS,
    jobs: MOCK_JOBS,
    outputs: MOCK_OUTPUTS,
    categories: [],
    lastModified: Date.now(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load vault state on mount
  useEffect(() => {
    const initVault = async () => {
      try {
        setIsLoading(true);
        // For now, use mock user ID - in production use from auth
        const userId = 'demo-user';
        const savedState = await loadVaultState(userId);

        if (savedState) {
          setState(savedState);
        } else {
          // Initialize with mocks if no saved state
          setState({
            projects: MOCK_PROJECTS,
            media: MOCK_MEDIA_ITEMS,
            jobs: MOCK_JOBS,
            outputs: MOCK_OUTPUTS,
            categories: [],
            lastModified: Date.now(),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vault');
        console.error('Failed to load vault:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initVault();
  }, []);

  // Save to storage whenever state changes
  const saveState = async (newState: VaultState) => {
    try {
      const userId = 'demo-user';
      await saveVaultState(newState, userId);
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
    const updated = state.media.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m);
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
    const updated = state.jobs.map(j => j.id === id ? { ...j, ...updates } : j);
    await saveState({ ...state, jobs: updated, lastModified: Date.now() });
  };

  const updateCategories = async (categories: VaultCategory[]) => {
    await saveState({ ...state, categories, lastModified: Date.now() });
  };

  const addCategory = async (category: VaultCategory) => {
    await saveState({ ...state, categories: [...state.categories, category], lastModified: Date.now() });
  };

  const deleteCategory = async (id: string) => {
    // Remove category reference from media
    const media = state.media.map(m => m.categoryId === id ? { ...m, categoryId: undefined } : m);
    const categories = state.categories.filter(c => c.id !== id);
    await saveState({ ...state, media, categories, lastModified: Date.now() });
  };

  return (
    <VaultContext.Provider value={{ state, updateMedia, addMedia, updateMediaItem, deleteMedia, updateJobs, addJob, updateJob, updateCategories, addCategory, deleteCategory, isLoading, error }}>
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
