# WebWaka Design System — Component Library

**Version:** 1.0  
**Scope:** Marketing Website (Partner-Facing)  
**Design Principles:** Mobile-First | Nigeria-First | Partner-First  

---

## 1. BUTTONS

### Button Variants

#### Primary Button
```
Background: Waka Green (#059669)
Text: White (#FFFFFF)
Border: None
Hover: Waka Green Dark (#047857)
Active: Waka Green Dark + transform scale(0.98)
Focus: 2px ring, Waka Green, 2px offset
```

**Usage:** Primary CTAs (Become a Partner, Book Demo, Enter Demo)

#### Secondary Button
```
Background: Transparent
Text: Waka Green (#059669)
Border: 2px solid Waka Green
Hover: Background Waka Green Light/10%, Border Waka Green Dark
Active: transform scale(0.98)
Focus: 2px ring, Waka Green, 2px offset
```

**Usage:** Secondary actions, alternative paths

#### Ghost Button
```
Background: Transparent
Text: Gray 700 (#374151)
Border: None
Hover: Background Gray 100
Active: transform scale(0.98)
Focus: 2px ring, Gray 500, 2px offset
```

**Usage:** Tertiary actions, navigation items

#### WhatsApp Button
```
Background: #25D366 (WhatsApp Green)
Text: White
Border: None
Icon: WhatsApp icon (left)
Hover: #20BD5A (darker)
```

**Usage:** WhatsApp CTAs throughout

### Button Sizes

| Size | Height | Padding | Font Size | Icon Size |
|------|--------|---------|-----------|-----------|
| Small | 36px | 8px 16px | 14px | 16px |
| Medium | 44px | 12px 24px | 16px | 20px |
| Large | 52px | 16px 32px | 18px | 24px |

### Button States
```
:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:loading {
  opacity: 0.7;
  cursor: wait;
  /* spinner icon */
}
```

### Button with Icon
- Icon left: 8px gap between icon and text
- Icon right: 8px gap between text and icon
- Icon size: match button size category

---

## 2. CARDS

### Suite Card

```
┌─────────────────────────────┐
│  [Category Badge]           │
│                             │
│  ▣ Suite Icon               │
│                             │
│  Suite Name (H4)            │
│  Short description text     │
│  spanning 2-3 lines max.    │
│                             │
│  [Demo Strength Badge]      │
│                             │
│  [Explore Demo →]           │
└─────────────────────────────┘

Dimensions:
- Mobile: 100% width, auto height
- Desktop: 320px width, auto height

Styling:
- Background: White
- Border: 1px Gray 300
- Border Radius: 12px
- Padding: 24px
- Shadow: shadow-sm, hover: shadow-md
- Hover: border-color Waka Green Light
```

### Feature Card

```
┌─────────────────────────────┐
│  ▣ Feature Icon (32px)      │
│                             │
│  Feature Title (H4)         │
│  Description text that      │
│  explains the feature.      │
└─────────────────────────────┘

Styling:
- Background: Gray 100
- Border: None
- Border Radius: 8px
- Padding: 20px
- No shadow
```

### Demo Tenant Card

```
┌─────────────────────────────┐
│  [Industry Badge]           │
│                             │
│  Business Name (H4)         │
│  demo-slug                  │
│                             │
│  Key data: X products,      │
│  Y transactions, etc.       │
│                             │
│  [Enter Demo]  [Learn More] │
└─────────────────────────────┘

Styling:
- Background: White
- Border: 1px Gray 300
- Border Radius: 12px
- Padding: 20px
- Hover: shadow-md
```

### Stats Card

```
┌─────────────────────────────┐
│         20+                 │
│      Industry               │
│       Suites                │
└─────────────────────────────┘

Styling:
- Background: Gray 100 or White
- Border Radius: 8px
- Padding: 24px
- Text: Number (Display), Label (Body Small)
- Number color: Waka Green
```

### Comparison Card

```
┌─────────────────────────────┐
│  Without WebWaka            │
│  ─────────────────          │
│  • Build from scratch       │
│  • Hire developers          │
│  • 6-12 months              │
└─────────────────────────────┘

Styling:
- Background: Gray 100 (negative) or Waka Green Light/10% (positive)
- Border Radius: 8px
- Padding: 20px
- List items with checkmarks (positive) or X marks (negative)
```

---

## 3. NAVIGATION

### Mobile Navigation

```
┌──────────────────────────────────────┐
│  [Logo]                    [☰ Menu]  │
└──────────────────────────────────────┘

Menu Overlay:
┌──────────────────────────────────────┐
│                              [✕]     │
│                                      │
│  Home                                │
│  ─────────────────────               │
│  Suites                    [▼]       │
│  Sites & Funnels                     │
│  Partner Program                     │
│  Demo Portal                         │
│                                      │
│  ─────────────────────               │
│  [Become a Partner]                  │
│  [WhatsApp]                          │
└──────────────────────────────────────┘
```

