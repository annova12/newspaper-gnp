# 📰 Newspaper React — Frontend

Proper React + Vite project with CSS Modules. Every component is in its own file.

## Project Structure

```
src/
├── main.jsx                          ← Entry point — mounts App with providers
├── App.jsx                           ← Root component — wires all pages + modals
│
├── styles/
│   └── globals.css                   ← CSS variables, reset, animations
│
├── utils/
│   ├── api.js                        ← All API calls (axios) — one place to change base URL
│   └── constants.js                  ← Categories, icons, date formatters
│
├── context/
│   ├── AuthContext.jsx               ← Global auth state (login/logout/user)
│   └── ToastContext.jsx              ← Global toast notifications
│
├── hooks/
│   ├── useArticles.js                ← Fetch + cache articles
│   └── useSettings.js                ← Site settings (name, YouTube ID, etc.)
│
├── pages/
│   └── HomePage.jsx                  ← Main page — YouTube + articles + sidebar
│
└── components/
    ├── layout/
    │   ├── BreakingTicker.jsx        ← Red scrolling news ticker
    │   ├── Header.jsx                ← Top bar with date, weather, search, admin
    │   ├── Navbar.jsx                ← Category navigation bar
    │   └── Footer.jsx                ← Site footer with links
    │
    ├── news/
    │   ├── ArticleCard.jsx           ← Card with image, category badge, excerpt
    │   ├── ArticleView.jsx           ← Full article reading view
    │   ├── YouTubeSection.jsx        ← YouTube channel embed
    │   ├── CategorySection.jsx       ← Category block with "more" link
    │   └── Sidebar.jsx               ← Trending list + category counts
    │
    ├── admin/
    │   ├── AdminPanel.jsx            ← Modal wrapper + tab navigation
    │   ├── AdminLogin.jsx            ← Login form
    │   ├── AdminArticles.jsx         ← Article list with edit/delete
    │   ├── ArticleForm.jsx           ← Create/edit form with image upload
    │   ├── AdminBreaking.jsx         ← Breaking news ticker CRUD
    │   └── AdminSettings.jsx         ← Site name, tagline, YouTube ID
    │
    └── ui/
        └── SearchOverlay.jsx         ← Live search modal
```

Every component has its own `.module.css` file next to it.

## Quick Start

```bash
# 1. Install
npm install

# 2. Start backend (from ../backend/)
python main.py

# 3. Start frontend
npm run dev
# → http://localhost:3000
```

## Environment

```env
# .env
VITE_API_URL=http://localhost:8000   # change for production
```

## Production Build

```bash
npm run build
# Output: dist/
# Serve dist/ with nginx or any static host
```

## Adding a New Component

1. Create `src/components/YourSection/YourSection.jsx`
2. Create `src/components/YourSection/YourSection.module.css`
3. Use CSS variables from `globals.css` (e.g. `var(--red)`, `var(--font-serif)`)
4. Import and use in `HomePage.jsx` or `App.jsx`

## Changing Categories

Edit `src/utils/constants.js` → `CATEGORIES` array.
Icons are in `CATEGORY_ICONS` map in the same file.

## Changing API URL

Edit `src/utils/api.js` line 3:
```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```
Or set `VITE_API_URL` in `.env`.

## Admin Credentials (default)
- Username: `admin`
- Password: `NewsAdmin@2024`
