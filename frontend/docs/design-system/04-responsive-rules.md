# WebWaka Design System — Responsive Layout Rules

**Version:** 1.0  
**Scope:** Marketing Website (Partner-Facing)  
**Principle:** Mobile-First, Progressive Enhancement  

---

## 1. BREAKPOINT SYSTEM

### Breakpoints

| Name | Min Width | Max Width | Target Devices |
|------|-----------|-----------|----------------|
| **Mobile** | 0px | 479px | Phones (primary) |
| **Mobile Large** | 480px | 639px | Large phones |
| **Tablet** | 640px | 767px | Small tablets |
| **Tablet Large** | 768px | 1023px | Tablets, landscape |
| **Desktop** | 1024px | 1279px | Laptops |
| **Desktop Large** | 1280px | ∞ | Desktops, monitors |

### CSS Media Queries

```css
/* Mobile First - Default styles apply to mobile */

/* Mobile Large */
@media (min-width: 480px) { }

/* Tablet */
@media (min-width: 640px) { }

/* Tablet Large */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Desktop Large */
@media (min-width: 1280px) { }
```

### Tailwind Breakpoints

```javascript
screens: {
  'sm': '480px',   // Mobile Large
  'md': '640px',   // Tablet
  'lg': '768px',   // Tablet Large
  'xl': '1024px',  // Desktop
  '2xl': '1280px', // Desktop Large
}
```

---

## 2. CONTAINER RULES

### Container Widths

| Breakpoint | Container | Side Padding | Max Width |
|------------|-----------|--------------|-----------|
| Mobile | 100% | 16px | 100% |
| Mobile Large | 100% | 20px | 100% |
| Tablet | 100% | 24px | 100% |
| Tablet Large | 100% | 32px | 720px |
| Desktop | Centered | 32px | 960px |
| Desktop Large | Centered | 32px | 1200px |

### CSS Implementation

```css
.container {
  width: 100%;
  padding-left: 16px;
  padding-right: 16px;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 480px) {
  .container { padding-left: 20px; padding-right: 20px; }
}

@media (min-width: 640px) {
  .container { padding-left: 24px; padding-right: 24px; }
}

@media (min-width: 768px) {
  .container { padding-left: 32px; padding-right: 32px; max-width: 720px; }
}

@media (min-width: 1024px) {
  .container { max-width: 960px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1200px; }
}
```

---

## 3. GRID TRANSFORMATIONS

### Column Grid by Breakpoint

| Component | Mobile | Tablet | Desktop | Desktop Large |
|-----------|--------|--------|---------|---------------|
| Suite cards | 1 col | 2 col | 3 col | 4 col |
| Stats grid | 2x2 | 4 col | 4 col | 4 col |
| Feature cards | 1 col | 2 col | 3 col | 4 col |
| Demo tenant cards | 1 col | 2 col | 3 col | 3 col |
| Partner profiles | 1 col (carousel) | 2 col | 3 col | 5 col |
| Footer columns | 1 col (accordion) | 2 col | 4 col | 4 col |

### Grid Gap by Breakpoint

| Breakpoint | Card Gap | Section Gap |
|------------|----------|-------------|
| Mobile | 16px | 40px |
| Tablet | 20px | 48px |
| Desktop | 24px | 64px |
| Desktop Large | 32px | 80px |

---

## 4. NAVIGATION BEHAVIOR

### Header

| Breakpoint | Logo | Nav Items | CTAs | Menu |
|------------|------|-----------|------|------|
| Mobile | 32px height | Hidden | Hidden | Hamburger |
| Tablet | 36px height | Hidden | Hidden | Hamburger |
| Tablet Large | 40px height | Visible | 1 CTA | None |
| Desktop | 40px height | Visible | 2 CTAs | None |

### Mobile Menu Overlay

**Trigger:** Hamburger icon (Mobile, Tablet)
**Animation:** Slide from right, 300ms
**Content:** Full navigation tree, expandable sections
**Close:** X button, tap outside, swipe right

### Desktop Navigation

