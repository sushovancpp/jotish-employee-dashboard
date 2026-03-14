# Jotish — Employee Insights Dashboard

A full-stack React application built as part of a frontend engineering assessment. The dashboard provides secure authentication, a high-performance virtualized employee grid, identity verification with camera and signature capture, and geospatial salary analytics — all without any UI component libraries.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 |
| Routing | React Router v6 |
| Styling | Tailwind CSS + inline styles |
| Map | Leaflet |
| Build Tool | Vite |
| **Banned** | MUI, Ant Design, Bootstrap, react-window, react-virtualized, Chart.js, D3 |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sushovancpp/jotish-employee-dashboard.git
cd jotish-employee-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Create a `.env` file in the root of the project with the following variables:

```
VITE_API_USERNAME=test
VITE_API_PASSWORD=123456
VITE_LOGIN_USERNAME=testuser
VITE_LOGIN_PASSWORD=Test123
```

> The `.env` file is excluded from version control via `.gitignore`. Never commit credentials to Git.

### 4. Start the development server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Project Structure

```
src/
├── context/
│   └── AuthContext.jsx      # Persistent auth via Context API + localStorage
├── pages/
│   ├── Login.jsx            # Screen 1 — authentication
│   ├── List.jsx             # Screen 2 — virtualized employee grid
│   ├── Details.jsx          # Screen 3 — camera + signature + blob merge
│   └── Analytics.jsx        # Screen 4 — SVG chart + Leaflet map
├── components/
│   ├── ProtectedRoute.jsx   # Auth guard with redirect preservation
│   ├── VirtualList.jsx      # Custom scroll virtualization
│   └── SVGChart.jsx         # Raw SVG bar chart
└── hooks/
    └── useEmployeeData.js   # API fetch hook with request cancellation
```

---

## Features

### A. Secure Authentication
- Credentials are loaded from environment variables, never hardcoded in source.
- Session persists across page refreshes via `localStorage`.
- Unauthenticated users navigating to `/list` or `/details/:id` are redirected to login.
- After login, users are forwarded to their originally intended route.

### B. High-Performance Virtualized Grid
- Fetches employee data from a POST API endpoint.
- Supports real-time search across name, email, city, and department.
- Supports multi-field sorting (name, city, salary, department).
- Custom scroll virtualization — only visible rows are rendered in the DOM at any time.

### C. Identity Verification
- Dynamic routing via `/details/:id`.
- Live camera feed using the browser's `getUserMedia` API.
- Freehand signature drawn directly on an HTML5 Canvas overlaid on the captured photo.
- Photo and signature are merged into a single PNG file using the Canvas 2D compositing API and exported as a Blob.

### D. Analytics
- KPI cards: headcount, average salary, median, total payout.
- Custom SVG bar chart showing average salary per city — built with raw `<rect>`, `<text>`, and `<line>` elements, no chart libraries.
- Leaflet map with circle markers per city, sized proportionally to employee count.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_USERNAME` | Username sent to the employee data API |
| `VITE_API_PASSWORD` | Password sent to the employee data API |
| `VITE_LOGIN_USERNAME` | Valid username for the dashboard login screen |
| `VITE_LOGIN_PASSWORD` | Valid password for the dashboard login screen |

All variables must be prefixed with `VITE_` for Vite to expose them to the frontend via `import.meta.env`.

---

##  Intentional Bug — Documentation

**Location:** `src/components/VirtualList.jsx` — the `useEffect` that attaches the scroll listener.

**What it is:** A stale-reference memory leak caused by passing a new anonymous function to `removeEventListener` instead of the original `handleScroll` reference.

```js
// Listener is added with this reference:
const handleScroll = () => { setScrollTop(el.scrollTop) }
el.addEventListener('scroll', handleScroll, { passive: true })

