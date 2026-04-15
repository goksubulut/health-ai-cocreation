# Goal Description
Build the HEALTH AI Co-Creation Platform frontend—a highly premium, extraordinary, and artistic web application that connects engineers and medical professionals. The strict requirement is a unique, non-generic visual feel focusing on high-end aesthetics, smooth animations, and WCAG 2.1 accessibility.

## User Review Required
> [!IMPORTANT]
> 1. **Color Palette Clarification:** You provided `HEX A3A380, D7CE93, EFEBCE, D848F, BB8588`. The code `D848F` is missing a character (5 characters instead of 6). Can you confirm what color you meant here (e.g., `#D8488F` for a rose/pink, or `#0D848F` for teal)? Also, we need a very dark color for text (e.g., `#1A1C18` Obsidian) to ensure perfect WCAG readability against the light backgrounds.
> 2. **Tech Stack Selection:** To achieve the "extraordinary" animations and performance you requested, I strongly recommend using **React 18 with Vite** combined with **Vanilla CSS** and **Framer Motion** (for jaw-dropping animations). This gives us total artistic control. Do you approve of this React + Vite stack?
> 3. **Design Aesthetic (Typography):** To make it look like art rather than a standard corporate app, I plan to use an elegant Serif font (like *Playfair Display* or *Instrument Serif*) for large headings (titles), paired with a clean Sans-Serif (like *Outfit* or *Inter*) for the main app data and UI components. What do you think of this mixed-typography approach?

## Proposed Changes
### Core Architecture
#### [NEW] Initialization of Vite + React Setup
We will initialize the project locally and configure React Router for the 11 specified pages, using Vanilla CSS to keep the design completely custom and artistic as requested.

#### [NEW] Global Design System ([src/index.css](file:///c:/Users/ASUS/OneDrive/Desktop/384-AG/src/index.css))
Implementation of custom CSS variables (based on your palette), typography imports, and core micro-animations (smooth hover effects, page transitions).

#### [NEW] Component Layer
Development of premium reusable components:
- Custom animated buttons
- Soft-shadow/Glassmorphic Cards for the "İlan Listesi" (Board)
- Animated Layouts (using Framer Motion)
- Advanced Form inputs (for the .edu registration constraints)

#### [NEW] Views Definition (Phase 1)
- [LandingPage.jsx](file:///c:/Users/ASUS/OneDrive/Desktop/384-AG/src/pages/LandingPage.jsx): The 20-second pitch, hero animations, interactive flow diagram.
  - `Auth.jsx`: Login & Register (.edu validation only).

### Phase 2: Backend Layer (`/server`)
#### [NEW] Initialization of Node.js + Express
We will stand up a lightweight Express API server to decouple the backend from Vite, allowing robust scaling later. 
- Fast, minimalist `.edu` verification gateway.
- Stateless JWT authentication logic to prevent session memory bloat.

#### [NEW] Database Engine (Prisma + SQLite)
To avoid forcing the host machine to run Docker or heavy SQL daemons during early access MVP, we will leverage Prisma ORM connected to a local SQLite file. This perfectly maps to Postgres when migrating to production without code changes!
- **Data Privacy**: No tables exist for "Uploads" or "Files", making it inherently immune to complex raw patient-data leaks.
- **Relational Integrity**: Strict foreign keys linking `Users` to `Posts` to `MatchRequests`.

## Verification Plan
### Automated Tests
- Once the Vite project is set up, verify successful build using `npm run build`.
- API verification scripts for automated login testing.
### Manual Verification
- Start the frontend server (`npm run dev`) and the backend server (`node index.js`).
- Complete a full visual QA flow: Register with an `.edu` email -> Login -> Post a discreet surgical listing -> Submit an NDA meeting request.
