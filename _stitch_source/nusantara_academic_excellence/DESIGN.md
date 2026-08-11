---
name: Nusantara Academic Excellence
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#41474f'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#717880'
  outline-variant: '#c1c7d1'
  surface-tint: '#1b6299'
  primary: '#003e67'
  on-primary: '#ffffff'
  primary-container: '#00568c'
  on-primary-container: '#9acbff'
  inverse-primary: '#9acbff'
  secondary: '#7d5700'
  on-secondary: '#ffffff'
  secondary-container: '#fcb400'
  on-secondary-container: '#694900'
  tertiary: '#1e3f58'
  on-tertiary: '#ffffff'
  tertiary-container: '#375671'
  on-tertiary-container: '#abcaea'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e4ff'
  primary-fixed-dim: '#9acbff'
  on-primary-fixed: '#001d34'
  on-primary-fixed-variant: '#004a79'
  secondary-fixed: '#ffdeaa'
  secondary-fixed-dim: '#ffba2d'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5f4100'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#aacae9'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#2a4a64'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  heritage-navy: '#233D62'
  academic-gold: '#F8B500'
  surface-white: '#FFFFFF'
  text-main: '#222222'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for the prestigious Indonesian educational landscape. It balances "Wibawa" (authority and dignity) with accessibility. The visual language is structured and institutional, reflecting academic rigor, yet maintains a welcoming atmosphere through warm accents and generous whitespace.

The chosen style is **Corporate / Modern** with a focus on **Structured Card-Based Layouts**. It avoids unnecessary decorative elements, favoring clear information architecture, high-contrast readability, and professional elegance. The aesthetic draws from modern Indonesian civic design—clean, organized, and patriotic without being overly traditional.

## Colors

The palette is anchored by **Heritage Navy**, a color synonymous with professional integrity and academic depth in Indonesia. **Academic Gold** is used sparingly as a high-impact accent to highlight excellence, achievements, and call-to-action elements.

- **Primary:** A deep, reliable blue used for headers, primary buttons, and institutional branding.
- **Secondary:** A vibrant gold for highlights, badges, and interactive states.
- **Tertiary:** A darker navy shade used for deep footers and text-heavy overlays.
- **Neutral:** A range of soft grays and crisp whites to ensure a "clean school" feel.

Color application should follow a 60-30-10 distribution: 60% white/neutral space, 30% navy structure, and 10% gold accents.

## Typography

This design system utilizes a high-contrast typographic pairing to establish a clear hierarchy:

1.  **Headings (Source Serif 4):** A professional, sturdy serif that conveys the authority of a long-standing educational institution. It provides a "literary" feel appropriate for news, academic programs, and school history.
2.  **Body & UI (Inter):** A neutral, highly legible sans-serif used for all functional text, navigation, and long-form content. 

**Usage Guidelines:**
- Use `display-lg` exclusively for hero sections.
- `label-lg` should be used for category tags (e.g., "PENGUMUMAN", "BERITA") and should always be in uppercase with increased letter spacing for a refined look.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain a formal, organized structure. 

- **Desktop (1280px+):** A 12-column grid with 24px gutters. Content is centered with wide margins to create a focused reading experience.
- **Tablet (768px - 1024px):** Shifts to an 8-column grid. Sidebars typically collapse below the main content.
- **Mobile (< 768px):** A 4-column grid with 16px margins. 

**Spacing Rhythm:** Use a base-8 scale. Content blocks (cards) should be separated by `stack-lg` (32px) to ensure the UI feels "airy" and not cramped.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

1.  **Level 0 (Surface):** The main background uses `#F8F9FA`.
2.  **Level 1 (Cards):** Primary content containers are `#FFFFFF` with a 1px border of `rgba(0, 86, 140, 0.1)` (Primary color at 10% opacity).
3.  **Level 2 (Interactive):** On hover, cards transition to a subtle ambient shadow (0px 4px 20px rgba(0, 0, 0, 0.05)) to indicate interactivity.
4.  **Floating Elements:** Modals and dropdowns use a crisp 1px border and a medium-diffused shadow to separate them from the content plane.

## Shapes

The design system uses **Soft (0.25rem)** roundedness. This subtle rounding softens the institutional feel enough to be welcoming to students and parents, while remaining sharp enough to look professional and disciplined.

- **Standard Elements:** Buttons, input fields, and tags use 0.25rem (4px).
- **Cards:** Large containers use `rounded-lg` (0.5rem / 8px) to create a clear visual distinction for grouped content.
- **Media:** Student photos and news thumbnails follow the card roundedness.

## Components

### Buttons
- **Primary:** Solid Heritage Navy (`#233D62`) with white text. High emphasis.
- **Secondary:** Solid Academic Gold (`#FFB606`) with `#222222` text. Used for CTAs like "Daftar Sekarang."
- **Ghost:** Transparent background with a navy border. Used for secondary navigation.

### Cards
Cards are the primary vehicle for information. Every card must have a consistent 1px border and 24px internal padding. News cards should feature a top-aligned image with a category badge overlaying the bottom-left of the image.

### Navigation
The header is split into two tiers:
1.  **Top Bar (Navy):** Links for "Alumni," "Portal Guru," and "Kontak."
2.  **Main Nav (White):** School logo and primary links (Profil, Akademik, Kesiswaan). Uses a simple underline on hover in Academic Gold.

### Input Fields
Inputs use a white background with a 1px gray border. On focus, the border changes to Primary Navy with a subtle 2px outer glow of the same color at 10% opacity.

### Chips/Badges
Used for status or categories. Use `label-sm` typography. Backgrounds should be low-saturation tints of the category color (e.g., a light blue tint for "Academic") to keep the UI clean.