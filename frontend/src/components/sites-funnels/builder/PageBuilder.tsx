'use client';

/**
 * SITES & FUNNELS: Page Builder
 * 
 * Main page builder component with:
 * - Block-based editing
 * - Section reordering
 * - Mobile/Desktop preview
 * - Save/Publish workflow
 * 
 * Part of: Phase E2.1 - Visual Page Builder
 * Created: January 14, 2026
 */

import React, { useState, useCallback, useEffect } from 'react';
import { PageBlock, BlockType, BLOCK_REGISTRY, createBlock } from '@/lib/sites-funnels/builder/types';
import { BlockRenderer } from './BlockRenderer';

// Form type for E1.3 integration
interface AvailableForm {
  id: string;
  name: string;
  description?: string;
}

// ============================================================================
// TYPES
// ============================================================================

interface PageBuilderProps {
  pageId: string;
  pageName: string;
  siteId?: string;
  funnelId?: string;
  siteName?: string;
  funnelName?: string;
  initialBlocks: PageBlock[];
  isPublished: boolean;
  onSave: (blocks: PageBlock[]) => Promise<{ success: boolean; error?: string }>;
  onPublish?: () => Promise<{ success: boolean; error?: string }>;
}

type PreviewMode = 'desktop' | 'mobile';

// ============================================================================
// BLOCK SELECTOR PANEL
// ============================================================================

