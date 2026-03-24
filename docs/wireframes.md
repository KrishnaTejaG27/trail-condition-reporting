# Wireframes and UI Design

## Overview

This document outlines the wireframes and user interface design for the Trail Safety Platform. The design focuses on usability, accessibility, and mobile-first responsive design.

## Design Principles

1. **Mobile-First**: Primary use case will be mobile users in the field
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Intuitive Navigation**: Clear visual hierarchy and consistent patterns
4. **Real-time Updates**: Live data visualization
5. **Offline Capability**: Core functionality without internet

## Color Palette

```css
:root {
  /* Primary Colors */
  --primary-green: #10b981;    /* Emerald-500 */
  --primary-blue: #3b82f6;     /* Blue-500 */
  --primary-orange: #f97316;   /* Orange-500 */
  
  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Severity Colors */
  --severity-low: #10b981;
  --severity-medium: #f59e0b;
  --severity-high: #f97316;
  --severity-critical: #ef4444;
}
```

## Typography

```css
:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
}
```

## Screen Layouts

### 1. Landing Page

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Trail Safety          [Login] [Sign Up]              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    🏔️  Real-time Trail Conditions & Safety Reports         │
│                                                             │
│    [Interactive Map Preview - 60% width]                    │
│                                                             │
│    ✅ Live hazard updates                                   │
│    ✅ Community verified reports                            │
│    ✅ Emergency alerts                                      │
│                                                             │
│    [Get Started] [View Map]                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Features] [How it Works] [Pricing] [About] [Contact]      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Main Dashboard (Map View)

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] Trail Safety          [🔍] [🔔] [👤]                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Filters ──────────────────────────────────────────┐    │
│  │ [All Conditions ▼] [All Severities ▼] [Time Range ▼] │    │
│  │ [☑ Mud] [☑ Fallen Trees] [☐ Flooding] [☐ Ice]      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌───────────────────────── Interactive Map ─────────────┐ │
│  │                                                     │ │
│  │  📍📍📍                                           │ │
│  │     📍                                           │ │
│  │  📍    📍                                         │ │
│  │                                                     │ │
│  │  [+ Report Hazard]                                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Recent Reports ─────────────────────────────────────┐   │
│  │ 🟠 Fallen Tree - Trail A • 2 hours ago • 3 confirms │   │
│  │ 🟡 Mud - Trail B • 5 hours ago • 1 confirm          │   │
│  │ 🔴 Flooding - Trail C • 1 day ago • 5 confirms      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Report Creation Flow

