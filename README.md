# BookNest

A BSCS semester project: discover books, swipe recommendations, keep a personal library, and publish reviews. The UI follows the BookNest Figma Make design already in this folder. Book metadata comes from the live [Open Library Search API](https://openlibrary.org/dev/docs/api/search). User library data and reviews are saved as local JSON.

## Design summary (source of truth)

The official Figma plugin in this environment was not authenticated, and the folder does not contain a `figma.com` file URL. The design used for implementation is the **Figma Make export** already in this project (`src/App.tsx` + `src/index.css`). That prototype is the visual and interaction spec.

### Pages
- **Discover** — editorial hero (“YOUR NEXT FAVORITE BOOK”), featured cover with purple geometric shape, search, genre chips, shuffle, 3-column browse grid.
- **Book Review** — Tinder-style discovery card with Recommend / Not for me / Back, progress bar, featured review cards, and a **Latest community reviews** feed at the bottom.
- **My Books** — purple shelf heading with cute-book illustration, TBR / Read / Not for Me counts, sort, status changes, personal star ratings.
- **Book details modal** — cover, tags, description, status, write-a-review form, sentiment bars, and that book’s review list.

### Components
Brand mark, top navigation, sun/moon theme toggle, search field, genre chips, browse cards, discovery card, action buttons, review cards, submitted-review tiles, library summary tiles, shelf cards, rating editor, modal, toast.

### Colors
Light: paper `#f8f8f8` / white, ink `#111111`, purple `#b64bff`, violet `#4522f5`.  
Dark: charcoal `#171a18`, paper `#252c27`, purple accents retained.

### Typography
- Display: **Archivo Black** (hero and page titles)
- Body: **DM Sans**
- Editorial serif: **DM Serif Display** (book titles, quotes)

### Interactions
Hero entrance and parallax, shuffle, card swipe left/right/back, scroll reveal, hover lifts, sticky header, light/dark theme, reduced-motion fallback, toast confirmations.

The Figma Make React files were **left in place** (not deleted). The graded implementation is vanilla HTML/CSS/JS + Core Java.

## Tech stack
- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Java 25 `com.sun.net.httpserver.HttpServer` (no Spring)
- Books: Open Library Search API
- Persistence: `data/library.json` and `data/reviews.json`

## Custom DSA (used in real features)

| Structure | Where it is used | Complexity |
| --- | --- | --- |
| Hash table (chaining) | Book cache by Open Library work id; duplicate review fingerprints | Average **O(1)** lookup/insert, worst **O(n)** |
| Doubly linked list | Discovery history and Back | Append / back **O(1)** |
| Binary search tree | Title index for prefix search | Average **O(log n)** search, worst **O(n)** |
| Custom queue | BFS walk of the title tree | Enqueue/dequeue **O(1)** |
| Merge sort | Sorted search results and review history | **O(n log n)** |
| BFS | `/api/dsa` title walk and prefix collection | **O(n)** |

## Project layout

```
frontend/          vanilla UI served by the Java server
backend/src/      Java HTTP server, Open Library client, DSA, tests
data/              JSON persistence (created on first run)
src/               original Figma Make React prototype (reference only)
```

## How to run

You need **Java 25** (`java` and `javac` on your PATH) and internet access so Open Library can answer.

In PowerShell, from `C:\Users\fatima\Downloads\BookNest`:

```powershell
# 1. Compile every Java file into backend\out
New-Item -ItemType Directory -Force -Path backend\out | Out-Null
$sources = Get-ChildItem -Recurse backend\src -Filter *.java | ForEach-Object { $_.FullName }
javac -d backend\out $sources

# 2. Run unit tests (no network)
java -cp backend\out booknest.test.DsaTests

# 3. Run the live Open Library test (needs internet)
java -cp backend\out booknest.test.LiveApiTest

# 4. Start the app
java -cp backend\out booknest.server.BookNestServer 8080
```

Then open **http://localhost:8080** in your browser.

Stop the server with `Ctrl+C` in that terminal.

If port 8080 is busy, pass another port: `java -cp backend\out booknest.server.BookNestServer 9090`.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/books/search?q=&genre=` | Live Open Library search |
| GET | `/api/books/random` | Random subject seed + shuffle |
| GET | `/api/books/{id}` | Work details |
| GET | `/api/library` | Statuses, ratings, dates |
| PUT | `/api/library/{id}` | Save reading status |
| PUT | `/api/library/{id}/rating` | Save 1–5 star rating |
| GET | `/api/reviews?bookId=` | Review history |
| POST | `/api/reviews` | Create a review (duplicate-protected) |
| GET | `/api/dsa` | Live DSA sizes and BFS sample |

## Test cases

1. `DsaTests` — hash overwrite, DLL back, BST/BFS, queue FIFO, merge sort, JSON round-trip.
2. `LiveApiTest` — real Open Library search, persist TBR, save a review, reject a duplicate.
3. Manual UI checks in the demonstration checklist below.

## Demonstration checklist

- [ ] Home/Discover loads **live** covers, titles, and authors (not the five hardcoded Figma books).
- [ ] Search and genre chips filter results; Shuffle hits the random endpoint.
- [ ] Opening a book shows a description or a clear missing-data message; broken covers fall back to a purple tile.
- [ ] Book Review card: Recommend adds TBR, Not for me rejects, Back restores the previous card (animation plays).
- [ ] Write a review with stars; it appears at the **bottom of Book Review** and in that book’s modal list; average and count update.
- [ ] Duplicate review is rejected with an error.
- [ ] My Books shows TBR / Read / Not for Me; status and rating survive a server restart (JSON files).
- [ ] Light/dark toggle and mobile-width layout still match the design.
- [ ] Stop the server or unplug the network: the UI shows an error instead of fake books.

## Notes for graders
Reviews and library state are the user-created data that persist. Open Library remains the catalog. No Spring Boot and no extra Maven dependencies.