function BlockSelectorPanel({ onAddBlock, onClose }: { onAddBlock: (type: BlockType) => void; onClose: () => void }) {
  const blockCategories = {
    header: Object.values(BLOCK_REGISTRY).filter(b => b.category === 'header'),
    content: Object.values(BLOCK_REGISTRY).filter(b => b.category === 'content'),
    conversion: Object.values(BLOCK_REGISTRY).filter(b => b.category === 'conversion'),
    footer: Object.values(BLOCK_REGISTRY).filter(b => b.category === 'footer'),
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add Block</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {Object.entries(blockCategories).map(([category, blocks]) => (
            blocks.length > 0 && (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {category}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {blocks.map((block) => (
                    <button
                      key={block.type}
                      onClick={() => {
                        onAddBlock(block.type);
                        onClose();
                      }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">{block.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{block.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BLOCK WRAPPER (for editing controls)
// ============================================================================

function BlockWrapper({
  block,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onToggleVisibility,
  onEdit,
  canMoveUp,
  canMoveDown,
  availableForms,
}: {
  block: PageBlock;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onEdit: (content: any) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  availableForms?: Array<{ id: string; name: string; description?: string }>;
}) {
  return (
    <div
      className={`relative group ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
      onClick={onSelect}
    >
      {/* Block Controls */}
      <div className={`absolute left-0 top-0 z-20 flex flex-col gap-1 p-2 bg-white shadow-lg rounded-r-lg border border-gray-200 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={!canMoveUp}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={!canMoveDown}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="w-full h-px bg-gray-200 my-1" />
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className="p-1.5 rounded hover:bg-gray-100"
          title={block.isVisible ? 'Hide block' : 'Show block'}
        >
          <svg className={`w-4 h-4 ${block.isVisible ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {block.isVisible ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            )}
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded hover:bg-red-50"
          title="Delete block"
        >
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {/* Block Type Label */}
      <div className={`absolute right-0 top-0 z-20 px-3 py-1 bg-gray-900/80 text-white text-xs font-medium rounded-bl transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {BLOCK_REGISTRY[block.type]?.name || block.type}
      </div>
      
      {/* Block Content */}
      <BlockRenderer block={block} isEditing={isSelected} onEdit={onEdit} availableForms={availableForms} />
    </div>
  );
}

// ============================================================================
// MAIN PAGE BUILDER COMPONENT
// ============================================================================

export function PageBuilder({
  pageId,
  pageName,
  siteId,
  funnelId,
  siteName,
  funnelName,
  initialBlocks,
  isPublished,
  onSave,
  onPublish,
}: PageBuilderProps) {
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [availableForms, setAvailableForms] = useState<AvailableForm[]>([]);
  
  // Load available forms for form block selector
  useEffect(() => {
    async function loadForms() {
      try {
        const res = await fetch('/api/sites-funnels/builder/forms');
        if (res.ok) {
          const data = await res.json();
          setAvailableForms(data.forms || []);
        }
      } catch (error) {
        console.error('Failed to load forms:', error);
      }
    }
    loadForms();
  }, []);
  
  // Add block - uses functional update to avoid stale closure
  const handleAddBlock = useCallback((type: BlockType) => {
    const newBlock = createBlock(type);
    setBlocks(prevBlocks => {
      newBlock.sortOrder = prevBlocks.length;
      return [...prevBlocks, newBlock];
    });
    setIsDirty(true);
    setSaveError(null);
  }, []);
  
  // Move block up - uses functional update
  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      return newBlocks;
    });
    setIsDirty(true);
    setSaveError(null);
  }, []);
  
  // Move block down - uses functional update
  const handleMoveDown = useCallback((index: number) => {
    setBlocks(prevBlocks => {
      if (index >= prevBlocks.length - 1) return prevBlocks;
      const newBlocks = [...prevBlocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      return newBlocks;
    });
    setIsDirty(true);
    setSaveError(null);
  }, []);
  
  // Delete block - uses functional update
  const handleDeleteBlock = useCallback((blockId: string) => {
    if (confirm('Are you sure you want to delete this block?')) {
      setBlocks(prevBlocks => prevBlocks.filter(b => b.id !== blockId));
      setSelectedBlockId(prev => prev === blockId ? null : prev);
      setIsDirty(true);
      setSaveError(null);
    }
  }, []);
  
  // Toggle visibility - uses functional update
  const handleToggleVisibility = useCallback((blockId: string) => {
    setBlocks(prevBlocks => prevBlocks.map(b => 
      b.id === blockId ? { ...b, isVisible: !b.isVisible } : b
    ));
    setIsDirty(true);
    setSaveError(null);
  }, []);
  
  // Edit block content - uses functional update to avoid stale closure
  const handleEditBlock = useCallback((blockId: string, content: any) => {
    setBlocks(prevBlocks => prevBlocks.map(b => 
      b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b
    ));
    setIsDirty(true);
    setSaveError(null);
  }, []);
  
  // Save - normalizes sortOrder before saving to ensure correct order persistence
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // Normalize sortOrder based on current array position before saving
      const normalizedBlocks = blocks.map((block, index) => ({
        ...block,
        sortOrder: index,
      }));
      const result = await onSave(normalizedBlocks);
      if (result.success) {
        // Update local state with normalized sortOrder
        setBlocks(normalizedBlocks);
        setIsDirty(false);
        setLastSaved(new Date());
      } else {
        setSaveError(result.error || 'Failed to save');
      }
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [blocks, onSave]);
  
  // Preview width based on mode
  const previewWidth = previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-none';
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <a
            href={siteId ? `/partner-portal/sites/${siteId}` : funnelId ? `/partner-portal/funnels/${funnelId}` : '/partner-portal'}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div>
            <h1 className="font-semibold text-gray-900">{pageName}</h1>
            <p className="text-xs text-gray-500">{siteName || funnelName}</p>
          </div>
        </div>
        
        {/* Preview Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${previewMode === 'desktop' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${previewMode === 'mobile' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        
        {/* Save/Publish Actions */}
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-gray-400">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {saveError && (
            <span className="text-xs text-red-500">{saveError}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>Save{isDirty && '*'}</>
            )}
          </button>
          {onPublish && (
            <button
              onClick={onPublish}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              {isPublished ? 'Update' : 'Publish'}
            </button>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className={`mx-auto ${previewWidth} transition-all duration-300 ${previewMode === 'mobile' ? 'shadow-xl ring-4 ring-gray-200 rounded-3xl overflow-hidden' : ''}`}>
          {/* Blocks */}
          <div className="bg-white min-h-[600px]">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium mb-2">No blocks yet</p>
                <p className="text-sm mb-4">Add your first block to start building</p>
                <button
                  onClick={() => setShowBlockSelector(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Add Block
                </button>
              </div>
            ) : (
              <>
                {blocks.map((block, index) => (
                  <BlockWrapper
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onToggleVisibility={() => handleToggleVisibility(block.id)}
                    onEdit={(content) => handleEditBlock(block.id, content)}
                    canMoveUp={index > 0}
                    canMoveDown={index < blocks.length - 1}
                    availableForms={availableForms}
                  />
                ))}
              </>
            )}
          </div>
          
          {/* Add Block Button */}
          {blocks.length > 0 && (
            <div className="flex justify-center py-8">
              <button
                onClick={() => setShowBlockSelector(true)}
                className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Block
              </button>
            </div>
          )}
        </div>
      </main>
      
      {/* Block Selector Modal */}
      {showBlockSelector && (
        <BlockSelectorPanel
          onAddBlock={handleAddBlock}
          onClose={() => setShowBlockSelector(false)}
        />
      )}
    </div>
  );
}
