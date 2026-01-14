# WebWaka Design System — High-Fidelity Page Designs

**Version:** 1.0  
**Scope:** Marketing Website (Partner-Facing)  
**Status:** Design Specification (Ready for Implementation)  

---

## DESIGN OVERVIEW

This document provides detailed specifications for implementing the marketing website pages. Each page section includes:
- Content structure (from Phase M2)
- Visual specifications (colors, typography, spacing)
- Component usage (from Component Library)
- Responsive behavior (from Responsive Rules)

---

## 1. HOMEPAGE

### 1.1 Header (All Pages)

**Mobile:**
```
Height: 64px
Background: White
Shadow: shadow-sm
Border-bottom: 1px Gray 300

Logo: Left, 32px height, 16px from edge
Hamburger: Right, 24px, 16px from edge
```

**Desktop:**
```
Height: 72px
Background: White
Shadow: shadow-sm

Logo: Left, 40px height, 32px from edge
Nav: Center, 16px gap between items
  Font: 16px, Gray 700, hover: Waka Green
  Active: Waka Green, 2px underline
CTAs: Right
  WhatsApp: Ghost button with icon
  Become Partner: Primary button
```

### 1.2 Hero Section

**Visual Specs:**
```
Background: Linear gradient
  From: White
  To: Gray 100 (subtle)
  Or: Subtle pattern overlay

Mobile:
  Padding: 48px 16px
  Min-height: calc(100vh - 64px)
  
Desktop:
  Padding: 96px 32px
  Min-height: 80vh
  Max-height: 700px
```

**Badge:**
```
Component: NEW Badge variant
Text: "Partner Platform"
Background: Waka Green Light/10%
Border: 1px Waka Green
Text: Waka Green
Padding: 8px 16px
Border-radius: radius-full
Margin-bottom: 24px
```

**Headline:**
```
Font: Display size
  Mobile: 32px, bold
  Desktop: 48px, bold
Color: Gray 900
Max-width: 800px
Margin-bottom: 16px
```

**Subheadline:**
```
Font: Body Large
  Mobile: 18px
  Desktop: 20px
Color: Gray 700
Max-width: 600px
Margin-bottom: 32px
```

**CTAs:**
```
Mobile: Stacked, full width, 12px gap
Desktop: Inline, auto width, 16px gap

Primary: "Become a Partner"
  Size: Large
  Icon: ArrowRight (right)
  
Secondary: "See It Working"
  Variant: Secondary
  Size: Large
  Icon: Play (left)
```

### 1.3 Partner Model Section

**Visual Specs:**
```
Background: White
Padding: 64px 16px (mobile), 96px 32px (desktop)
```

**Section Header:**
```
Badge: "YOU BUILD THE BUSINESS"
  Background: Gray 100
  Text: Gray 700, 12px, weight 600, uppercase, letter-spacing 1px
  Margin-bottom: 16px
  
Heading: "We Provide the Platform"
  Font: H2 size
  Color: Gray 900
  Margin-bottom: 24px
  
Body: Paragraph text
  Font: Body
  Color: Gray 700
  Max-width: 65ch
  Margin-bottom: 40px
```

**Responsibility Cards:**
```
Layout: 
  Mobile: Stacked, full width
  Desktop: 2 columns, 24px gap

Card Style:
  Background: Gray 100
  Border: None
  Border-radius: 12px
  Padding: 24px
  
Card Header:
  Font: H4
  Color: Gray 900
  Margin-bottom: 16px
  
List Items:
  Icon: Checkmark, Waka Green, 16px
  Text: Body, Gray 700
  Gap: 8px between icon and text
  Margin: 12px between items
```

### 1.4 Stats Section

**Visual Specs:**
```
Background: Waka Green
Padding: 48px 16px (mobile), 64px 32px (desktop)
```

**Stats Grid:**
```
Layout:
  Mobile: 2x2 grid, 16px gap
  Desktop: 4 columns, 24px gap

Stat Card:
  Background: White/10%
  Border-radius: 8px
  Padding: 24px
  Text-align: Center
  
Number:
  Font: Display
  Color: White
  Margin-bottom: 4px
  
Label:
  Font: Body Small
  Color: White/80%
```

