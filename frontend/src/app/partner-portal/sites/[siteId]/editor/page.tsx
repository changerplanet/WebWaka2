'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Layout,
  Smartphone,
  Monitor,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  Sparkles,
  FileText,
  Image,
  Type,
  List,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Page {
  id: string;
  name: string;
  slug: string;
  pageType: string;
  blocks: any[];
  isPublished: boolean;
}

interface Site {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  pages: Page[];
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

const BLOCK_TYPES = [
  { type: 'hero', name: 'Hero Section', icon: Layout, description: 'Large header with headline and CTA' },
  { type: 'text', name: 'Text Block', icon: Type, description: 'Rich text content' },
  { type: 'features', name: 'Features', icon: List, description: 'Feature list with icons' },
  { type: 'testimonials', name: 'Testimonials', icon: MessageSquare, description: 'Customer testimonials' },
  { type: 'gallery', name: 'Image Gallery', icon: Image, description: 'Image grid or carousel' },
  { type: 'cta', name: 'Call to Action', icon: Phone, description: 'CTA section with button' },
  { type: 'form', name: 'Contact Form', icon: FileText, description: 'Lead capture form' },
];

export default function SiteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const siteId = params.siteId as string;

  const [site, setSite] = useState<Site | null>(null);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);

  useEffect(() => {
    if (siteId) {
      fetchSite();
    }
  }, [siteId]);

  const fetchSite = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sites-funnels/sites?action=get&siteId=${siteId}`);
      const data = await res.json();
      if (data.success && data.site) {
        setSite(data.site);
        if (data.site.pages?.length > 0) {
          setSelectedPage(data.site.pages[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching site:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    
    try {
      setSaving(true);
      const res = await fetch('/api/sites-funnels/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-page-blocks',
          pageId: selectedPage.id,
          blocks: selectedPage.blocks,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (blockType: string) => {
    if (!selectedPage) return;
    
    const newBlock = {
      id: `block-${Date.now()}`,
      type: blockType,
      name: BLOCK_TYPES.find(b => b.type === blockType)?.name || 'Block',
      content: getDefaultContent(blockType),
      styles: {},
      settings: {},
    };

    setSelectedPage({
      ...selectedPage,
      blocks: [...selectedPage.blocks, newBlock],
    });
    setShowAddBlock(false);
  };

  const getDefaultContent = (blockType: string) => {
    switch (blockType) {
      case 'hero':
        return {
          headline: 'Welcome to Our Site',
          subheadline: 'We help businesses grow with professional services',
          ctaText: 'Get Started',
          ctaLink: '#contact',
        };
      case 'text':
        return {
          content: 'Add your content here...',
        };
      case 'features':
        return {
          title: 'Our Features',
          features: [
            { icon: 'star', title: 'Feature 1', description: 'Description' },
            { icon: 'star', title: 'Feature 2', description: 'Description' },
            { icon: 'star', title: 'Feature 3', description: 'Description' },
          ],
        };
      case 'cta':
        return {
          headline: 'Ready to Get Started?',
          subheadline: 'Contact us today',
          ctaText: 'Contact Us',
          ctaLink: '#contact',
        };
      default:
        return {};
    }
  };

  const handleRemoveBlock = (blockIndex: number) => {
    if (!selectedPage) return;
    
    const newBlocks = [...selectedPage.blocks];
    newBlocks.splice(blockIndex, 1);
    setSelectedPage({
      ...selectedPage,
      blocks: newBlocks,
    });
  };

  const handleUpdateBlock = (blockIndex: number, field: string, value: any) => {
    if (!selectedPage) return;
    
    const newBlocks = [...selectedPage.blocks];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newBlocks[blockIndex] = {
        ...newBlocks[blockIndex],
        content: {
          ...newBlocks[blockIndex].content,
          [child]: value,
        },
      };
    } else {
      newBlocks[blockIndex] = {
        ...newBlocks[blockIndex],
        content: {
          ...newBlocks[blockIndex].content,
          [field]: value,
        },
      };
    }
    setSelectedPage({
      ...selectedPage,
      blocks: newBlocks,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Site not found</h2>
          <Button onClick={() => router.push('/partner-portal/sites')}>
            Back to Sites
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" data-testid="site-editor">
      {/* Editor Header */}
      <header className="border-b bg-background px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/partner-portal/sites')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-medium">{site.name}</h1>
            <p className="text-xs text-muted-foreground">/{site.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Mode Toggle */}
          <div className="flex items-center border rounded-md p-1">
            <Button
              variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => window.open(`/preview/${site.slug}`, '_blank')}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>

          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Site Settings</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input value={site.name} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Input
                    type="color"
                    value={site.primaryColor || '#0066ff'}
                    onChange={(e) => setSite({ ...site, primaryColor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select value={site.fontFamily || 'inter'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="opensans">Open Sans</SelectItem>
                      <SelectItem value="lato">Lato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button onClick={handleSave} disabled={saving} data-testid="save-site-btn">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Pages */}
        <div className="w-64 border-r bg-muted/20 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Pages</h3>
              <Button variant="ghost" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {site.pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setSelectedPage(page)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedPage?.id === page.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {page.name}
                  </div>
                  <p className="text-xs opacity-70">/{page.slug}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPage ? (
            <>
              {/* Blocks Toolbar */}
              <div className="border-b p-2 flex items-center gap-2">
                <Sheet open={showAddBlock} onOpenChange={setShowAddBlock}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Block
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Add Block</SheetTitle>
                    </SheetHeader>
                    <div className="grid gap-2 py-4">
                      {BLOCK_TYPES.map((block) => {
                        const Icon = block.icon;
                        return (
                          <button
                            key={block.type}
                            onClick={() => handleAddBlock(block.type)}
                            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                          >
                            <Icon className="w-5 h-5 mt-0.5" />
                            <div>
                              <div className="font-medium">{block.name}</div>
                              <div className="text-xs text-muted-foreground">{block.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>

                <Button variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assist
                </Button>
              </div>

              {/* Block Editor */}
              <div className="flex-1 overflow-y-auto p-4">
                <div
                  className={`mx-auto bg-white shadow-lg rounded-lg min-h-[600px] transition-all ${
                    previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-4xl'
                  }`}
                >
                  {selectedPage.blocks.length === 0 ? (
                    <div className="flex items-center justify-center h-96 text-muted-foreground">
                      <div className="text-center">
                        <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-2">No blocks yet</p>
                        <Button variant="outline" onClick={() => setShowAddBlock(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Block
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {selectedPage.blocks.map((block, index) => (
                        <Collapsible key={block.id || index} defaultOpen>
                          <div className="border-l-4 border-primary/20 hover:border-primary transition-colors">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium capitalize">{block.type}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveBlock(index);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-4 bg-muted/20 space-y-3">
                                {block.type === 'hero' && (
                                  <>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Headline</Label>
                                      <Input
                                        value={block.content?.headline || ''}
                                        onChange={(e) => handleUpdateBlock(index, 'headline', e.target.value)}
                                        placeholder="Enter headline"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Subheadline</Label>
                                      <Input
                                        value={block.content?.subheadline || ''}
                                        onChange={(e) => handleUpdateBlock(index, 'subheadline', e.target.value)}
                                        placeholder="Enter subheadline"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs">CTA Text</Label>
                                        <Input
                                          value={block.content?.ctaText || ''}
                                          onChange={(e) => handleUpdateBlock(index, 'ctaText', e.target.value)}
                                          placeholder="Button text"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">CTA Link</Label>
                                        <Input
                                          value={block.content?.ctaLink || ''}
                                          onChange={(e) => handleUpdateBlock(index, 'ctaLink', e.target.value)}
                                          placeholder="#contact"
                                        />
                                      </div>
                                    </div>
                                  </>
                                )}
                                {block.type === 'text' && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">Content</Label>
                                    <Textarea
                                      value={block.content?.content || ''}
                                      onChange={(e) => handleUpdateBlock(index, 'content', e.target.value)}
                                      placeholder="Enter your content"
                                      rows={4}
                                    />
                                  </div>
                                )}
                                {block.type === 'cta' && (
                                  <>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Headline</Label>
                                      <Input
                                        value={block.content?.headline || ''}
                                        onChange={(e) => handleUpdateBlock(index, 'headline', e.target.value)}
                                        placeholder="Enter headline"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">CTA Text</Label>
                                      <Input
                                        value={block.content?.ctaText || ''}
                                        onChange={(e) => handleUpdateBlock(index, 'ctaText', e.target.value)}
                                        placeholder="Button text"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a page to edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