**Specs:**
- Header height: 64px
- Logo height: 32px
- Hamburger: 24px icon
- Menu overlay: Full screen, slide from right
- Transition: 300ms ease-out
- Background: White
- Backdrop: Black/50%

### Desktop Navigation

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo]   Home  Suites▼  Sites  Partners  Demo  │ [WhatsApp] [Become Partner] │
└────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Header height: 72px
- Logo height: 40px
- Nav items: 16px, Gray 700, hover Waka Green
- Active: Waka Green, underline
- Dropdown: Shadow-lg, 8px radius, max-height 400px

### Suites Dropdown (Desktop)

```
┌─────────────────────────────────────────────┐
│  Commerce        │  Service                 │
│  ────────        │  ────────                │
│  • POS           │  • Education             │
│  • Storefront    │  • Health                │
│  • Marketplace   │  • Legal                 │
│  • Hospitality   │  • Recruitment           │
│  • Logistics     │  • Real Estate           │
│                  │                          │
│  Community       │  Operations              │
│  ────────        │  ────────                │
│  • Church        │  • Projects              │
│  • Political     │  • HR                    │
│  • Civic         │  • Warehouse             │
│                  │  • Procurement           │
│                  │                          │
│  [View All Suites →]                        │
└─────────────────────────────────────────────┘
```

### Sticky Bottom Bar (Mobile)

```
┌──────────────────────────────────────┐
│  [Enter Demo]    [Become Partner]    │
└──────────────────────────────────────┘
```

**Specs:**
- Height: 72px (includes safe area)
- Background: White
- Border-top: 1px Gray 300
- Shadow: shadow-lg (inverted)
- Position: fixed bottom
- Only appears after scrolling past hero

---

## 4. BADGES

### Category Badge

```
┌─────────────┐
│  Commerce   │
└─────────────┘

Styling:
- Background: Category color (light)
- Text: Category color (dark)
- Border Radius: radius-full (pill)
- Padding: 4px 12px
- Font: Caption (12px), weight 500
```

**Category Colors:**
| Category | Background | Text |
|----------|------------|------|
| Commerce | `#DBEAFE` | `#1E40AF` |
| Service | `#E0E7FF` | `#3730A3` |
| Community | `#FCE7F3` | `#9D174D` |
| Operations | `#FEF3C7` | `#92400E` |

### Demo Strength Badge

```
Strong Demo:
┌────────────────┐
│  ✓ Strong Demo │
└────────────────┘
Background: #DCFCE7, Text: #166534

Medium Demo:
┌────────────────┐
│  ◐ Guided Demo │
└────────────────┘
Background: #FEF3C7, Text: #92400E

Mention Only:
┌────────────────┐
│  ○ Configurable│
└────────────────┘
Background: #F3F4F6, Text: #6B7280
```

### NEW Badge

```
┌─────┐
│ NEW │
└─────┘

Background: Naira Gold (#D97706)
Text: White
Border Radius: radius-sm
Padding: 2px 8px
Font: 10px, weight 700, uppercase
```

---

## 5. FORM ELEMENTS

### Text Input

```
┌──────────────────────────────────────┐
│  placeholder text                    │
└──────────────────────────────────────┘

Styling:
- Height: 48px
- Border: 1px Gray 300
- Border Radius: 8px
- Padding: 12px 16px
- Font: 16px (prevents iOS zoom)
- Focus: 2px ring Waka Green
- Error: Border Error color, error message below
```

### Select Dropdown

```
┌──────────────────────────────────────┐
│  Select an option               [▼] │
└──────────────────────────────────────┘

Same styling as Text Input
Dropdown: Native on mobile, custom on desktop
```

### Textarea

```
┌──────────────────────────────────────┐
│                                      │
│  Message text...                     │
│                                      │
└──────────────────────────────────────┘

Styling:
- Min height: 120px
- Resize: vertical only
- Other styles same as Text Input
```

---

## 6. LISTS

### Feature List (Checkmarks)

```
✓ Nigerian payment methods built-in
✓ Works offline when connectivity is poor
✓ Naira-native pricing and invoicing
✓ Mobile-first design throughout
```

**Styling:**
- Icon: Checkmark in Waka Green
- Gap: 12px between icon and text
- Line spacing: 8px between items

### Comparison List

```
✓ With WebWaka        ✗ Without WebWaka
  Deploy in days        6-12 months
  No dev team           Hire developers
  300+ features         Build from scratch
```

