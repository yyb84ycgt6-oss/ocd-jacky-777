import { useState } from 'react';
import { Home, Upload, FolderOpen, Layers, Settings, Menu, X } from 'lucide-react';
import { VaultDashboard } from './pages/VaultDashboard';
import { ImportScreen } from './pages/ImportScreen';
import { LibraryScreen } from './pages/LibraryScreen';
import { MediaDetail } from './pages/MediaDetail';
import { JobBuilder } from './pages/JobBuilder';
import { QueueScreen } from './pages/QueueScreen';
import { OutputReview } from './pages/OutputReview';
import { SettingsScreen } from './pages/SettingsScreen';
import { CategoriesManager } from './pages/CategoriesManager';
import type { MediaItem } from './types';

type VaultPage = 'dashboard' | 'import' | 'library' | 'detail' | 'convert' | 'queue' | 'output' | 'settings' | 'categories';

interface NavigationState {
  page: VaultPage;
  item?: MediaItem;
  jobId?: string;
}

export function VaultShell() {
  const [nav, setNav] = useState<NavigationState>({ page: 'dashboard' });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigate = (page: string, data?: any) => {
    setNav({
      page: page as VaultPage,
      item: data?.item,
      jobId: data?.jobId,
    });
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const goBack = () => setNav({ page: 'dashboard' });

  const renderPage = () => {
    switch (nav.page) {
      case 'dashboard':
        return <VaultDashboard onNavigate={navigate} />;
      case 'import':
        return <ImportScreen onBack={goBack} />;
      case 'library':
        return (
          <LibraryScreen
            onBack={goBack}
            onSelectItem={(item) => navigate('detail', { item })}
          />
        );
      case 'detail':
        return nav.item ? (
          <MediaDetail
            item={nav.item}
            onBack={() => navigate('library')}
            onConvert={(item) => navigate('convert', { item })}
          />
        ) : null;
      case 'convert':
        return nav.item ? (
          <JobBuilder
            item={nav.item}
            onBack={() => navigate('detail', { item: nav.item })}
            onJobCreated={() => navigate('queue')}
          />
        ) : null;
      case 'queue':
        return <QueueScreen onBack={goBack} />;
      case 'output':
        return <OutputReview jobId={nav.jobId || ''} onBack={() => navigate('queue')} />;
      case 'settings':
        return <SettingsScreen onBack={goBack} onNavigate={navigate} />;
      case 'categories':
        return <CategoriesManager onBack={() => navigate('settings')} />;
      default:
        return <VaultDashboard onNavigate={navigate} />;
    }
  };

  const tabs: { key: VaultPage; icon: typeof Home; label: string }[] = [
    { key: 'dashboard', icon: Home, label: 'Home' },
    { key: 'import', icon: Upload, label: 'Import' },
    { key: 'library', icon: FolderOpen, label: 'Library' },
    { key: 'queue', icon: Layers, label: 'Queue' },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation - Collapsible */}
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-16'
        } bg-card border-r border-border flex flex-col transition-all duration-200 ease-out fixed left-0 top-0 h-screen z-40 safe-area-left`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-bold text-primary">J</span>
              <span className="text-xs font-mono uppercase tracking-wider text-foreground">Vault</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-secondary rounded-md transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {tabs.map(({ key, icon: Icon, label }) => {
            const active = nav.page === key;
            return (
              <button
                key={key}
                onClick={() => navigate(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-mono uppercase tracking-wider ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Status */}
        {sidebarOpen && (
          <div className="p-3 border-t border-border text-[10px] font-mono text-muted-foreground space-y-1">
            <div>Status: Ready</div>
            <div>Synced</div>
          </div>
        )}
      </aside>

      {/* Main Content - Full Height */}
      <main
        className={`${
          sidebarOpen ? 'ml-56' : 'ml-16'
        } flex-1 overflow-y-auto transition-all duration-200 ease-out safe-area-right safe-area-bottom`}
      >
        <div className="min-h-screen px-4 py-4">
          {renderPage()}
        </div>
      </main>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