#### Step 1: Location Selection
```
┌─────────────────────────────────────────────────────────────┐
│ [< Back] Report New Hazard                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1 of 4: Location                                     │
│                                                             │
│  ┌───────────────────────── Map ─────────────────────────┐  │
│  │                                                     │  │
│  │    📍 (Your current location)                      │  │
│  │                                                     │  │
│  │    ┌─────┐                                         │  │
│  │    │ Drag │  or tap to set exact location           │  │
│  │    └─────┘                                         │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  📍 Current Location: 40.7128° N, 74.0060° W                │
│                                                             │
│  [Use Current Location] [Search Location]                   │
│                                                             │
│                    [Next: Condition Type]                   │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2: Condition Type
```
┌─────────────────────────────────────────────────────────────┐
│ [< Back] Report New Hazard                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 2 of 4: Condition Type                               │
│                                                             │
│  What type of hazard are you reporting?                    │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 🌳      │ │ 💧      │ │ 🪨      │ │ 🌊      │           │
│  │Fallen   │ │Mud      │ │Rock     │ │Flooding │           │
│  │Tree     │ │         │ │Slide    │ │         │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 🧊      │ │ ❄️      │ │ 🦌      │ │ 🚧      │           │
│  │Ice      │ │Snow     │ │Wildlife │ │Closure  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 🌉      │ │ 🏗️      │ │ 🔧      │ │ ❓      │           │
│  │Bridge   │ │Construction│Maintenance│Other    │           │
│  │Damage   │ │         │ │         │ │         │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│                    [Next: Severity]                        │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3: Severity Level
```
┌─────────────────────────────────────────────────────────────┐
│ [< Back] Report New Hazard                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 3 of 4: Severity Level                               │
│                                                             │
│  How severe is this hazard?                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  🟢 Low                                            │    │
│  │  Minor inconvenience, easily passable               │    │
│  │                                                     │    │
│  │  🟡 Medium                                         │    │
│  │  Requires caution, may affect passage              │    │
│  │                                                     │    │
│  │  🟠 High                                           │    │
│  │  Significant obstacle, dangerous conditions        │    │
│  │                                                     │    │
│  │  🔴 Critical                                       │    │
│  │  Life-threatening, trail completely blocked        │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│                    [Next: Details]                         │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: Details & Photos
```
┌─────────────────────────────────────────────────────────────┐
│ [< Back] Report New Hazard                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 4 of 4: Details & Photos                             │
│                                                             │
│  Description (optional)                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Tell others more about this hazard...              │    │
│  │                                                     │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  📷 Add Photos                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [📷] [📷] [📷] [+ Add Photo]                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  📍 Location: Trail A, 0.5 miles from north entrance       │
│  🌳 Type: Fallen Tree                                      │
│  🟠 Severity: High                                          │
│                                                             │
│  [Submit Report]                                            │
└─────────────────────────────────────────────────────────────┘
```

### 4. Report Detail View

```
┌─────────────────────────────────────────────────────────────┐
│ [< Back] Fallen Tree - Trail A                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🟠 High Severity • Reported 2 hours ago                   │
│                                                             │
│  ┌───────────────────────── Photos ─────────────────────┐  │
│  │ [📷 Main Photo] [📷] [📷]                            │  │
│  │ Large fallen oak tree completely blocking trail       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  📍 Location: Trail A, 0.5 miles from north entrance       │
│  🌳 Type: Fallen Tree                                      │
│  👤 Reported by: @johndoe                                 │
│  ✅ Verified by 3 users                                    │
│                                                             │
│  Description:                                              │
│  "Large oak tree fell across the trail after yesterday's  │
│   storm. Tree is about 2 feet in diameter and completely  │
│   blocks the path. Difficult to bypass due to steep slope."│
│                                                             │
│  ┌─ Actions ─────────────────────────────────────────────┐   │
│  │ [✅ Confirm] [❌ Dispute] [💬 Comment] [📤 Share]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Comments (3) ─────────────────────────────────────────┐ │
│  │ @sarahh: Just came through here, definitely need to   │ │
│  │ avoid this section. Trail maintenance notified.       │ │
│  │ • 1 hour ago                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 5. User Profile