**Stats Content:**
- 20+ | Industry Suites
- 300+ | Built-in Capabilities
- 16 | Demo Businesses
- ₦0 | Development Cost

### 1.5 Suite Categories Section

**Visual Specs:**
```
Background: White
Padding: 64px 16px (mobile), 96px 32px (desktop)
```

**Section Header:**
```
Badge: "ONE PLATFORM. EVERY INDUSTRY."
Heading: None (badge is heading)
Body: None
```

**Mobile: Accordion**
```
Each accordion item:
  Header: 
    Background: Gray 100
    Padding: 16px
    Border-radius: 8px (closed), 8px 8px 0 0 (open)
    Font: H4
    Icon: ChevronDown, rotates on open
    
  Content:
    Background: White
    Border: 1px Gray 300
    Border-top: None
    Border-radius: 0 0 8px 8px
    Padding: 16px
    
  List items:
    Icon: Dot, 8px, category color
    Text: Body, Gray 700
    Margin: 8px between items
```

**Desktop: Grid**
```
Layout: 4 columns, 24px gap

Category Card:
  Background: White
  Border: 1px Gray 300
  Border-radius: 12px
  Padding: 24px
  
  Header:
    Icon: Category icon, 32px, category color
    Title: H4, Gray 900
    Margin-bottom: 16px
    
  List:
    Max 5 items visible
    "+ X more" link at bottom
    
  Hover:
    Border-color: Waka Green
    Shadow: shadow-md
```

### 1.6 Sites & Funnels Highlight

**Visual Specs:**
```
Background: Gray 100
Padding: 64px 16px (mobile), 96px 32px (desktop)
Border-radius: 0 (full width)
```

**Content:**
```
Badge: "NEW" (Naira Gold variant)
Heading: H2, "Build Websites and Funnels for Your Clients"
Body: Body text
Feature list: Checkmark list
CTA: Secondary button, "Learn About Sites & Funnels"
```

### 1.7 Nigeria-First Section

**Visual Specs:**
```
Background: White
Padding: 64px 16px (mobile), 96px 32px (desktop)
```

**Layout:**
```
Mobile: Stacked features
Desktop: Icon grid (2 columns) or left icon list
```

**Feature Items:**
```
Icon: 32px, Waka Green
Title: H4, Gray 900
Description: Body, Gray 700
Gap: 24px between items
```

### 1.8 Partner Profiles Section

**Visual Specs:**
```
Background: Gray 100
Padding: 64px 16px (mobile), 96px 32px (desktop)
```

**Layout:**
```
Mobile: Horizontal scroll carousel with dots
Desktop: 4-column grid
```

**Profile Card:**
```
Background: White
Border-radius: 12px
Padding: 24px
Shadow: shadow-sm

Icon: 48px, category color
Title: H4, Gray 900
Description: Body, Gray 700
```

### 1.9 CTA Section

**Visual Specs:**
```
Background: Waka Green
Padding: 64px 16px (mobile), 96px 32px (desktop)
Text-align: Center
```

**Content:**
```
Heading: H2, White, "Ready to Build Your Platform Business?"
Body: Body Large, White/90%
CTAs: Stacked on mobile, inline on desktop
  Primary: White background, Waka Green text
  Secondary: Transparent, White border, White text
```

### 1.10 Footer

**Visual Specs:**
```
Background: Gray 900
Padding: 48px 16px (mobile), 64px 32px (desktop)
Color: White
```

**Layout:**
```
Mobile:
  Logo: Centered, margin-bottom 32px
  Sections: Accordion (collapsed)
  Contact: Centered, stacked
  Copyright: Centered
  
Desktop:
  Logo: Left column
  Link columns: 3 columns
  Contact: Below columns or right side
  Copyright: Full width, bottom
```

**Links:**
```
Font: Body Small
Color: Gray 300
Hover: White
Gap: 12px between items
```

---

## 2. SUITES OVERVIEW PAGE

### 2.1 Hero

**Visual Specs:**
```
Background: White
Padding: 48px 16px (mobile), 80px 32px (desktop)
Min-height: Auto (not full viewport)
```

**Content:**
```
Heading: H1, "20+ Industry Suites. One Platform."
Subheadline: Body Large
CTA: Primary button, "Enter Demo Portal"
```

