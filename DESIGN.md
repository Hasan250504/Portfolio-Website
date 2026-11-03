---
version: alpha
name: Colonia Zacamil
description: "Design system extracted from https://coloniazacamil.com/#our-voice"
colors:
  text-primary: "#ebe6e0"
  text-secondary: "#ffffff"
  surface-base: "#000000"
typography:
  xs:
    fontFamily: Roboto Mono
    fontSize: 10px
    fontWeight: 400
    lineHeight: 1.5
  sm:
    fontFamily: Roboto Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  md:
    fontFamily: Roboto Mono
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  lg:
    fontFamily: Roboto Mono
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  xl:
    fontFamily: Roboto Mono
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
  2xl:
    fontFamily: Roboto Mono
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.5
  3xl:
    fontFamily: Roboto Mono
    fontSize: 150px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: 30px
spacing:
  1: 23px
  2: 37px
  3: 42px
components:
  button-primary:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.text-primary}"
    rounded: 8px
    padding: 12px
---

# Colonia Zacamil

## Mission
Create implementation-ready, token-driven UI guidance for Colonia Zacamil that is optimized for consistency, accessibility, and fast delivery across e-commerce storefront.

## Brand
- Product/brand: Colonia Zacamil
- URL: https://coloniazacamil.com/#our-voice
- Audience: online shoppers and consumers
- Product surface: e-commerce storefront

## Style Foundations
- Visual style: minimal, utility-first, accessibility-prioritized
- Main font style: `font.family.primary=Roboto Mono`, `font.family.stack=Roboto Mono`, `font.size.base=10px`, `font.weight.base=400`, `font.lineHeight.base=normal`
- Typography scale: `font.size.xs=10px`, `font.size.sm=12px`, `font.size.md=14px`, `font.size.lg=16px`, `font.size.xl=18px`, `font.size.2xl=32px`, `font.size.3xl=150px`
- Color palette: `color.text.primary=#ebe6e0`, `color.text.secondary=#ffffff`, `color.surface.base=#000000`
- Spacing scale: `space.1=23px`, `space.2=37px`, `space.3=42px`
- Radius/shadow/motion tokens: `radius.xs=30px` | `motion.duration.instant=500ms`

## Overview

A minimal, utility-first, accessibility-prioritized interface designed for Colonia Zacamil.

**Target Audience:** online shoppers and consumers

**Product Surface:** e-commerce storefront

This design system prioritizes accessibility, consistency, and implementation efficiency. All components follow WCAG 2.2 AA standards with keyboard-first interactions and clear focus indicators.

## Colors

The color palette is organized into semantic categories for consistent application across the interface.

**Text Colors:**
- **text.primary** (`#ebe6e0`): Primary text and headlines
- **text.secondary** (`#ffffff`): Secondary text and captions

**Surface Colors:**
- **surface.base** (`#000000`): Base background surface

## Typography

**Primary Font:** Roboto Mono

The typography scale provides a consistent hierarchy for all text elements.

- **xs** (`10px`): Weight 400, Line height 1.5
- **sm** (`12px`): Weight 400, Line height 1.5
- **md** (`14px`): Weight 400, Line height 1.5
- **lg** (`16px`): Weight 400, Line height 1.5
- **xl** (`18px`): Weight 400, Line height 1.5
- **2xl** (`32px`): Weight 400, Line height 1.5
- **3xl** (`150px`): Weight 400, Line height 1.5


## Layout

The layout system uses a consistent spacing scale for margins, padding, and gaps.

**Spacing Scale:**
- **1:** 23px
- **2:** 37px
- **3:** 42px

**Grid System:** Use a responsive grid with consistent gutters and margins. Mobile layouts should stack vertically with appropriate spacing.

## Elevation & Depth

Elevation is achieved through subtle shadows and tonal layers.

**Recommended approach:**
- Use minimal shadows for depth
- Prefer tonal backgrounds over heavy shadows
- Maintain clear visual hierarchy through layering

## Shapes

All interactive elements use consistent corner radii:

- **xs:** 30px - Corner radius token


## Components

**Detected Components:** buttons (8), links (1), lists (1)

### Component Guidelines

**Buttons:**
- Use primary style for main actions
- Secondary style for alternative actions
- Maintain minimum 44×44px touch target
- Include default, hover, focus-visible, active, disabled, loading, and error states

**Inputs:**
- Clear focus indicators required
- Label positioning must be consistent
- Error states with descriptive messages
- Support for keyboard navigation

**Cards:**
- Consistent padding and spacing
- Optional elevation for hierarchy
- Responsive behavior for different viewports

All components must define:
- Default, hover, focus-visible, active, disabled, loading, and error states
- Keyboard interaction patterns
- Touch target sizes (minimum 44×44px)
- Responsive behavior
- Accessibility requirements

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required
- Focus-visible rules required
- Contrast constraints required (4.5:1 for normal text, 3:1 for large text)
- Touch targets minimum 44×44px
- Screen reader compatibility with proper ARIA labels

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error
- Component behavior should specify responsive and edge-case handling
- Interactive components must document keyboard, pointer, and touch behavior
- Accessibility acceptance criteria must be testable in implementation
- Maintain WCAG AA contrast ratios
- Provide clear focus indicators for all interactive elements

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators
- Do not introduce one-off spacing or typography exceptions
- Do not use ambiguous labels or non-descriptive actions
- Do not ship component guidance without explicit state rules
- Do not mix different corner radius values in the same component
- Do not create touch targets smaller than 44×44px
- Do not use color alone to convey information

## Guideline Authoring Workflow
1. Restate design intent in one sentence
2. Define foundations and semantic tokens
3. Define component anatomy, variants, interactions, and state behavior
4. Add accessibility acceptance criteria with pass/fail checks
5. Add anti-patterns, migration notes, and edge-case handling
6. End with a QA checklist

## Required Output Structure
- Context and goals
- Design tokens and foundations (YAML front matter + descriptions)
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior
- Include spacing and typography token requirements
- Include long-content, overflow, and empty-state handling
- Include known page component density: buttons (8), links (1), lists (1)

- Extraction diagnostics: Low sample size: fewer than 30 visible elements were extracted. Limited color diversity detected; color token inference confidence is low. Audience and product surface inference confidence is low; verify generated brand context.

## Quality Gates
- Every non-negotiable rule must use "must"
- Every recommendation should use "should"
- Every accessibility rule must be testable in implementation
- Teams should prefer system consistency over local visual exceptions

---

**Extraction Metadata:**
- Source: https://coloniazacamil.com/#our-voice
- Extracted: 2026-10-02T08:21:31.539Z
- Elements sampled: 19 of 375
