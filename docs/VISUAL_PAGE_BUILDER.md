# Phase E2.1: Sites & Funnels Visual Page Builder

## Overview

The Visual Page Builder is a block-based page editor for Sites & Funnels. It enables partners to visually customize pages using predefined sections without needing code. The builder preserves templates as read-only blueprints while allowing safe visual customization per tenant.

**Key Principle**: Section/block-based editing, NOT free-canvas design.

## Architecture

### Builder Flow

```
Template (Read-Only) → Clone to Site/Page → Edit with Builder → Save → Publish
```

### Data Flow

1. **Page Load**: `getPageForEditing()` fetches page with blocks from `sf_page_blocks` table
2. **Block Editing**: Client-side state management with inline editing
3. **Save**: `saveBlocks()` persists blocks to both `sf_page_blocks` table and `sf_pages.blocks` JSON column
4. **Publish**: Site/Funnel publish workflow marks pages as published

### Block Storage

Blocks are stored in two places for flexibility:
- **`sf_page_blocks` table**: Normalized storage with individual block records
- **`sf_pages.blocks` JSON column**: Denormalized backup for backward compatibility

## Supported Block Types

| Block Type | Category | Description |
|------------|----------|-------------|
| Hero | Header | Eye-catching hero section with headline and CTA |
| Features | Content | Showcase product or service features (2-4 columns) |
| Pricing | Conversion | Display pricing plans and tiers |
| Testimonials | Content | Customer reviews and testimonials |
| CTA | Conversion | Call to action section |
| Form | Conversion | Embed forms from E1.3 Forms library |
| Footer | Footer | Page footer with links and copyright |

### Block Structure

```typescript
interface PageBlock {
  id: string;           // Unique block ID
  type: BlockType;      // hero, features, pricing, testimonials, cta, form, footer
  name: string;         // Display name
  isVisible: boolean;   // Visibility toggle
  sortOrder: number;    // Position in page
  content: {            // Type-specific content object
    // Varies by block type
  };
}
```

## Editor UX

### Features

- **Mobile-first editing**: Touch-friendly controls
- **Section reorder**: Move blocks up/down with controls
- **Inline content editing**: Edit text directly in preview
- **Preview modes**: Toggle between desktop and mobile views
- **Visibility toggle**: Show/hide blocks without deleting
- **Auto-save indicator**: Shows save status and last saved time

### Block Controls

Each block has controls for:
- Move up / Move down (reordering)
- Toggle visibility (show/hide)
- Delete block

### Preview Mode

Two preview modes available:
- **Desktop**: Full-width preview
- **Mobile**: 375px width with device frame styling

## APIs

### GET /api/sites-funnels/builder/page/[pageId]

Load page for editing.

**Response:**
```json
{
  "success": true,
  "page": {
    "id": "...",
    "name": "Home",
    "slug": "home",
    "blocks": [...],
    "isPublished": false
  },
  "site": {
    "id": "...",
    "name": "My Site",
    "status": "DRAFT"
  }
}
```

### PUT /api/sites-funnels/builder/page/[pageId]

Save page blocks.

**Request:**
```json
{
  "blocks": [
    {
      "id": "...",
      "type": "hero",
      "name": "Hero Section",
      "isVisible": true,
      "sortOrder": 0,
      "content": {
        "headline": "Welcome",
        "subheadline": "...",
        "ctaText": "Get Started"
      }
    }
  ]
}
```

### GET /api/sites-funnels/builder/forms

Get available forms for Form Block integration.

**Response:**
```json
{
  "forms": [
    { "id": "...", "name": "Contact Form", "description": "..." }
  ]
}
```

## Form Block Integration (E1.3)

The Form block integrates with E1.3 Forms:
- Select existing forms from tenant's form library via dropdown selector
- Forms are loaded via `/api/sites-funnels/builder/forms` on editor mount
- Form selection persisted via `formId` in block content
- Form renders with full E1.3 functionality (validation, payment) at runtime
- No modifications to E1.3 schema or logic

## State Management

The PageBuilder uses functional React state updates to ensure correctness:

```typescript
// All block mutations use functional updates to avoid stale closures
setBlocks(prevBlocks => prevBlocks.map(b => 
  b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b
));

// Save normalizes sortOrder based on array position
const normalizedBlocks = blocks.map((block, index) => ({
  ...block,
  sortOrder: index,
}));
```

Key patterns:
- **Functional updates**: All handlers use `setBlocks(prev => ...)` pattern
- **sortOrder normalization**: Recalculated from array index before save
- **Form loading**: Available forms fetched once on mount via useEffect

## Demo vs Live Behavior

- **Demo Mode**: All builder operations work with demo data
- **Live Mode**: Real data is persisted
- No special handling needed - follows existing Sites & Funnels demo patterns

## File Structure

```
frontend/src/lib/sites-funnels/builder/
├── types.ts              # Block type definitions & registry
├── builder-service.ts    # Server-side operations
└── index.ts              # Module exports

frontend/src/components/sites-funnels/builder/
├── BlockRenderer.tsx     # Block rendering components
├── PageBuilder.tsx       # Main editor component
└── index.ts              # Component exports

frontend/src/app/api/sites-funnels/builder/
├── page/[pageId]/route.ts  # Page CRUD API
└── forms/route.ts          # Available forms API

frontend/src/app/partner-portal/sites/[siteId]/pages/[pageId]/builder/
└── page.tsx              # Builder page route
```

## Constraints Compliance

### Included (as specified)
- Block-based page editor
- Section reordering
- Inline text/image/CTA editing
- Form block binding (reuses E1.3 forms)
- Mobile + desktop preview
- Save / publish workflow

### Excluded (as specified)
- No automations
- No email/SMS notifications
- No background jobs
- No AI content generation
- No payouts or settlements
- No schema changes outside Sites & Funnels domain
- No breaking changes to existing templates or forms
- No visual free-canvas builder

## Usage

### Accessing the Builder

Navigate to:
```
/partner-portal/sites/[siteId]/pages/[pageId]/builder
```

### Adding Blocks

1. Click "Add Block" button
2. Select block type from modal
3. Block is added at the end of the page
4. Edit content inline

### Editing Content

1. Click on a block to select it
2. Edit text fields directly in the preview
3. Changes are tracked as "unsaved"
4. Click "Save" to persist

### Publishing

After saving, click "Publish" to make the page live. This follows the existing Sites & Funnels publish workflow.