// Cleanup creates a BRAND NEW function — never matches handleScroll:
return () => {
  el.removeEventListener('scroll', () => {
    setScrollTop(el.scrollTop)
  })
}
```

**Why it is a problem:**

`EventTarget.removeEventListener` uses reference equality to locate the listener to remove. Since the cleanup passes a freshly created arrow function every time, it never matches the originally registered `handleScroll`. Every mount cycle stacks another orphaned listener on the DOM node. After navigating away and back multiple times, duplicate scroll handlers accumulate — each one calling `setScrollTop` and triggering an unnecessary re-render. This is a classic memory leak combined with ghost state updates after unmount.

**The correct fix:**

```js
useEffect(() => {
  const el = containerRef.current
  if (!el) return
  const handleScroll = () => setScrollTop(el.scrollTop)
  el.addEventListener('scroll', handleScroll, { passive: true })
  return () => el.removeEventListener('scroll', handleScroll)
}, [])
```

**Why this bug was chosen:**

It is a realistic copy-paste mistake that is subtle enough to survive a code review at first glance, yet produces a measurable effect that can be demonstrated using Chrome DevTools — Memory tab → Heap snapshot, or Performance tab → Event Listeners panel showing stacked scroll handlers.

---

## Custom Virtualization Math

**File:** `src/components/VirtualList.jsx`

### Constants

| Symbol | Value | Meaning |
|---|---|---|
| `ROW_HEIGHT` | `56 px` | Fixed pixel height of every row |
| `BUFFER` | `8` | Extra rows rendered above and below the visible range |

### Formulas

```
scrollTop   = el.scrollTop            pixels scrolled from top of container
viewHeight  = ResizeObserver height   measured height of the scrollable container
N           = data.length             total row count

startIndex  = max(0,  floor(scrollTop / ROW_HEIGHT) - BUFFER)
endIndex    = min(N,  floor((scrollTop + viewHeight) / ROW_HEIGHT) + BUFFER)

totalHeight = N x ROW_HEIGHT          height of the invisible spacer div
                                       that gives the scrollbar its correct range

offsetY     = startIndex x ROW_HEIGHT position of the rendered batch so rows
                                       land at their exact pixel position
```

### How it works

A single spacer div with `height = totalHeight` establishes the full scrollbar range without rendering every row. Only the rows between `startIndex` and `endIndex` (~20 rows for a 1080px viewport) are mounted in the DOM at any time. These rows are `position: absolute; top: offsetY` so they appear at exactly the right position. The BUFFER of 8 rows above and below the viewport prevents visible pop-in during fast scrolling.

| Operation | Complexity |
|---|---|
| Row render on scroll | O(1) — fixed window size regardless of dataset |
| Sort and filter | O(N log N) — memoized with `useMemo` |
| DOM nodes in memory | O(BUFFER x 2 + viewHeight / ROW_HEIGHT) |

---

## Image Merging — How It Works

**File:** `src/pages/Details.jsx` → `mergeAndSave()`

1. **Capture** — `getUserMedia({ video: true })` streams the webcam into a `<video>` element. On capture, `ctx.drawImage(video, 0, 0, W, H)` freezes the current frame onto `photoCanvas`.

2. **Signature** — A transparent `sigCanvas` is absolutely positioned over `photoCanvas` at identical dimensions. Mouse and touch events draw freehand strokes using the Canvas 2D path API with `lineCap: round` for smooth lines.

3. **Merge** — An offscreen canvas composites both layers:
   ```js
   ctx.drawImage(photoCanvas, 0, 0, W, H)         // Layer 1: photo
   ctx.globalCompositeOperation = 'source-over'
   ctx.drawImage(sigCanvas, 0, 0, W, H)            // Layer 2: signature
   ```
   `source-over` places the signature on top while transparent pixels in the signature canvas show the photo beneath.

4. **Export** — `canvas.toBlob()` produces a binary Blob which is converted to an Object URL via `URL.createObjectURL()`. This is rendered in an `<img>` tag and offered as a PNG download.

---

## Geospatial Mapping — City Coordinate Strategy

**File:** `src/pages/Analytics.jsx`

A static lookup table maps city names to `[latitude, longitude]` coordinates. On render, each unique city from the dataset is resolved using:

1. Exact match (case-insensitive).
2. Partial substring match — handles variations like `"New Delhi"` matching `"delhi"`.
3. Fallback to a geographic centroid with random jitter so unmatched cities do not stack on the same point.

Leaflet renders a `circleMarker` per city with radius proportional to employee count (`clamp(count x 2.5, 8, 30)`). The CartoDB dark tile layer is used to match the dashboard's dark theme.