```
┌─────────────────────────────────────────────────────────────┐
│ [< Back] @johndoe                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Profile ─────────────────────────────────────────────┐  │
│  │ [👤 Profile Photo]                                     │  │
│  │ John Doe                                               │  │
│  │ @johndoe                                               │  │
│  │ Hiker • Trail Runner • Member since Oct 2023           │  │
│  │ ⭐ Reputation: 250 points                               │  │
│  │                                                         │  │
│  │ "Love exploring trails and helping keep our community   │  │
│  │  safe!"                                                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Statistics ──────────────────────────────────────────┐  │
│  │ 📊 Reports: 45                                         │  │
│  │ ✅ Verifications: 128                                  │  │
│  │ 💬 Comments: 67                                         │  │
│  │ 🏆 Top Reporter: #12 this month                         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Recent Activity ─────────────────────────────────────┐ │
│  │ 🗓️ Reported fallen tree on Trail A • 2 hours ago       │ │
│  │ ✅ Confirmed mud on Trail B • 5 hours ago              │ │
│  │ 💬 Commented on flooding report • 1 day ago           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Settings ─────────────────────────────────────────────┐ │
│  │ [🔔 Notifications] [🔐 Privacy] [⚙️ Preferences]      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 6. Admin Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ [☰] Admin Dashboard          [🔔] [👤 Admin]               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Overview ──────────────────────────────────────────────┐ │
│  │ 📊 Total Reports: 1,234  📈 This Week: +156            │ │
│  │ 👥 Active Users: 5,678    🆕 New Users: +89           │ │
│  │ ⏰ Avg Response Time: 2.3 hours  ✅ Resolution: 78%    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Pending Moderation ───────────────────────────────────┐ │
│  │ [🔴 Critical] Flooding - River Trail • 30 min ago      │ │
│  │ [🟠 High] Fallen Tree - Mountain Loop • 2 hours ago    │ │
│  │ [🟡 Medium] Mud - Valley Path • 5 hours ago            │ │
│  │ [View All (23)]                                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Quick Actions ─────────────────────────────────────────┐ │
│  │ [📤 Send Alert] [👥 User Management] [📊 Analytics]     │ │
│  │ [🏞️ Park Management] [🔧 System Settings]             │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Recent Activity ───────────────────────────────────────┐ │
│  │ @admin resolved flooding report on River Trail          │ │
│  │ New user registration: @hiker123                        │ │
│  │ AI detected fallen tree in photo upload                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Single column layout */
  /* Bottom navigation */
  /* Larger touch targets */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Two-column layout where appropriate */
  /* Side navigation */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Multi-column layout */
  /* Full navigation */
  /* Hover states */
}
```

### Mobile Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                    [🔍 Search]                             │
│                                                             │
│  ┌───────────────────────── Map ─────────────────────────┐  │
│  │                                                     │  │
│  │                                                     │  │
│  │                                                     │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Bottom Navigation ──────────────────────────────────┐   │
│  │ [🗺️ Map] [📋 Reports] [➕ Report] [🔔 Alerts] [👤 Profile] │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Library

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--primary-green);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary-green);
  border: 2px solid var(--primary-green);
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 600;
}

/* Severity Buttons */
.btn-severity-low { background: var(--severity-low); }
.btn-severity-medium { background: var(--severity-medium); }
.btn-severity-high { background: var(--severity-high); }
.btn-severity-critical { background: var(--severity-critical); }
```

### Cards

```css
.report-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 12px;
}

.report-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}
```

### Status Indicators

```css
.status-indicator {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-low { background: #dcfce7; color: #166534; }
.status-medium { background: #fef3c7; color: #92400e; }
.status-high { background: #fed7aa; color: #9a3412; }
.status-critical { background: #fee2e2; color: #991b1b; }
```

## Accessibility Features

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels and semantic HTML
3. **Color Contrast**: WCAG AA compliant contrast ratios
4. **Focus Indicators**: Clear focus states for all interactive elements
5. **Touch Targets**: Minimum 44px touch targets for mobile
6. **Alt Text**: Descriptive alt text for all images
7. **Form Validation**: Clear error messages and instructions

## Loading States

```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Error States

```css
.error-message {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  color: #dc2626;
  font-size: 20px;
}
```

## Success States

```css
.success-message {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-icon {
  color: #16a34a;
  font-size: 20px;
}
```

## Micro-interactions

1. **Button Press**: Subtle scale effect on button press
2. **Card Hover**: Smooth elevation and shadow changes
3. **Loading Spinners**: Consistent loading indicators
4. **Toast Notifications**: Slide-in notifications for user feedback
5. **Modal Transitions**: Smooth fade and scale animations

## Icon System

Using Heroicons or Lucide React for consistent iconography:

- **Navigation**: Map, Report, Alerts, Profile, Settings
- **Actions**: Add, Edit, Delete, Share, Confirm, Dispute
- **Status**: Check, X, Warning, Info, Alert
- **Conditions**: Tree, Water, Rock, Ice, Animal, Construction

This wireframe document provides the foundation for implementing the Trail Safety Platform's user interface. The design prioritizes usability, accessibility, and real-time information delivery for outdoor enthusiasts.
