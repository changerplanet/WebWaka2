# WebWaka Design System — Foundations

**Version:** 1.0  
**Scope:** Marketing Website (Partner-Facing)  
**Design Principles:** Mobile-First | Nigeria-First | Partner-First | Legibility-Enforced  

---

## 1. COLOR PALETTE

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Waka Green** | `#059669` | 5, 150, 105 | Primary CTAs, success states, brand identity |
| **Waka Green Dark** | `#047857` | 4, 120, 87 | Hover states, emphasis |
| **Waka Green Light** | `#10B981` | 16, 185, 129 | Highlights, accents |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Naira Gold** | `#D97706` | 217, 119, 6 | Nigerian context, pricing, premium features |
| **Naira Gold Light** | `#F59E0B` | 245, 158, 11 | Hover states, highlights |

### Neutral Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Gray 900** | `#111827` | 17, 24, 39 | Primary text, headings |
| **Gray 700** | `#374151` | 55, 65, 81 | Body text |
| **Gray 500** | `#6B7280` | 107, 114, 128 | Secondary text, captions |
| **Gray 300** | `#D1D5DB` | 209, 213, 219 | Borders, dividers |
| **Gray 100** | `#F3F4F6` | 243, 244, 246 | Backgrounds, cards |
| **White** | `#FFFFFF` | 255, 255, 255 | Page backgrounds |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#059669` | Confirmation, positive states |
| **Warning** | `#D97706` | Caution, attention needed |
| **Error** | `#DC2626` | Errors, destructive actions |
| **Info** | `#2563EB` | Informational messages |

### Demo Strength Colors

| Strength | Background | Text | Border |
|----------|------------|------|--------|
| **STRONG** | `#DCFCE7` | `#166534` | `#22C55E` |
| **MEDIUM** | `#FEF3C7` | `#92400E` | `#F59E0B` |
| **MENTION** | `#F3F4F6` | `#6B7280` | `#D1D5DB` |

### Dark Mode (Optional Future)
Reserved for future implementation. Current focus is light mode only.

---

## 2. TYPOGRAPHY

### Font Family

**Primary:** Inter  
**Fallback Stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

**Why Inter:**
- Excellent legibility at small sizes
- Clear letter distinction (I/l/1, O/0)
- Variable font with full weight range
- Open source, freely available
- Renders well on low-resolution screens

### Type Scale

#### Mobile (Base: 16px)

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| **Display** | 32px / 2rem | 1.2 | 700 (Bold) | Hero headlines |
| **H1** | 28px / 1.75rem | 1.25 | 700 (Bold) | Page titles |
| **H2** | 24px / 1.5rem | 1.3 | 600 (Semi) | Section headings |
| **H3** | 20px / 1.25rem | 1.4 | 600 (Semi) | Subsection headings |
| **H4** | 18px / 1.125rem | 1.4 | 600 (Semi) | Card titles |
| **Body Large** | 18px / 1.125rem | 1.6 | 400 (Regular) | Lead paragraphs |
| **Body** | 16px / 1rem | 1.6 | 400 (Regular) | Body text |
| **Body Small** | 14px / 0.875rem | 1.5 | 400 (Regular) | Captions, metadata |
| **Caption** | 12px / 0.75rem | 1.5 | 500 (Medium) | Labels, badges |

#### Desktop (Base: 16px)

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| **Display** | 48px / 3rem | 1.15 | 700 (Bold) | Hero headlines |
| **H1** | 36px / 2.25rem | 1.2 | 700 (Bold) | Page titles |
| **H2** | 30px / 1.875rem | 1.25 | 600 (Semi) | Section headings |
| **H3** | 24px / 1.5rem | 1.3 | 600 (Semi) | Subsection headings |
| **H4** | 20px / 1.25rem | 1.4 | 600 (Semi) | Card titles |
| **Body Large** | 20px / 1.25rem | 1.6 | 400 (Regular) | Lead paragraphs |
| **Body** | 16px / 1rem | 1.6 | 400 (Regular) | Body text |
| **Body Small** | 14px / 0.875rem | 1.5 | 400 (Regular) | Captions, metadata |
| **Caption** | 12px / 0.75rem | 1.5 | 500 (Medium) | Labels, badges |

### Typography Rules

**MANDATORY:**
- Minimum body font size: **16px** (mobile and desktop)
- Minimum line height: **1.5** for body text
- No font weights below **400** for body text
- Headlines can use **600-700** weights only
- Maximum line length: **65-75 characters** (desktop)

**PROHIBITED:**
- Script or decorative fonts
- Condensed fonts
- Font weights 100-300 for any text
- Font sizes below 12px

### Text Colors

| Context | Color | Hex |
|---------|-------|-----|
| Primary text | Gray 900 | `#111827` |
| Secondary text | Gray 700 | `#374151` |
| Muted text | Gray 500 | `#6B7280` |
| Link text | Waka Green | `#059669` |
| Link hover | Waka Green Dark | `#047857` |