**Layout:** Horizontal nav with dropdowns
**Suites Dropdown:** Multi-column mega menu
**CTAs:** WhatsApp + Become Partner

### Sticky Bottom Bar (Mobile Only)

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Visible after scrolling past hero |
| Tablet | Visible after scrolling past hero |
| Tablet Large+ | Hidden (use header CTAs) |

---

## 5. HERO SECTION BEHAVIOR

### Height

| Breakpoint | Hero Height |
|------------|-------------|
| Mobile | 100vh - 64px (full screen minus header) |
| Tablet | 100vh - 64px |
| Tablet Large | 80vh |
| Desktop | 80vh |
| Desktop Large | 70vh (max 700px) |

### Content Layout

| Breakpoint | Layout | Text Align | CTAs |
|------------|--------|------------|------|
| Mobile | Single column | Center | Stacked |
| Tablet | Single column | Center | Stacked |
| Tablet Large | Two column (optional) | Left | Inline |
| Desktop | Two column | Left | Inline |

### CTA Behavior

| Breakpoint | Primary | Secondary |
|------------|---------|-----------|
| Mobile | Full width | Full width (below) |
| Tablet | Full width | Full width (below) |
| Tablet Large | Auto width | Auto width (inline) |
| Desktop | Auto width | Auto width (inline) |

---

## 6. CARD BEHAVIOR

### Suite Cards

| Breakpoint | Width | Layout | Hover |
|------------|-------|--------|-------|
| Mobile | 100% | Stacked | None |
| Tablet | 50% - gap | Stacked | None |
| Desktop | 33% - gap | Stacked | Shadow, border color |

### Demo Tenant Cards

| Breakpoint | Width | Info Shown |
|------------|-------|------------|
| Mobile | 100% | Full info |
| Tablet | 50% - gap | Full info |
| Desktop | 33% - gap | Full info |

### Stats Cards

| Breakpoint | Layout |
|------------|--------|
| Mobile | 2x2 grid |
| Tablet+ | 4 columns inline |

---

## 7. ACCORDION/EXPANSION BEHAVIOR

### Suite Categories (Suites Overview Page)

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Accordion (first expanded, rest collapsed) |
| Tablet | Accordion |
| Desktop | All expanded, tabbed interface optional |

### FAQ Section

| Breakpoint | Behavior |
|------------|----------|
| All | Accordion (all collapsed by default) |

### Footer Links

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Accordion (collapsible sections) |
| Tablet | 2-column grid, all visible |
| Desktop | 4-column grid, all visible |

---

## 8. TABLE/COMPARISON BEHAVIOR

### Comparison Tables

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Horizontal scroll OR stacked cards |
| Tablet | Horizontal scroll |
| Desktop | Full table visible |

**Mobile Alternative:** Convert tables to stacked comparison cards

```
Mobile View:
┌────────────────────┐
│  WebWaka           │
│  ✓ Nigeria-specific│
│  ✓ Suite integration
│  ✓ Naira billing   │
└────────────────────┘
┌────────────────────┐
│  GoHighLevel       │
│  ✗ Generic         │
│  ✗ API only        │
│  ✗ USD only        │
└────────────────────┘
```

---

## 9. IMAGE BEHAVIOR

### Hero Images

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Hidden or background pattern |
| Tablet | Hidden or small accent |
| Desktop | Right side illustration/graphic |

### Feature Icons

| Breakpoint | Size |
|------------|------|
| Mobile | 32px |
| Tablet | 36px |
| Desktop | 48px |

### Category Icons

| Breakpoint | Size |
|------------|------|
| Mobile | 40px |
| Desktop | 56px |

---

## 10. TYPOGRAPHY SCALING

### Heading Sizes by Breakpoint

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Display | 32px | 40px | 48px |
| H1 | 28px | 32px | 36px |
| H2 | 24px | 28px | 30px |
| H3 | 20px | 22px | 24px |
| H4 | 18px | 18px | 20px |
| Body | 16px | 16px | 16px |
| Body Small | 14px | 14px | 14px |

### Line Length Control

