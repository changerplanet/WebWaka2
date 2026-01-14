'use client';

/**
 * SITES & FUNNELS: Page Builder Route
 * 
 * Visual page editor for Sites & Funnels pages.
 * 
 * Part of: Phase E2.1 - Visual Page Builder
 * Created: January 14, 2026
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageBuilder } from '@/components/sites-funnels/builder';
import { PageBlock } from '@/lib/sites-funnels/builder/types';

interface PageData {
  id: string;
  name: string;
  slug: string;
  siteId?: string;
  funnelId?: string;
  blocks: PageBlock[];
  isPublished: boolean;
}

interface SiteData {
  id: string;
  name: string;
  status: string;
}

export default function PageBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;
  const pageId = params.pageId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  
  // Load page data
  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/sites-funnels/builder/page/${pageId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load page');
        }
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load page');
        }
        
        setPageData(data.page);
        setSiteData(data.site || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load page');
      } finally {
        setLoading(false);
      }
    }
    
    loadPage();
  }, [pageId]);
  
  // Save handler
  const handleSave = async (blocks: PageBlock[]): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/sites-funnels/builder/page/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to save' };
      }
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save' };
    }
  };
  
  // Publish handler
  const handlePublish = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/sites-funnels/sites/${siteId}/publish`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to publish' };
      }
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to publish' };
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page builder...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Page</h2>
          <p className="text-gray-600 mb-6">{error || 'Page not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <PageBuilder
      pageId={pageData.id}
      pageName={pageData.name}
      siteId={siteData?.id}
      siteName={siteData?.name}
      initialBlocks={pageData.blocks}
      isPublished={pageData.isPublished}
      onSave={handleSave}
      onPublish={handlePublish}
    />
  );
}