**Styling:**
- Positive: Checkmark green
- Negative: X mark red/gray
- Two-column layout on desktop
- Stacked on mobile

---

## 7. SECTIONS

### Hero Section

```
┌──────────────────────────────────────┐
│                                      │
│      [Badge: Partner Platform]       │
│                                      │
│      Hero Headline Text              │
│      Spanning Multiple Lines         │
│                                      │
│      Supporting subheadline text     │
│      that explains the value.        │
│                                      │
│      [Primary CTA]  [Secondary CTA]  │
│                                      │
└──────────────────────────────────────┘

Mobile:
- Full viewport height (100vh - header)
- Centered content
- Stacked CTAs
- Background: Subtle gradient or solid

Desktop:
- 80vh height
- Left-aligned or centered
- Inline CTAs
- Optional right-side graphic
```

### Section Header

```
      [Badge: Optional]
      
      Section Heading (H2)
      
      Supporting text that provides
      context for the section content.
```

**Styling:**
- Centered alignment
- Max width: 600px
- Margin bottom: 40px (mobile), 64px (desktop)

### CTA Section

```
┌──────────────────────────────────────┐
│                                      │
│      Ready to Get Started?           │
│                                      │
│      Short compelling message.       │
│                                      │
│      [Primary CTA]                   │
│      [Secondary CTA]                 │
│                                      │
└──────────────────────────────────────┘

Background: Gray 100 or Waka Green
Text: Appropriate contrast
Padding: 64px (mobile), 96px (desktop)
Border Radius: 0 or 16px if contained
```

---

## 8. ACCORDION

### FAQ Accordion

```
┌──────────────────────────────────────┐
│  How much does it cost?         [+]  │
└──────────────────────────────────────┘

Expanded:
┌──────────────────────────────────────┐
│  How much does it cost?         [−]  │
├──────────────────────────────────────┤
│  Answer text that can span multiple  │
│  lines and include various content.  │
└──────────────────────────────────────┘

Styling:
- Border: 1px Gray 300
- Border Radius: 8px
- Margin between items: 8px
- Header padding: 16px
- Content padding: 16px
- Animation: 200ms height transition
```

### Suite Category Accordion (Mobile)

```
┌──────────────────────────────────────┐
│  ▼ Commerce Suites (5)               │
├──────────────────────────────────────┤
│  • POS                               │
│  • Storefront                        │
│  • Marketplace                       │
│  • Hospitality                       │
│  • Logistics                         │
└──────────────────────────────────────┘

First category expanded by default
Others collapsed
```

---

## 9. FOOTER

### Footer Layout

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [Logo]                                                      │
│                                                              │
│  Platform        Partners         Company                    │
│  ─────────       ─────────        ─────────                  │
│  Why WebWaka     Partner Program  About Us                   │
│  All Suites      Become Partner   Contact                    │
│  Sites & Funnels Resources        Privacy                    │
│  Demo Portal     Success Stories  Terms                      │
│                                                              │
│  ─────────────────────────────────────────────────────       │
│                                                              │
│  WhatsApp: [number]  |  Email: partners@webwaka.com          │
│                                                              │
│  © 2026 HandyLife Digital. Built in Lagos.                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Mobile:
- Single column
- Collapsible sections
- Stacked contact info

Desktop:
- 3-4 columns
- All links visible
- Inline contact info
```

---

## 10. WHATSAPP FLOATING BUTTON

```
     ┌───────┐
     │  💬   │
     └───────┘

Position: Fixed, bottom-right
Offset: 24px from edges
Size: 56px circle
Background: WhatsApp Green (#25D366)
Icon: WhatsApp logo, white, 28px
Shadow: shadow-lg
Hover: scale(1.1)
Z-index: 1000

Mobile: Always visible
Desktop: Always visible
```

---

## 11. DEMO MODE INDICATOR

```
┌──────────────────────────────────────┐
│  ⚠ DEMO MODE — This is sample data   │
└──────────────────────────────────────┘

Position: Fixed top or bottom
Background: Naira Gold (#D97706)
Text: White
Height: 40px
Z-index: 1001
Full width
Center aligned
```

---

## 12. LOADING STATES

### Skeleton Loading

```
┌──────────────────────────────────────┐
│  ████████████████████                │
│  ████████████                        │
│  ████████████████████████████        │
└──────────────────────────────────────┘

Color: Gray 200 with shimmer animation
Border Radius: 4px
Animation: 1.5s ease-in-out infinite
```

### Button Loading

```
┌──────────────────────────────────────┐
│  [●] Loading...                      │
└──────────────────────────────────────┘

Spinner: 16px, white
Text: Unchanged or "Loading..."
Disabled state applied
```

---

*End of Component Library*