| Content Type | Max Width |
|--------------|-----------|
| Body text | 65ch (~650px) |
| Hero subheadline | 80ch (~800px) |
| Full-width content | 100% |

---

## 11. BUTTON SCALING

### Button Sizes by Breakpoint

| Button Type | Mobile | Desktop |
|-------------|--------|---------|
| Primary CTA | Height: 48px, Full width | Height: 52px, Auto width |
| Secondary | Height: 44px, Full width | Height: 48px, Auto width |
| Small | Height: 36px, Auto | Height: 40px, Auto |

### CTA Stacking

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Stacked (full width) |
| Tablet Large+ | Inline (auto width, 16px gap) |

---

## 12. SPACING SCALING

### Section Padding

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Section top/bottom | 40px | 56px | 80px |
| Hero top/bottom | 48px | 64px | 96px |
| Card padding | 16px | 20px | 24px |

### Gap Between Sections

| Breakpoint | Gap |
|------------|-----|
| Mobile | 40px |
| Tablet | 56px |
| Desktop | 80px |

---

## 13. SPECIAL COMPONENT RULES

### WhatsApp Floating Button

| Breakpoint | Position | Size |
|------------|----------|------|
| Mobile | Bottom-right, 20px offset | 56px |
| Desktop | Bottom-right, 24px offset | 56px |

### Sticky Bottom Bar

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Visible after hero, fixed bottom |
| Tablet | Visible after hero, fixed bottom |
| Tablet Large+ | Hidden |

### Demo Mode Indicator

| Breakpoint | Position |
|------------|----------|
| All | Fixed top, full width, 40px height |

---

## 14. TOUCH TARGET MINIMUMS

### Minimum Sizes (Mobile)

| Element | Minimum Size |
|---------|--------------|
| Button | 44px × 44px |
| Link in nav | 44px height |
| Icon button | 44px × 44px |
| Card (tappable) | 44px minimum dimension |

### Spacing Between Targets

| Context | Minimum Spacing |
|---------|-----------------|
| Adjacent buttons | 8px |
| List items | 8px |
| Nav items | 8px |

---

## 15. OVERFLOW HANDLING

### Horizontal Overflow

| Component | Mobile Behavior |
|-----------|-----------------|
| Tables | Horizontal scroll with shadow hint |
| Card carousels | Horizontal scroll with dots |
| Long text | Truncate with ellipsis OR wrap |

### Vertical Overflow

| Component | Behavior |
|-----------|----------|
| Dropdown menus | Max height with scroll |
| Mobile menu | Full height, internal scroll |
| Accordion content | Auto height, smooth animation |

---

## 16. ANIMATION ADJUSTMENTS

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Mobile vs Desktop

| Animation | Mobile | Desktop |
|-----------|--------|---------|
| Hover effects | None (tap only) | Enabled |
| Scroll animations | Minimal | Standard |
| Page transitions | Fast (200ms) | Standard (300ms) |

---

## 17. PRINT STYLES

### Print Behavior

```css
@media print {
  .header, .footer, .sticky-bar, .whatsapp-fab { display: none; }
  .hero { min-height: auto; }
  .container { max-width: 100%; }
  * { background: white !important; color: black !important; }
}
```

---

## 18. TESTING CHECKLIST

### Required Device Tests

| Device | Width | Priority |
|--------|-------|----------|
| iPhone SE | 375px | High |
| iPhone 12/13 | 390px | High |
| Android (typical) | 360px | High |
| iPad Mini | 768px | Medium |
| iPad Pro | 1024px | Medium |
| MacBook | 1440px | Medium |
| External Monitor | 1920px | Low |

### Key Testing Points

1. **Navigation:** Hamburger works, dropdowns accessible
2. **CTAs:** All buttons tappable, visible on all screens
3. **Forms:** Inputs don't zoom on iOS (min 16px font)
4. **Cards:** Readable, properly stacked
5. **Tables:** Scrollable or converted to cards
6. **Images:** Don't overflow, proper aspect ratios
7. **Text:** Readable without zooming
8. **Touch:** All targets 44px minimum

---

*End of Responsive Layout Rules*