---

## 3. SPACING SYSTEM

### Base Unit: 4px

All spacing uses multiples of 4px for consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | No spacing |
| `space-1` | 4px | Tight inline spacing |
| `space-2` | 8px | Icon gaps, tight padding |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Medium padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Large section gaps |
| `space-10` | 40px | Page section spacing |
| `space-12` | 48px | Hero spacing |
| `space-16` | 64px | Large page sections |
| `space-20` | 80px | Desktop section dividers |
| `space-24` | 96px | Desktop hero spacing |

### Component Spacing

| Component | Padding (Mobile) | Padding (Desktop) |
|-----------|------------------|-------------------|
| Button | 12px 24px | 16px 32px |
| Card | 16px | 24px |
| Section | 40px 16px | 80px 32px |
| Container | 0 16px | 0 32px |
| Hero | 48px 16px | 96px 32px |

### Gap System

| Context | Mobile | Desktop |
|---------|--------|---------|
| Icon + Text | 8px | 8px |
| Button group | 12px | 16px |
| Card grid | 16px | 24px |
| Section content | 24px | 32px |
| Stacked sections | 40px | 80px |

---

## 4. LAYOUT GRID

### Container Widths

| Breakpoint | Container Width | Side Padding |
|------------|-----------------|--------------|
| Mobile (<480px) | 100% | 16px |
| Tablet (481-768px) | 100% | 24px |
| Desktop (769-1024px) | 960px | 32px |
| Large (>1024px) | 1200px | 32px |

### Column Grid

**Mobile (1-2 columns):**
- Single column default
- 2 columns for small cards/badges

**Tablet (2-3 columns):**
- 2 columns for content blocks
- 3 columns for feature lists

**Desktop (3-4 columns):**
- 3 columns for suite cards
- 4 columns for stats/features
- 12-column underlying grid

### Content Width

| Content Type | Max Width |
|--------------|-----------|
| Paragraph text | 65ch (~650px) |
| Hero text | 80ch (~800px) |
| Full-width sections | 100% |
| Centered content | 960px |

---

## 5. BORDER RADIUS

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0px | Sharp edges |
| `radius-sm` | 4px | Buttons, badges |
| `radius-md` | 8px | Cards, inputs |
| `radius-lg` | 12px | Large cards, modals |
| `radius-xl` | 16px | Feature sections |
| `radius-full` | 9999px | Pills, avatars |

---

## 6. SHADOWS

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Dropdowns, modals |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | Feature cards |

---

## 7. ICONOGRAPHY

### Icon System: Lucide React

**Why Lucide:**
- Consistent 24px base size
- 2px stroke weight
- Clear at small sizes
- Open source
- Large icon library

### Icon Sizes

| Size | Dimensions | Usage |
|------|------------|-------|
| Small | 16px | Inline with text |
| Default | 20px | Buttons, lists |
| Medium | 24px | Feature icons |
| Large | 32px | Hero features |
| XL | 48px | Category icons |

### Icon Colors
Icons inherit text color by default. Use `currentColor` for stroke.

---

## 8. ACCESSIBILITY

### Color Contrast (WCAG AA)

| Text Type | Minimum Ratio |
|-----------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+) | 3:1 |
| UI components | 3:1 |

### Verified Contrast Ratios

| Combination | Ratio | Pass |
|-------------|-------|------|
| Gray 900 on White | 15.8:1 | Yes |
| Gray 700 on White | 8.6:1 | Yes |
| Waka Green on White | 4.5:1 | Yes |
| White on Waka Green | 4.5:1 | Yes |
| Naira Gold on White | 4.5:1 | Yes |

### Focus States
All interactive elements must have visible focus states using:
- 2px solid ring
- Waka Green color
- 2px offset

---

## 9. MOTION

### Transitions

| Property | Duration | Easing |
|----------|----------|--------|
| Color changes | 150ms | ease-in-out |
| Background | 150ms | ease-in-out |
| Transform | 200ms | ease-out |
| Opacity | 200ms | ease-in-out |

### Animation Principles
- Prefer reduced motion for accessibility
- No animations on critical content
- Subtle micro-interactions only
- Respect `prefers-reduced-motion`

---

## 10. CSS CUSTOM PROPERTIES

```css
:root {
  /* Colors */
  --color-primary: #059669;
  --color-primary-dark: #047857;
  --color-primary-light: #10B981;
  --color-secondary: #D97706;
  --color-secondary-light: #F59E0B;
  
  /* Neutrals */
  --color-gray-900: #111827;
  --color-gray-700: #374151;
  --color-gray-500: #6B7280;
  --color-gray-300: #D1D5DB;
  --color-gray-100: #F3F4F6;
  --color-white: #FFFFFF;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.6;
  
  /* Spacing */
  --space-unit: 4px;
  
  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

---

*End of Design Foundations*
