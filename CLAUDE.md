# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build into `dist/`
- `npm run preview` — serve the built `dist/`
- `npm run lint` — Oxlint (config in `.oxlintrc.json`: react + oxc plugins, `rules-of-hooks` is an error)

There is no test runner configured.

## Architecture

Small single-page React 19 + Vite PWA (plain JS/JSX, no TypeScript, no router) called **Dawat** (دعوت in Urdu): a shared list of restaurants that a couple rates together. It is built iPhone-first (installed to the home screen from Safari), so keep touch targets ≥44px, respect `env(safe-area-inset-*)`, and keep input font sizes ≥16px.

Rating model: each spot is scored 1–10 on three metrics (food & taste, ambience & service, value for money & quality). The published score is their **sum out of 30**. There are no star ratings. Spots can also have a total bill (`price`), up to 5 photos and a list of favourite dishes.

Navigation is a floating bottom `TabBar` (Home, Ratings, Account) driven by a `view` state in `App.jsx`. Home and Ratings stay mounted but `hidden` so scroll position, search and sort survive tab switches.

- `src/main.jsx` mounts `<App />` in `StrictMode`.
- `src/App.jsx` owns the restaurant list and does all Supabase CRUD on the `restaurants` table. Home shows a hero carousel of top-scoring spots with photos, a "Rate a new spot" bar, Best/Worst rated chips and only the top 3 spots with a "See all" link.
- `src/RatingsPage.jsx` is the full list with search (name, cuisine, dish) and sort by recent / rating / price (tap the active chip to flip direction; spots missing the sorted value sink to the bottom).
- `src/SpotFormSheet.jsx` is the bottom sheet for both rating a new spot and editing one (owns the form state, returns data to `App.saveSpot` via `onSubmit`; editing keeps/removes existing photos and uploads new ones). `src/SpotDetail.jsx` is the detail sheet (gallery, per-metric bars, dishes, edit, delete). `src/SpotCard.jsx` is the list card and `ScoreBadge`.
- `src/AccountPage.jsx` is a **UI stub**: sign in / sign up only set local React state. Real Supabase Auth is not wired up.
- `src/scoring.js` defines the metrics, `totalScore()` (null for legacy rows without scores) and `scoreTone()`. `src/format.js` holds the currency (`INR`, change there). `src/imageUtils.js` downsizes photos before upload. `src/useEscape.js` closes sheets on Escape.
- Offline: `App.jsx` caches the last fetched list in `localStorage` (`dawat-restaurants-cache`) and shows an offline banner; writes are blocked with a message while offline. `vite.config.js` adds Workbox runtime caching for spot photos and Google Fonts.
- `src/supabaseClient.js` creates the client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` (not committed). Photos are uploaded to the public `restaurant-photos` storage bucket and their URLs stored in `restaurants.photos`.
- `supabase-setup.sql` must be run once in the Supabase SQL editor: it adds `food_score`, `ambience_score`, `value_score`, `price`, `fav_dishes`, `photos`, relaxes the old `rating` column and creates the storage bucket and policies. The app's inserts fail until it has been run.
- Styling is hand-written CSS: `src/index.css` (theme tokens, light/dark via `prefers-color-scheme`, global resets) and `src/App.css` (all component styles). Fonts are Instrument Serif (headings, scores; single weight so `font-synthesis: none`), the system font stack (body), Sora (the Dawat wordmark) and Noto Nastaliq Urdu (the دعوت mark in the header), loaded from Google Fonts in `index.html`. `tailwindcss` and `autoprefixer` are installed but unused.
- `vite.config.js` registers `vite-plugin-pwa` (`registerType: 'autoUpdate'`, standalone display). Icons in `public/` are generated placeholders (red rounded square with a white plate ring); replace with real branding.