### 2.2 Introduction Section

**Content:**
```
Heading: H2, "Why So Many Suites?"
Body: 2-3 paragraphs explaining the approach
No CTAs
```

### 2.3 Category Filter

**Visual Specs:**
```
Position: Sticky below header on scroll
Background: White
Border-bottom: 1px Gray 300
Padding: 12px 16px
Z-index: 100
```

**Tabs:**
```
Mobile: Horizontal scroll, pill buttons
Desktop: Centered, inline pills

Active Tab:
  Background: Waka Green
  Text: White
  
Inactive Tab:
  Background: Gray 100
  Text: Gray 700
  Hover: Gray 200
```

### 2.4 Suite Listing

**Layout:**
```
Mobile: 1 column
Tablet: 2 columns
Desktop: 3 columns
Gap: 24px
```

**Suite Card:** (Use component from library)
```
Category badge (top)
Icon (24px)
Suite name (H4)
Description (Body, 3 lines max)
Demo strength badge
CTA link: "Explore Demo →"
```

### 2.5 Category Headers

**Between suite groups:**
```
Heading: H2, category name
Count: "(X suites)"
Margin: 48px top, 24px bottom
```

---

## 3. SITES & FUNNELS PAGE

### 3.1 Hero

**Visual Specs:**
```
Background: Gradient (Waka Green to Waka Green Dark)
Color: White
Padding: 64px 16px (mobile), 96px 32px (desktop)
```

**Badge:**
```
Text: "PARTNER GROWTH ENGINE"
Background: White/20%
Border: 1px White/40%
```

**Content:**
```
Heading: H1, White
Subheadline: Body Large, White/90%
CTA: White background, Waka Green text
```

### 3.2 Old Way vs New Way

**Layout:**
```
Mobile: Stacked cards
Desktop: 2 columns
```

**Cards:**
```
Old Way:
  Background: Gray 100
  Icon: X mark, Error color
  
New Way:
  Background: Waka Green Light/10%
  Border: 1px Waka Green
  Icon: Checkmark, Waka Green
```

### 3.3 Capabilities Section

**Layout:**
```
Mobile: Accordion
Desktop: Tabs or 3-column cards
```

**Categories:**
- Complete Websites
- Conversion Funnels
- Industry Templates

### 3.4 AI Content Section

**Visual Specs:**
```
Background: Gray 100
Padding: 64px 16px (mobile), 96px 32px (desktop)
```

**Numbered Steps:**
```
Number:
  Circle, 32px, Waka Green
  White text, weight 700
  
Step:
  Title: H4
  Description: Body
  Gap: 16px between steps
```

### 3.5 Integration Table

**Visual Specs:**
```
Mobile: Stacked cards (one per integration)
Desktop: Table with alternating row colors
```

**Table Styling:**
```
Header: Gray 100 background, Gray 700 text
Rows: Alternating White / Gray 50
Border: 1px Gray 300
```

### 3.6 Comparison Section

**Visual Specs:**
```
Mobile: Horizontal scroll or stacked cards
Desktop: Full table visible
```

**Comparison Table:**
```
Feature column: Left-aligned
Competitor columns: Center-aligned
Checkmarks: Waka Green
X marks: Gray 300
```

### 3.7 Revenue Model Section

**Cards:**
```
Setup Fees card
Monthly Maintenance card
The Math card (highlighted with Naira Gold border)
```

---

## 4. PARTNER PROGRAM PAGE

### 4.1 Hero

**Visual Specs:**
```
Background: White
Padding: 64px 16px (mobile), 96px 32px (desktop)
```

**Two CTAs:**
- Primary: "Apply to Partner"
- Text link: "Have Questions? Chat on WhatsApp"

### 4.2 What Is a Partner Section

**Quote/Highlight:**
```
"We Don't Sell Software. We Enable Partners."
Font: H2
Color: Waka Green
Margin-bottom: 24px
```

**Bullet List:**
```
Icon: Checkmark, Waka Green
Text: Body
```

### 4.3 Responsibilities Section

**Two-column comparison:**
```
Your Role | WebWaka's Role
Table or side-by-side cards
```

