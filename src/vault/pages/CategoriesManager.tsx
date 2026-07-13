import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, X } from 'lucide-react';
import { useVault } from '../VaultContext';
import type { VaultCategory } from '../types';

interface CategoriesManagerProps {
  onBack: () => void;
}

const ICON_PRESETS = [
  '📦', '🎯', '⭐', '🔒', '📁', '🏷️', '🎨', '📝',
  '🚀', '💡', '🎬', '🎵', '📊', '📚', '🛠️', '⚡',
];

const COLOR_PRESETS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#F5FF33',
  '#FF8C33', '#33FFF5', '#FF3333', '#33FF8C', '#8C33FF',
];

export function CategoriesManager({ onBack }: CategoriesManagerProps) {
  const { state, addCategory, updateCategories, deleteCategory } = useVault();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '📦', color: '#FF5733' });

  const handleAdd = async () => {
    if (!formData.name.trim()) return;

    const category: VaultCategory = {
      id: crypto.randomUUID(),
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      createdAt: new Date().toISOString(),
    };

    await addCategory(category);
    setFormData({ name: '', icon: '📦', color: '#FF5733' });
    setShowForm(false);
  };

  const handleEdit = async () => {
    if (!editingId || !formData.name.trim()) return;

    const updated = state.categories.map(c =>
      c.id === editingId
        ? { ...c, name: formData.name, icon: formData.icon, color: formData.color }
        : c
    );

    await updateCategories(updated);
    setFormData({ name: '', icon: '📦', color: '#FF5733' });
    setEditingId(null);
  };

  const startEdit = (category: VaultCategory) => {
    setFormData({ name: category.name, icon: category.icon, color: category.color });
    setEditingId(category.id);
    setShowForm(false);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-mono uppercase tracking-wider text-foreground">Categories</h1>
          <p className="text-[11px] text-muted-foreground">{state.categories.length} custom categories</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', icon: '📦', color: '#FF5733' });
          }}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-md"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingId) && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider">Category Name</label>
            <input
              type="text"
              placeholder="e.g., My Projects"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider">Icon</label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_PRESETS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-2xl p-2 rounded border ${
                    formData.icon === icon ? 'border-primary bg-primary/20' : 'border-border'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <div className="grid grid-cols-5 gap-2 flex-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-10 rounded border ${formData.color === color ? 'border-foreground border-2' : 'border-border'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (editingId) {
                  handleEdit();
                } else {
                  handleAdd();
                }
              }}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-mono uppercase"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ name: '', icon: '📦', color: '#FF5733' });
              }}
              className="px-4 py-2 bg-muted text-muted-foreground rounded text-sm font-mono uppercase"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {state.categories.length === 0 && !showForm && !editingId && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No categories yet. Create one to organize your media.</p>
          </div>
        )}

        {state.categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
          >
            <span className="text-2xl">{category.icon}</span>
            <div className="flex-1">
              <div className="font-mono text-sm">{category.name}</div>
              <div
                className="w-8 h-2 rounded mt-1"
                style={{ backgroundColor: category.color }}
              />
            </div>
            <button
              onClick={() => startEdit(category)}
              className="p-2 hover:bg-accent rounded-md"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => deleteCategory(category.id)}
              className="p-2 hover:bg-accent rounded-md"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
