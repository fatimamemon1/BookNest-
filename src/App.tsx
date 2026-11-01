import {
  CSSProperties,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react"

type Page = "discover" | "reviews" | "books"
type Status = "TBR" | "Currently Reading" | "Read" | "Not for Me"
type LibraryList = "TBR" | "Read" | "Not for Me"
type Theme = "light" | "dark"

type Book = {
  id: number
  openLibraryId: string
  title: string
  author: string
  year: number
  genre: string
  tags: string[]
  rating: number
  reviews: string
  description: string
  cover: string
  accent: string
}

const books: Book[] = [
  {
    id: 1,
    openLibraryId: "OL27448W",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    year: 1937,
    genre: "Fantasy",
    tags: ["Fantasy", "Adventure", "Classic"],
    rating: 4.7,
    reviews: "Community favorite",
    description:
      "Bilbo Baggins is swept into an epic quest to reclaim a lost kingdom, discovering courage, friendship, and a very peculiar ring along the way.",
    cover: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
    accent: "#A56C39",
  },
  {
    id: 2,
    openLibraryId: "OL17930368W",
    title: "Atomic Habits",
    author: "James Clear",
    year: 2018,
    genre: "Non-fiction",
    tags: ["Self Growth", "Psychology", "Habits"],
    rating: 4.5,
    reviews: "Popular with readers",
    description:
      "A practical guide to building good habits, breaking bad ones, and mastering the tiny behaviors that lead to remarkable results.",
    cover: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    accent: "#B7A28A",
  },
  {
    id: 3,
    openLibraryId: "OL66554W",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    year: 1813,
    genre: "Romance",
    tags: ["Classic", "Romance", "Literary"],
    rating: 4.6,
    reviews: "Enduring classic",
    description:
      "Elizabeth Bennet navigates family, society, and first impressions in this witty, tender portrait of love and self-knowledge.",
    cover: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
    accent: "#906971",
  },
  {
    id: 4,
    openLibraryId: "OL20646372W",
    title: "The Thursday Murder Club",
    author: "Richard Osman",
    year: 2020,
    genre: "Mystery",
    tags: ["Mystery", "Crime", "Humor"],
    rating: 4.3,
    reviews: "Reader-loved mystery",
    description:
      "Four unlikely friends in a peaceful retirement village meet weekly to investigate unsolved crimes—until a real murder lands on their doorstep.",
    cover: "https://covers.openlibrary.org/b/isbn/9781984880987-L.jpg",
    accent: "#6D7C69",
  },
  {
    id: 5,
    openLibraryId: "OL20810207W",
    title: "The Midnight Library",
    author: "Matt Haig",
    year: 2020,
    genre: "Fiction",
    tags: ["Fiction", "Fantasy", "Contemporary"],
    rating: 4.2,
    reviews: "Book club pick",
    description:
      "Between life and death there is a library. Nora Seed explores the lives she might have lived and what makes a life worth choosing.",
    cover: "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
    accent: "#476B68",
  },
]

const initialStatuses: Record<number, Status> = {
  2: "Read",
  3: "TBR",
  5: "TBR",
}

type LibraryState = {
  statuses: Record<number, Status>
  ratings: Record<number, number>
  dates: Record<number, string>
  reviews: UserReview[]
}

type UserReview = {
  id: string
  bookId: number
  reviewer: string
  rating: number
  title: string
  text: string
  date: string
}

const reviewAverage = (book: Book, reviews: UserReview[]) => {
  const bookReviews = reviews.filter((review) => review.bookId === book.id)
  if (!bookReviews.length) return book.rating
  return Number(
    (
      (book.rating +
        bookReviews.reduce((total, review) => total + review.rating, 0)) /
      (bookReviews.length + 1)
    ).toFixed(1),
  )
}

const loadLibrary = (): LibraryState => {
  try {
    const saved = localStorage.getItem("booknest-library")
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<LibraryState>
      const statuses = Object.fromEntries(
        Object.entries(parsed.statuses ?? initialStatuses).map(
          ([id, status]) => [id, status === "Recommended" ? "TBR" : status],
        ),
      ) as Record<number, Status>
      return {
        statuses,
        ratings: parsed.ratings ?? {},
        dates: parsed.dates ?? {},
        reviews: parsed.reviews ?? [],
      }
    }
  } catch {
    // Fall back to starter content when stored prototype data is unavailable.
  }
  return {
    statuses: initialStatuses,
    ratings: { 2: 4 },
    dates: {
      2: "2025-01-18T10:00:00.000Z",
      3: "2025-02-02T10:00:00.000Z",
      5: "2025-02-10T10:00:00.000Z",
    },
    reviews: [],
  }
}