**Highlight Box:**
```
Background: Waka Green Light/10%
Border-left: 4px Waka Green
Padding: 16px
Text: "We never contact your clients directly."
Font: Body, italic
```

### 4.4 Revenue Section

**Accordion for details, summary cards:**
```
Setup Fees
Monthly Fees
Sites & Funnels
Add-On Services
```

**Example Revenue Box:**
```
Background: Naira Gold/10%
Border: 1px Naira Gold
Padding: 24px
Font: Numbers in Display size
```

### 4.5 Partner Profiles Carousel

**Mobile:**
```
Horizontal scroll
Dot indicators below
Swipe hint on first visit
```

**Desktop:**
```
Grid layout, all visible
Hover effect on cards
```

### 4.6 Not For Section

**Visual Specs:**
```
Background: Gray 100
Padding: 32px
```

**List:**
```
Icon: X mark, Error color
Text: Body, Gray 700
```

### 4.7 Onboarding Steps

**Timeline/Stepper:**
```
Numbers: 1-5 in circles
Lines connecting circles
Step titles: H4
Step descriptions: Body
```

### 4.8 FAQ Accordion

**Component:** Standard FAQ accordion from library
**Styling:** All collapsed by default

---

## 5. DEMO PORTAL PAGE

### 5.1 Hero

**Visual Specs:**
```
Background: White
Padding: 48px 16px (mobile), 64px 32px (desktop)
Min-height: Auto
```

**Content:**
```
Heading: H1, "See WebWaka Working. No Signup Required."
Subheadline: Body Large
CTA: Primary button with down arrow, "Choose a Demo ↓"
  Scroll to demo selector on click
```

### 5.2 Demo Mode Notice

**Alert Box:**
```
Background: Naira Gold/10%
Border: 1px Naira Gold
Border-radius: 8px
Padding: 16px
Icon: AlertTriangle, Naira Gold
Text: Body
```

**CTA:** Text link to request guided walkthrough

### 5.3 Industry Filter

**Same as Suites Overview filter:**
- Commerce
- Service
- Community
- Operations

### 5.4 Demo Cards

**Layout:**
```
Mobile: 1 column
Tablet: 2 columns
Desktop: 3 columns
Gap: 24px
```

**Demo Tenant Card:**
```
Industry badge (top-left)
Business name (H4)
Slug (Body Small, Gray 500, mono font)
Key stats (Body Small)
CTA: Primary button, "Enter Demo"
Secondary: Text link, "Learn More"
```

### 5.5 Quick Start Table

**Mobile:**
```
Stacked cards with role → demo mapping
```

**Desktop:**
```
2-column table
Left: "I'm a..."
Right: "Go to..."
Clickable rows
```

### 5.6 Guided Walkthrough CTA

**Full-width CTA section:**
```
Background: Waka Green
Text: White
CTA: White button
```

### 5.7 What's Next Section

**Two cards:**
```
Partnership path card
Business owner path card
Each with distinct CTA
```

---

## 6. INDIVIDUAL SUITE PAGE TEMPLATE

### 6.1 Header Area

```
Breadcrumb: Suites > Category > Suite Name
Category badge
Suite name (H1)
Short description
Demo strength badge
Two CTAs: Enter Demo | Become Partner
```

### 6.2 Overview Section

```
Full suite description
2-3 paragraphs
No images required
```

### 6.3 Capabilities List

```
Checkmark list
Group into categories if 8+ items
```

### 6.4 Best For Section

```
Industry/business type tags
Pill badges
```

### 6.5 Demo Preview

```
Demo tenant card
Key data stats
Enter Demo CTA
```

### 6.6 Related Suites

```
Horizontal scroll of related suite cards
3-4 related suites
```

---

## IMPLEMENTATION NOTES

### CSS Framework
Recommend: **Tailwind CSS** with custom design tokens

### Component Library
Recommend: Build on **Radix UI** primitives (already in project)

### Font Loading
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Icon Library
Recommend: **Lucide React** (already in project)

### Animation Library
Recommend: **Framer Motion** for page transitions and micro-interactions

### Image Optimization
Use **Next.js Image** component with:
- Format: WebP with PNG fallback
- Lazy loading: Below fold images
- Priority: Hero images

---

*End of High-Fidelity Page Designs*
