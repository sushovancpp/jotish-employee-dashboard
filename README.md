# EID — Employee Insights Dashboard

> Next-generation workforce intelligence platform. React 18 · React Router v6 · Tailwind CSS · Leaflet · Zero UI Libraries.

---

## Quick Start

```bash
npm install
npm run dev       # → http://localhost:5173
```

Login credentials: **testuser / Test123**

---

## ⚠️ Intentional Bug — Documentation

**Location:** `src/components/VirtualList.jsx` — the second `useEffect` (scroll listener).

**What it is:** A **stale-reference memory leak** caused by passing a new anonymous function to `removeEventListener` instead of the original `handleScroll` reference.

```js
// INSIDE THE EFFECT:
const handleScroll = () => { setScrollTop(el.scrollTop) }
el.addEventListener('scroll', handleScroll, { passive: true })

// IN THE CLEANUP — THE BUG:
return () => {
  // ⚠ Creates a NEW arrow function on every call.
  // removeEventListener compares by reference, so the original
  // handleScroll is NEVER unregistered.
  el.removeEventListener('scroll', () => {
    setScrollTop(el.scrollTop)
  })
}
```

**Why it's a problem:**
- `EventTarget.removeEventListener` uses *reference equality* to find the listener to remove.
- A freshly-created `() => {}` never equals the previously-added `handleScroll`.
- Every time `VirtualList` mounts, a new listener stacks on the DOM node.
- After navigation away and back, you get 2, 4, 8… duplicate scroll handlers firing `setScrollTop`, each triggering a re-render — a classic **memory leak + ghost state-update** combo.

**Correct fix:**

```js
useEffect(() => {
  const el = containerRef.current
  if (!el) return
  const handleScroll = () => setScrollTop(el.scrollTop)
  el.addEventListener('scroll', handleScroll, { passive: true })
  return () => el.removeEventListener('scroll', handleScroll) // same ref ✓
}, [])
```

**Why I chose this bug:**
It is realistic (a common copy-paste mistake), subtle enough to pass code review at first glance, and has a measurable effect that can be demonstrated with Chrome DevTools Memory > Heap snapshot — exactly the kind of bug a senior interviewer would look for.

---

## Custom Virtualization Math

**File:** `src/components/VirtualList.jsx`

### Constants

| Symbol | Value | Meaning |
|---|---|---|
| `ROW_HEIGHT` | `56 px` | Fixed pixel height of every row |
| `BUFFER` | `8` | Extra rows rendered above **and** below the visible range |

### Formulas

```
scrollTop  = el.scrollTop           (from scroll event — pixels from top of container)
viewHeight = ResizeObserver height  (measured height of the scrollable container)
N          = data.length            (total row count)

startIndex = max(0,  floor(scrollTop / ROW_HEIGHT) - BUFFER)
endIndex   = min(N,  floor((scrollTop + viewHeight) / ROW_HEIGHT) + BUFFER)

totalHeight = N × ROW_HEIGHT        → height of the invisible spacer <div>
                                       that gives the scrollbar its correct range

offsetY     = startIndex × ROW_HEIGHT → translateY of the rendered batch,
                                         so rows land at the exact pixel position
                                         they would occupy in a fully-rendered list
```

### Why it works

1. A single `<div>` with `height = totalHeight` is rendered inside the scroll container. This gives the browser the correct scrollbar height for the *entire* dataset without actually rendering all rows.
2. Only `endIndex − startIndex` rows (~20 for a 1080 px viewport at 56 px/row) are in the DOM.
3. Those rows are `position: absolute; top: offsetY` so they land at precisely the right visual position regardless of which slice is currently visible.
4. The BUFFER prevents pop-in: 8 extra rows above and below ensure rows are already rendered before they scroll into view.

### Complexity

| Operation | Complexity |
|---|---|
| Row render on scroll | O(1) — always renders the same fixed-size window |
| Full sort + filter | O(N log N) — but memoized with `useMemo` |
| Memory footprint | O(BUFFER × 2 + viewHeight/ROW_HEIGHT) DOM nodes |

---

## Architecture Overview

```
src/
├── context/
│   └── AuthContext.jsx      # Persistent auth (localStorage) via Context API
├── pages/
│   ├── Login.jsx            # Screen 1 — authentication
│   ├── List.jsx             # Screen 2 — virtualized employee grid
│   ├── Details.jsx          # Screen 3 — camera + signature + blob merge
│   └── Analytics.jsx        # Screen 4 — SVG chart + Leaflet map
├── components/
│   ├── ProtectedRoute.jsx   # Auth guard with redirect preservation
│   ├── VirtualList.jsx      # Custom scroll virtualization ← INTENTIONAL BUG HERE
│   └── SVGChart.jsx         # Raw SVG bar chart (no Chart.js / D3)
└── hooks/
    └── useEmployeeData.js   # API fetch hook with cancellation
```

---

## Identity Verification — Image Merging Explained

**File:** `src/pages/Details.jsx` → `mergeAndSave()`

1. **Capture:** `videoRef` streams the webcam via `getUserMedia`. On "Capture", the current frame is drawn to `photoRef` (an HTML canvas) via `ctx.drawImage(video, 0, 0, W, H)`.

2. **Signature:** A transparent `sigRef` canvas is layered absolutely over the photo canvas (same dimensions). Mouse/touch events draw `bezierCurveTo` strokes using `context2d` — the canvas background remains transparent so the photo shows through.

3. **Merge:**
   ```js
   const merge = document.createElement('canvas')   // offscreen
   merge.width = W; merge.height = H
   const ctx = merge.getContext('2d')
   ctx.drawImage(photoCanvas, 0, 0, W, H)           // Layer 1: photo
   ctx.globalCompositeOperation = 'source-over'
   ctx.drawImage(sigCanvas,   0, 0, W, H)           // Layer 2: signature
   ```
   The `source-over` composite places the signature on top while transparent signature pixels reveal the photo underneath.

4. **Export:** `merge.toBlob(blob => URL.createObjectURL(blob), 'image/png')` produces a Blob → Object URL rendered in `<img>` and offered as a `<a download>` link.

---

## Geospatial Mapping — City Coordinate Strategy

**File:** `src/pages/Analytics.jsx` → `CITY_COORDS` + `resolveCoords()`

Since the API dataset is India-scoped, we use a **static lookup table** of ~35 major Indian cities mapping `city_name → [lat, lng]`.

Resolution algorithm:
1. Exact match (case-insensitive).
2. Partial substring match (handles "New Delhi" → "delhi").
3. Fallback: India geographic centroid (20.59°N, 78.96°E) with ±2° random jitter so unknown cities don't stack on the same pixel.

Leaflet renders circle markers sized proportionally to employee count (`radius = clamp(count × 2.5, 8, 30)`).

---

## Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | React 18 | Concurrent rendering, hooks |
| Routing | React Router v6 | Nested routes, loader API |
| Styling | Tailwind CSS + inline | Zero-runtime, design-system tokens |
| Map | Leaflet | Explicitly permitted; MIT license |
| Build | Vite | Sub-second HMR |
| **Banned** | MUI, Ant Design, Bootstrap, react-window, react-virtualized, Chart.js, D3 | Per spec |