function Icon({ name, size = 20 }: { name: string size?: number }) {
  const paths: Record<string, ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    x: (
      <>
        <path d="m18 6-12 12" />
        <path d="m6 6 12 12" />
      </>
    ),
    back: (
      <>
        <path d="m9 14-4-4 4-4" />
        <path d="M5 10h8a6 6 0 0 1 6 6v1" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    sort: (
      <>
        <path d="M3 6h18" />
        <path d="M6 12h12" />
        <path d="M10 18h4" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12" />
        <path d="m6 6 12 12" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
      </>
    ),
    moon: (
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
    ),
    shuffle: (
      <>
        <path d="M16 3h5v5" />
        <path d="m4 20 5-5" />
        <path d="m21 3-7 7" />
        <path d="M16 16h5v5" />
        <path d="m15 15 6 6" />
        <path d="M4 4l5 5" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function CuteBookIllustration() {
  return (
    <svg
      className="cute-book-illustration"
      viewBox="0 0 340 250"
      role="img"
      aria-label="A cute purple book with friendly eyes"
    >
      <path
        d="M79 38h157c18 0 31 13 31 31v130c0 9-7 16-16 16H90c-14 0-25-11-25-25V52c0-8 6-14 14-14Z"
        fill="#B64BFF"
        stroke="#111111"
        strokeWidth="7"
      />
      <path d="M91 42v172" fill="none" stroke="#4522F5" strokeWidth="19" />
      <path
        d="M96 196h151c9 0 16 7 16 16v3H91v-14c0-3 2-5 5-5Z"
        fill="#F8F3E8"
        stroke="#111111"
        strokeWidth="7"
      />
      <path
        d="M118 44h22v44l-11-9-11 9V44Z"
        fill="#4522F5"
        stroke="#111111"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <ellipse cx="154" cy="120" rx="24" ry="29" fill="#FFFFFF" />
      <ellipse cx="220" cy="120" rx="24" ry="29" fill="#FFFFFF" />
      <circle cx="160" cy="124" r="10" fill="#111111" />
      <circle cx="226" cy="124" r="10" fill="#111111" />
      <circle cx="164" cy="120" r="3" fill="#FFFFFF" />
      <circle cx="230" cy="120" r="3" fill="#FFFFFF" />
      <path
        d="M166 163c12 11 29 11 41 0"
        fill="none"
        stroke="#111111"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Button({
  children,
  className = "",
  onClick,
  type = "button",
  disabled,
  ariaLabel,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  ariaLabel?: string
}) {
  return (
    <button
      aria-label={ariaLabel}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${className}`}
    >
      {children}
    </button>
  )
}

function Search({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="search-field">
      <Icon name="search" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <Button
          ariaLabel="Clear search"
          className="clear-search"
          onClick={() => onChange("")}
        >
          <Icon name="close" size={16} />
        </Button>
      )}
    </label>
  )
}

function Stars({
  rating,
  interactive = false,
  onChange,
}: {
  rating: number
  interactive?: boolean
  onChange?: (n: number) => void
}) {
  return (
    <span
      className={`stars ${interactive ? "interactive" : ""}`}
      aria-label={`${rating} stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={n <= Math.round(rating) ? "filled" : ""}
        >
          ★
        </button>
      ))}
    </span>
  )
}

function App() {
  const [page, setPage] = useState<Page>("discover")
  const [cardMotion, setCardMotion] = useState("")
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("booknest-theme")
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  })
  const [discoverIndex, setDiscoverIndex] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const [library, setLibrary] = useState<LibraryState>(loadLibrary)
  const [toast, setToast] = useState("")
  const [search, setSearch] = useState("")
  const [genre, setGenre] = useState("All")
  const [selected, setSelected] = useState<Book | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("booknest-theme", theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem("booknest-library", JSON.stringify(library))
  }, [library])

  useEffect(() => {
    const header = document.querySelector(".topbar")
    const updateHeader = () =>
      header?.classList.toggle("scrolled", window.scrollY > 24)
    updateHeader()
    window.addEventListener("scroll", updateHeader, { passive: true })
    return () => window.removeEventListener("scroll", updateHeader)
  }, [])

  useEffect(() => {
    let observer: IntersectionObserver | undefined
    const timer = window.setTimeout(() => {
      const targets = document.querySelectorAll(
        ".discover-hero .hero-copy > *, .discover-hero .hero-tools, .browse-book-card, .review-card, .submitted-review, .summary-row > button, .shelf-card, .page-heading > *, .section-label, .library-toolbar, .empty-state",
      )
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible")
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px" },
      )
      targets.forEach((target, index) => {
        target.classList.add("reveal")
        ;(target as HTMLElement).style.setProperty(
          "--reveal-delay",
          `${Math.min(index % 5, 4) * 70}ms`,
        )
        observer.observe(target)
      })
    }, 30)
    return () => {
      window.clearTimeout(timer)
      observer?.disconnect()
    }
  }, [page])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let animationFrame = 0
    const updateParallax = () => {
      animationFrame = 0
      const stage = document.querySelector<HTMLElement>(".hero-book-stage")
      if (!stage) return
      const bounds = stage.getBoundingClientRect()
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return
      const progress =
        (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)
      stage.style.setProperty("--scroll-shift", `${(progress - 0.5) * 34}px`)
      stage.style.setProperty("--shape-scroll", `${(progress - 0.5) * -15}px`)
    }
    const requestUpdate = () => {
      if (!animationFrame)
        animationFrame = window.requestAnimationFrame(updateParallax)
    }
    updateParallax()
    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)
    return () => {
      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }, [page])

  const filtered = useMemo(
    () =>
      books.filter((b) => {
        const query = search.toLowerCase()
        const matchesSearch =
          !query ||
          `${b.title} ${b.author} ${b.genre}`.toLowerCase().includes(query)
        return matchesSearch && (genre === "All" || b.genre === genre)
      }),
    [search, genre],
  )
  const current = filtered[discoverIndex]

  const decide = (status: Status) => {
    if (!current || cardMotion) return
    const decidedBook = current
    setCardMotion(status === "TBR" ? "swipe-right" : "swipe-left")
    setToast(
      status === "TBR"
        ? `Added “${current.title}” to your TBR`
        : `We’ll tune your picks`,
    )
    window.setTimeout(() => {
      setLibrary((state) => ({
        ...state,
        statuses: { ...state.statuses, [decidedBook.id]: status },
        dates: {
          ...state.dates,
          [decidedBook.id]:
            state.dates[decidedBook.id] ?? new Date().toISOString(),
        },
      }))
      setHistory((h) => [...h, decidedBook.id])
      setDiscoverIndex((i) => i + 1)
      setCardMotion("card-enter")
      window.setTimeout(() => setCardMotion(""), 420)
    }, 280)
    window.setTimeout(() => setToast(""), 2600)
  }

  const goBack = () => {
    if (!history.length || discoverIndex === 0 || cardMotion) return
    setCardMotion("swipe-back")
    setToast("Previous book restored")
    window.setTimeout(() => {
      setDiscoverIndex((i) => i - 1)
      setHistory((h) => h.slice(0, -1))
      setCardMotion("card-enter-back")
      window.setTimeout(() => setCardMotion(""), 420)
    }, 260)
    window.setTimeout(() => setToast(""), 1800)
  }

  const navigate = (next: Page) => {
    setPage(next)
    setSelected(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const updateStatus = (bookId: number, status: Status) => {
    const book = books.find((item) => item.id === bookId)
    setLibrary((state) => ({
      ...state,
      statuses: { ...state.statuses, [bookId]: status },
      dates: {
        ...state.dates,
        [bookId]: state.dates[bookId] ?? new Date().toISOString(),
      },
    }))
    setToast(
      status === "TBR"
        ? `“${book?.title}” moved to TBR`
        : `“${book?.title}” marked as ${status}`,
    )
    window.setTimeout(() => setToast(""), 2200)
  }

  const saveRating = (bookId: number, rating: number) => {
    const book = books.find((item) => item.id === bookId)
    setLibrary((state) => ({
      ...state,
      ratings: { ...state.ratings, [bookId]: rating },
    }))
    setToast(`${rating}-star rating saved for “${book?.title}”`)
    window.setTimeout(() => setToast(""), 2200)
  }

  const submitReview = (review: Omit<UserReview, "id" | "date">): {
    success: boolean
    message: string
  } => {
    const duplicate = library.reviews.some(
      (existing) =>
        existing.bookId === review.bookId &&
        existing.reviewer.trim().toLowerCase() ===
          review.reviewer.trim().toLowerCase() &&
        existing.text.trim().toLowerCase() === review.text.trim().toLowerCase(),
    )
    if (duplicate) {
      return {
        success: false,
        message: "This review has already been submitted.",
      }
    }
    const savedReview: UserReview = {
      ...review,
      id: `${review.bookId}-${Date.now()}`,
      date: new Date().toISOString(),
    }
    setLibrary((state) => ({
      ...state,
      reviews: [savedReview, ...state.reviews],
    }))
    setToast("Your review is now live")
    window.setTimeout(() => setToast(""), 2200)
    return { success: true, message: "Review submitted successfully." }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => navigate("discover")}
          aria-label="BookNest home"
        >
          <span className="brand-mark">
            <Icon name="book" size={19} />
          </span>
          <span>
            Book<span>Nest</span>
          </span>
        </button>
        <nav aria-label="Main navigation">
          {([
            ["discover", "Discover"],
            ["reviews", "Book Review"],
            ["books", "My Books"],
          ] as [Page, string][]).map(([key, label]) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              onClick={() => navigate(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
            title={`${theme === "light" ? "Dark" : "Light"} mode`}
            aria-pressed={theme === "dark"}
          >
            <span className={theme === "light" ? "active" : ""}>
              <Icon name="sun" size={16} />
            </span>
            <span className={theme === "dark" ? "active" : ""}>
              <Icon name="moon" size={15} />
            </span>
          </button>
          <button className="avatar" aria-label="View profile">
            AM
          </button>
        </div>
      </header>

      {page === "discover" && (
        <BrowseDiscover
          onDetails={setSelected}
          onLibrary={() => navigate("books")}
          onRecommend={(bookId) => updateStatus(bookId, "TBR")}
        />
      )}
      {page === "reviews" && (
        <>
          <Discover
            search={search}
            setSearch={(v) => {
              setSearch(v)
              setDiscoverIndex(0)
            }}
            genre={genre}
            setGenre={(v) => {
              setGenre(v)
              setDiscoverIndex(0)
            }}
            current={current}
            index={discoverIndex}
            total={filtered.length}
            onDecision={decide}
            onBack={goBack}
            canBack={history.length > 0}
            reset={() => {
              setDiscoverIndex(0)
              setSearch("")
              setGenre("All")
            }}
            onDetails={setSelected}
            cardMotion={cardMotion}
          />
          <Reviews reviews={library.reviews} onDetails={setSelected} />
        </>
      )}
      {page === "books" && (
        <MyBooks
          statuses={library.statuses}
          ratings={library.ratings}
          dates={library.dates}
          onStatusChange={updateStatus}
          onRatingSave={saveRating}
          onDetails={setSelected}
        />
      )}
      {selected && (
        <BookModal
          book={selected}
          status={library.statuses[selected.id]}
          personalRating={library.ratings[selected.id]}
          reviews={library.reviews.filter(
            (review) => review.bookId === selected.id,
          )}
          onStatusChange={updateStatus}
          onRatingSave={saveRating}
          onReviewSubmit={submitReview}
          onClose={() => setSelected(null)}
        />
      )}
      {toast && (
        <div className="toast">
          <span>
            <Icon name="check" size={17} />
          </span>
          {toast}
        </div>
      )}
      <footer>
        <span className="brand compact">
          <span className="brand-mark">
            <Icon name="book" size={15} />
          </span>
          BookNest
        </span>
        <p>Made for readers, one page at a time.</p>
        <span>Student project prototype · 2025</span>
      </footer>
    </div>
  )
}

function BrowseDiscover({
  onDetails,
  onLibrary,
  onRecommend,
}: {
  onDetails: (book: Book) => void
  onLibrary: () => void
  onRecommend: (bookId: number) => void
}) {
  const [query, setQuery] = useState("")
  const [genre, setGenre] = useState("All")
  const [order, setOrder] = useState(() => books.map((book) => book.id))
  const [shuffleCount, setShuffleCount] = useState(0)
  const genres = [
    "All",
    "Fiction",
    "Fantasy",
    "Mystery",
    "Romance",
    "Non-fiction",
  ]
  const visible = order
    .map((id) => books.find((book) => book.id === id)!)
    .filter((book) => {
      const searchText =
        `${book.title} ${book.author} ${book.genre}`.toLowerCase()
      return (
        searchText.includes(query.toLowerCase()) &&
        (genre === "All" || book.genre === genre)
      )
    })
  const shuffle = () => {
    setOrder((current) => {
      const next = [...current]
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
      }
      return next
    })
    setShuffleCount((count) => count + 1)
  }

  return (
    <main>
      <section className="editorial-hero">
        <div className="editorial-intro">
          <span className="hero-index">BOOKNEST / 001</span>
          <h1>
            YOUR NEXT
            <br />
            FAVORITE
            <br />
            BOOK.
          </h1>
          <p>
            Browse stories that match your curiosity, open their details, and
            build a library that feels entirely your own.
          </p>
          <div className="hero-actions">
            <Button
              className="editorial-primary"
              onClick={() =>
                document
                  .querySelector(".browse-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              START DISCOVERING <Icon name="arrow" size={18} />
            </Button>
            <Button className="editorial-secondary" onClick={onLibrary}>
              EXPLORE MY BOOKS
            </Button>
          </div>
        </div>
        <div
          className="hero-book-stage"
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect()
            const x = (event.clientX - bounds.left) / bounds.width - 0.5
            const y = (event.clientY - bounds.top) / bounds.height - 0.5
            event.currentTarget.style.setProperty("--parallax-x", `${x * 16}px`)
            event.currentTarget.style.setProperty("--parallax-y", `${y * 16}px`)
            event.currentTarget.style.setProperty("--shape-x", `${x * -6}px`)
            event.currentTarget.style.setProperty("--shape-y", `${y * -6}px`)
          }}
          onPointerLeave={(event) => {
            event.currentTarget.style.setProperty("--parallax-x", "0px")
            event.currentTarget.style.setProperty("--parallax-y", "0px")
            event.currentTarget.style.setProperty("--shape-x", "0px")
            event.currentTarget.style.setProperty("--shape-y", "0px")
          }}
        >
          <div className="purple-shape" />
          <span className="vertical-note">CURATED FOR CURIOUS MINDS</span>
          <img src={books[0].cover} alt={`Cover of ${books[0].title}`} />
          <div className="hero-book-meta">
            <span>
              {books[0].genre} / {books[0].year}
            </span>
            <h2>{books[0].title}</h2>
            <p>{books[0].author}</p>
            <Button onClick={() => onRecommend(books[0].id)}>ADD TO TBR</Button>
          </div>
        </div>
      </section>

      <section className="browse-section">
        <div className="discover-hero">
          <div className="hero-copy">
            <span className="eyebrow">BROWSE / SEARCH / EXPLORE</span>
            <h1>
              DISCOVER
              <br />
              <em>NEW BOOKS.</em>
            </h1>
            <p>Explore the shelf and find something unexpected.</p>
          </div>
          <div className="hero-tools">
            <Search
              value={query}
              onChange={setQuery}
              placeholder="Search books, authors, or genres…"
            />
            <div className="browse-filter-row">
              <div className="chips">
                {genres.map((item) => (
                  <button
                    key={item}
                    onClick={() => setGenre(item)}
                    className={genre === item ? "active" : ""}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <Button className="shuffle-books" onClick={shuffle}>
                <Icon name="shuffle" size={16} /> Shuffle
              </Button>
            </div>
          </div>
        </div>
        {visible.length ? (
          <div className="browse-grid">
            {visible.map((book, index) => (
              <button
                className="browse-book-card"
                key={`${book.id}-${shuffleCount}`}
                onClick={() => onDetails(book)}
                style={{ "--card-index": index } as CSSProperties}
              >
                <div className="browse-cover">
                  <span>0{index + 1}</span>
                  <img src={book.cover} alt={`Cover of ${book.title}`} />
                </div>
                <div className="browse-book-copy">
                  <small>
                    {book.genre} / {book.year}
                  </small>
                  <h2>{book.title}</h2>
                  <p>{book.author}</p>
                  <span className="browse-more">
                    VIEW DETAILS <Icon name="arrow" size={15} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="search" />
            </span>
            <h2>No books found</h2>
            <p>Try a different title, author, or genre.</p>
          </div>
        )}
      </section>
    </main>
  )
}

function Discover({
  search,
  setSearch,
  genre,
  setGenre,
  current,
  index,
  total,
  onDecision,
  onBack,
  canBack,
  reset,
  onDetails,
  cardMotion,
}: {
  search: string
  setSearch: (v: string) => void
  genre: string
  setGenre: (v: string) => void
  current?: Book
  index: number
  total: number
  onDecision: (s: Status) => void
  onBack: () => void
  canBack: boolean
  reset: () => void
  onDetails: (b: Book) => void
  cardMotion: string
}) {
  const genres = [
    "All",
    "Fiction",
    "Fantasy",
    "Mystery",
    "Romance",
    "Non-fiction",
  ]
  return (
    <main>
      <section className="discover-hero">
        <div className="hero-copy">
          <span className="eyebrow">REVIEW / DECIDE / SAVE</span>
          <h1>
            MAKE YOUR
            <br />
            <em>NEXT PICK.</em>
          </h1>
          <p>Recommend it, pass on it, or go back and reconsider.</p>
        </div>
        <div className="hero-tools">
          <Search
            value={search}
            onChange={setSearch}
            placeholder="Search books, authors, or genres…"
          />
          <div className="chips">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={genre === g ? "active" : ""}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="discovery-stage">
        <div className="stage-decoration one">
          A quiet corner
          <br />
          for curious readers.
        </div>
        {current ? (
          <>
            <article
              className={`discovery-card ${cardMotion}`}
              key={current.id}
            >
              <div className="cover-wrap">
                <span className="pick-label">TODAY’S DISCOVERY</span>
                <div
                  className="cover-glow"
                  style={{ background: current.accent }}
                />
                <img src={current.cover} alt={`Cover of ${current.title}`} />
              </div>
              <div className="book-info">
                <span className="match">
                  <span>✦</span> SELECTED FOR YOU
                </span>
                <h2>{current.title}</h2>
                <p className="author">by {current.author}</p>
                <div className="rating">
                  <Stars rating={current.rating} />
                  <strong>{current.rating}</strong>
                  <span>· {current.reviews}</span>
                </div>
                <div className="tags">
                  {current.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="rule" />
                <p className="description">{current.description}</p>
                <Button
                  className="text-button"
                  onClick={() => onDetails(current)}
                >
                  VIEW BOOK DETAILS <Icon name="arrow" size={17} />
                </Button>
              </div>
            </article>
            <div className="actions">
              <Button
                className="reject"
                onClick={() => onDecision("Not for Me")}
                disabled={Boolean(cardMotion)}
              >
                <Icon name="x" /> <span>Not for me</span>
              </Button>
              <Button
                className="back"
                onClick={onBack}
                disabled={!canBack || Boolean(cardMotion)}
              >
                <Icon name="back" />
                <span>Back</span>
              </Button>
              <Button
                className="recommend"
                onClick={() => onDecision("TBR")}
                disabled={Boolean(cardMotion)}
              >
                <Icon name="heart" />
                <span>Recommend</span>
              </Button>
            </div>
            <div className="progress">
              <span>
                Book {index + 1} of {total}
              </span>
              <div>
                <i style={{ width: `${((index + 1) / total) * 100}%` }} />
              </div>
              <span className="shortcuts">
                <kbd>←</kbd> Skip <kbd>→</kbd> Recommend
              </span>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="book" size={28} />
            </span>
            <h2>
              {total
                ? "You’ve explored every pick!"
                : "No books found in this nook"}
            </h2>
            <p>
              {total
                ? "Your bookshelf is looking more like you already. Check back soon for fresh recommendations."
                : "Try another title, author, or genre to discover something wonderful."}
            </p>
            <Button className="primary" onClick={reset}>
              Start a new discovery
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}

function Reviews({
  reviews,
  onDetails,
}: {
  reviews: UserReview[]
  onDetails: (b: Book) => void
}) {
  const [query, setQuery] = useState("")
  const visible = books.filter((b) =>
    `${b.title} ${b.author}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <main className="page-container">
      <section className="page-heading review-heading">
        <div>
          <span className="eyebrow">REVIEWS / RATINGS / READERS</span>
          <h1>
            WHAT READERS THINK<span>.</span>
          </h1>
          <p>Honest notes, strong opinions, and books worth talking about.</p>
        </div>
        <Search
          value={query}
          onChange={setQuery}
          placeholder="Search books, authors, or genres…"
        />
      </section>
      <div className="section-label">
        <span>FEATURED REVIEWS</span>
        <small>Thoughts from the BookNest community</small>
      </div>
      {visible.length ? (
        <div className="review-grid">
          {visible.map((book, i) => {
            const bookReviews = reviews.filter(
              (review) => review.bookId === book.id,
            )
            const latest = bookReviews[0]
            const average = reviewAverage(book, reviews)
            return (
              <article
                className={`review-card ${i === 0 ? "featured" : ""}`}
                key={book.id}
                onClick={() => onDetails(book)}
              >
                <img src={book.cover} alt="" />
                <div>
                  <span className="genre">{book.genre}</span>
                  <h3>{book.title}</h3>
                  <p className="author">by {book.author}</p>
                  <div className="rating">
                    <Stars rating={average} />
                    <strong>{average}</strong>
                    <span>
                      · {bookReviews.length}{" "}
                      {bookReviews.length === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                  <blockquote>
                    “
                    {latest?.text ??
                      (i === 0
                        ? "A timeless adventure that feels both grand and deeply personal. Every return visit reveals something new."
                        : i === 1
                          ? "Practical, clear, and genuinely useful—the kind of book that earns a spot on your desk."
                          : "Beautifully observed, sharp, and full of characters who stay with you.")}
                    ”
                  </blockquote>
                  <Button className="text-button">
                    READ {bookReviews.length ? "REVIEWS" : "BOOK DETAILS"}{" "}
                    <Icon name="chevron" size={16} />
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="search" />
          </span>
          <h2>No books found</h2>
          <p>Try a different title, author, or genre.</p>
        </div>
      )}
      <section className="submitted-reviews">
        <div className="section-label">
          <span>LATEST COMMUNITY REVIEWS</span>
          <small>{reviews.length} submitted reviews</small>
        </div>
        {reviews.length ? (
          <div className="submitted-review-list">
            {[...reviews]
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              .map((review) => {
                const book = books.find((item) => item.id === review.bookId)
                return (
                  <article className="submitted-review" key={review.id}>
                    <div className="submitted-review-meta">
                      <span>{review.reviewer}</span>
                      <time dateTime={review.date}>
                        {new Date(review.date).toLocaleDateString()}
                      </time>
                    </div>
                    <h3>{review.title}</h3>
                    <div className="rating">
                      <Stars rating={review.rating} />
                      <strong>{review.rating}/5</strong>
                    </div>
                    <p>{review.text}</p>
                    <button onClick={() => book && onDetails(book)}>
                      {book?.title ?? "Book"} · Read all reviews
                    </button>
                  </article>
                )
              })}
          </div>
        ) : (
          <div className="review-feed-empty">
            Submitted reviews will appear here instantly.
          </div>
        )}
      </section>
    </main>
  )
}

function RatingEditor({
  initialRating = 0,
  onSave,
  onCancel,
}: {
  initialRating?: number
  onSave: (rating: number) => void
  onCancel?: () => void
}) {
  const [draft, setDraft] = useState(initialRating)
  return (
    <div className="personal-rating-editor">
      <span>YOUR RATING</span>
      <Stars rating={draft} interactive onChange={setDraft} />
      <div>
        {onCancel && (
          <Button className="rating-cancel" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          className="rating-save"
          disabled={!draft}
          onClick={() => onSave(draft)}
        >
          Save Rating
        </Button>
      </div>
    </div>
  )
}

function MyBooks({
  statuses,
  ratings,
  dates,
  onStatusChange,
  onRatingSave,
  onDetails,
}: {
  statuses: Record<number, Status>
  ratings: Record<number, number>
  dates: Record<number, string>
  onStatusChange: (bookId: number, status: Status) => void
  onRatingSave: (bookId: number, rating: number) => void
  onDetails: (b: Book) => void
}) {
  const [filter, setFilter] = useState<LibraryList>("TBR")
  const [sort, setSort] = useState("Recently Added")
  const [ratingBook, setRatingBook] = useState<number | null>(null)
  const inList = (book: Book, list: LibraryList) =>
    list === "TBR"
      ? statuses[book.id] === "TBR" || statuses[book.id] === "Currently Reading"
      : statuses[book.id] === list
  const list = books
    .filter((book) => inList(book, filter))
    .sort((a, b) =>
      sort === "Title A–Z"
        ? a.title.localeCompare(b.title)
        : (dates[b.id] ?? "").localeCompare(dates[a.id] ?? ""),
    )
  const count = (listName: LibraryList) =>
    books.filter((book) => inList(book, listName)).length
  const emptyCopy: Record<LibraryList, string> = {
    TBR: "Your reading list is waiting for its first book.",
    Read: "Books you've finished will appear here.",
    "Not for Me": "Books you pass on will appear here.",
  }
  return (
    <main className="page-container">
      <section className="page-heading shelf-heading">
        <div>
          <span className="eyebrow">SAVED / READ / REMEMBERED</span>
          <h1>
            MY PERSONAL LIBRARY<span>.</span>
          </h1>
          <p>Your reading journey, all in one place.</p>
        </div>
        <div className="shelf-photo">
          <CuteBookIllustration />
        </div>
      </section>
      <div className="summary-row" key={filter}>
        {([
          ["TBR", "book", "Waiting to be read"],
          ["Read", "check", "Finished books"],
          ["Not for Me", "x", "Passed discoveries"],
        ] as [LibraryList, string, string][]).map(([status, icon, label]) => (
          <button
            className={filter === status ? "active" : ""}
            key={status}
            onClick={() => setFilter(status)}
          >
            <span>
              <Icon name={icon} />
            </span>
            <strong>{count(status)}</strong>
            <div>
              <b>{status}</b>
              <small>{label}</small>
            </div>
          </button>
        ))}
      </div>
      <div className="library-toolbar">
        <div className="library-tabs">
          {(["TBR", "Read", "Not for Me"] as LibraryList[]).map((s) => (
            <button
              className={filter === s ? "active" : ""}
              onClick={() => setFilter(s)}
              key={s}
            >
              {s}
              <span>{count(s)}</span>
            </button>
          ))}
        </div>
        <label className="sort">
          <Icon name="sort" size={17} />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Recently Added</option>
            <option>Title A–Z</option>
          </select>
        </label>
      </div>
      {list.length ? (
        <div className="book-grid">
          {list.map((book) => (
            <article className="shelf-card" key={book.id}>
              <button className="cover-button" onClick={() => onDetails(book)}>
                <img src={book.cover} alt={`Cover of ${book.title}`} />
                <span>{statuses[book.id]}</span>
              </button>
              <div className="shelf-card-info">
                <span className="genre">{book.genre}</span>
                <h3>{book.title}</h3>
                <p>by {book.author}</p>
                <small className="date-added">
                  Added{" "}
                  {dates[book.id]
                    ? new Date(dates[book.id]).toLocaleDateString()
                    : "today"}
                </small>
                {filter === "Read" && ratings[book.id] && (
                  <div className="saved-rating">
                    <Stars rating={ratings[book.id]} />
                    <span>{ratings[book.id]}/5</span>
                  </div>
                )}
                <select
                  aria-label={`Reading status for ${book.title}`}
                  value={statuses[book.id]}
                  onChange={(e) => {
                    const nextStatus = e.target.value as Status
                    onStatusChange(book.id, nextStatus)
                    if (nextStatus === "Read") setRatingBook(book.id)
                  }}
                >
                  <option value="TBR">Want to Read (TBR)</option>
                  <option>Currently Reading</option>
                  <option>Read</option>
                  <option>Not for Me</option>
                </select>
                <div className="library-card-actions">
                  {filter === "TBR" && (
                    <Button
                      className="move-read"
                      onClick={() => {
                        onStatusChange(book.id, "Read")
                        setRatingBook(book.id)
                      }}
                    >
                      Move to Read
                    </Button>
                  )}
                  {filter === "Read" && (
                    <Button
                      className="rate-book"
                      onClick={() => setRatingBook(book.id)}
                    >
                      {ratings[book.id] ? "Edit Rating" : "Rate This Book"}
                    </Button>
                  )}
                  {filter === "Not for Me" && (
                    <Button
                      className="move-read"
                      onClick={() => onStatusChange(book.id, "TBR")}
                    >
                      Move to TBR
                    </Button>
                  )}
                </div>
                {ratingBook === book.id && (
                  <RatingEditor
                    initialRating={ratings[book.id]}
                    onCancel={() => setRatingBook(null)}
                    onSave={(rating) => {
                      onRatingSave(book.id, rating)
                      setRatingBook(null)
                    }}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name={filter === "Not for Me" ? "x" : "book"} />
          </span>
          <h2>No {filter.toLowerCase()} books yet</h2>
          <p>{emptyCopy[filter]}</p>
        </div>
      )}
    </main>
  )
}

function BookModal({
  book,
  status,
  personalRating,
  reviews,
  onStatusChange,
  onRatingSave,
  onReviewSubmit,
  onClose,
}: {
  book: Book
  status?: Status
  personalRating?: number
  reviews: UserReview[]
  onStatusChange: (bookId: number, status: Status) => void
  onRatingSave: (bookId: number, rating: number) => void
  onReviewSubmit: (
    review: Omit<UserReview, "id" | "date">,
  ) => { success: boolean message: string }
  onClose: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [showPersonalRating, setShowPersonalRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewer, setReviewer] = useState("")
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewText, setReviewText] = useState("")
  const [formError, setFormError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const average = reviewAverage(book, reviews)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (
      !reviewer.trim() ||
      !reviewTitle.trim() ||
      !reviewText.trim() ||
      !rating
    ) {
      setFormError("Please complete every field and choose a star rating.")
      return
    }
    const result = onReviewSubmit({
      bookId: book.id,
      reviewer: reviewer.trim(),
      rating,
      title: reviewTitle.trim(),
      text: reviewText.trim(),
    })
    if (!result.success) {
      setFormError(result.message)
      return
    }
    setFormError("")
    setSubmitted(true)
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${book.title} details`}
      >
        <Button
          className="modal-close"
          ariaLabel="Close details"
          onClick={onClose}
        >
          <Icon name="close" />
        </Button>
        <div className="modal-top">
          <img src={book.cover} alt={`Cover of ${book.title}`} />
          <div>
            <span className="eyebrow">
              {book.genre} · {book.openLibraryId}
            </span>
            <h2>{book.title}</h2>
            <p className="author">by {book.author}</p>
            <div className="rating">
              <Stars rating={average} />
              <strong>{average}</strong>
              <span>
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
            <div className="tags">
              {book.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <p className="modal-description">{book.description}</p>
            <div className="modal-library-controls">
              <label>
                Reading Status
                <select
                  value={status ?? ""}
                  onChange={(event) => {
                    const nextStatus = event.target.value as Status
                    if (!nextStatus) return
                    onStatusChange(book.id, nextStatus)
                    if (nextStatus === "Read") setShowPersonalRating(true)
                  }}
                >
                  <option value="">Add to My Books</option>
                  <option value="TBR">Want to Read (TBR)</option>
                  <option>Currently Reading</option>
                  <option>Read</option>
                  <option>Not for Me</option>
                </select>
              </label>
              <Button
                className="primary"
                onClick={() => setShowForm(!showForm)}
              >
                Write a Review
              </Button>
            </div>
            {status === "Read" && !showPersonalRating && (
              <div className="modal-personal-rating">
                <span>YOUR RATING</span>
                {personalRating ? (
                  <Stars rating={personalRating} />
                ) : (
                  <small>Not rated yet</small>
                )}
                <Button
                  className="rate-book"
                  onClick={() => setShowPersonalRating(true)}
                >
                  {personalRating ? "Edit Rating" : "Rate This Book"}
                </Button>
              </div>
            )}
            {status === "Read" && showPersonalRating && (
              <RatingEditor
                initialRating={personalRating}
                onCancel={() => setShowPersonalRating(false)}
                onSave={(nextRating) => {
                  onRatingSave(book.id, nextRating)
                  setShowPersonalRating(false)
                }}
              />
            )}
          </div>
        </div>
        {!showForm && (
          <div className="review-breakdown">
            <div>
              <h3>Reader sentiment</h3>
              <strong>{average}</strong>
              <Stars rating={average} />
              <small>{reviews.length} submitted reader reviews</small>
            </div>
            <div className="bars">
              {[82, 64, 28, 9, 3].map((w, i) => (
                <p key={w}>
                  <span>{5 - i}</span>
                  <i>
                    <b style={{ width: `${w}%` }} />
                  </i>
                </p>
              ))}
            </div>
            <blockquote>
              “A warm, memorable read with characters that feel wonderfully
              alive.”<small>— Sample reader review</small>
            </blockquote>
          </div>
        )}
        {showForm &&
          (submitted ? (
            <div className="submission">
              <span>
                <Icon name="check" />
              </span>
              <h3>Review submitted</h3>
              <p>
                Thanks for sharing your perspective with the BookNest community.
              </p>
            </div>
          ) : (
            <form className="review-form" onSubmit={submit}>
              <div>
                <h3>Share your take</h3>
                <p>Your review will appear instantly across BookNest.</p>
              </div>
              {formError && <p className="form-error">{formError}</p>}
              <label>
                Your rating{" "}
                <Stars rating={rating} interactive onChange={setRating} />
              </label>
              <label>
                Your name
                <input
                  required
                  value={reviewer}
                  onChange={(event) => setReviewer(event.target.value)}
                  placeholder="How should your name appear?"
                />
              </label>
              <label>
                Review title
                <input
                  required
                  value={reviewTitle}
                  onChange={(event) => setReviewTitle(event.target.value)}
                  placeholder="Sum up your thoughts"
                />
              </label>
              <label>
                Your review
                <textarea
                  required
                  rows={4}
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="What did you enjoy? What stayed with you?"
                />
              </label>
              <div>
                <Button
                  className="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="primary">
                  Submit Review
                </Button>
              </div>
            </form>
          ))}
        <section className="modal-review-list">
          <div className="section-label">
            <span>READER REVIEWS</span>
            <small>{reviews.length} total</small>
          </div>
          {reviews.length ? (
            reviews.map((review) => (
              <article key={review.id}>
                <div>
                  <strong>{review.reviewer}</strong>
                  <time dateTime={review.date}>
                    {new Date(review.date).toLocaleDateString()}
                  </time>
                </div>
                <h3>{review.title}</h3>
                <Stars rating={review.rating} />
                <p>{review.text}</p>
              </article>
            ))
          ) : (
            <p className="modal-no-reviews">
              No reader reviews yet. Be the first to share your take.
            </p>
          )}
        </section>
      </section>
    </div>
  )
}

export default App
