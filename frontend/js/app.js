import { api } from "./api.js";

const GENRES = ["All", "Fiction", "Fantasy", "Mystery", "Romance", "Non-fiction"];
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  x: '<path d="m18 6-12 12"/><path d="m6 6 12 12"/>',
  back: '<path d="m9 14-4-4 4-4"/><path d="M5 10h8a6 6 0 0 1 6 6v1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  sort: '<path d="M3 6h18"/><path d="M6 12h12"/><path d="M10 18h4"/>',
  close: '<path d="m18 6-12 12"/><path d="m6 6 12 12"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/>',
  shuffle:
    '<path d="M16 3h5v5"/><path d="m4 20 5-5"/><path d="m21 3-7 7"/><path d="M16 16h5v5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',
};

const state = {
  page: "discover",
  theme: localStorage.getItem("booknest-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  books: [],
  reviews: [],
  library: { statuses: {}, ratings: {}, dates: {} },
  selected: null,
  toast: "",
  loading: false,
  error: "",
  search: "",
  genre: "All",
  reviewSearch: "",
  discoverIndex: 0,
  history: [],
  cardMotion: "",
  browseQuery: "",
  browseGenre: "All",
  shuffleCount: 0,
  libraryFilter: "TBR",
  librarySort: "Recently Added",
  ratingBook: null,
  showForm: false,
  showPersonalRating: false,
  form: { rating: 0, reviewer: "", title: "", text: "", error: "", submitted: false },
};

const $ = (sel, root = document) => root.querySelector(sel);
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function icon(name, size = 20) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
}

function stars(rating, interactive = false, field = "rating") {
  const rounded = Math.round(Number(rating) || 0);
  return `<span class="stars ${interactive ? "interactive" : ""}" aria-label="${rounded} stars">${[1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<button type="button" data-action="${interactive ? "set-star" : ""}" data-value="${n}" ${interactive ? "" : "disabled"} class="${n <= rounded ? "filled" : ""}">★</button>`,
    )
    .join("")}</span>`;
}

function coverHtml(book, extra = "") {
  const label = escapeHtml((book.title || "Book").slice(0, 18));
  if (book.cover) {
    return `<img src="${escapeHtml(book.cover)}" alt="Cover of ${escapeHtml(book.title)}" ${extra} onerror="this.outerHTML='<div class=&quot;cover-fallback&quot;>${label}</div>'">`;
  }
  return `<div class="cover-fallback" ${extra}>${label}</div>`;
}

function cuteBook() {
  return `<svg class="cute-book-illustration" viewBox="0 0 340 250" role="img" aria-label="A cute purple book with friendly eyes">
    <path d="M79 38h157c18 0 31 13 31 31v130c0 9-7 16-16 16H90c-14 0-25-11-25-25V52c0-8 6-14 14-14Z" fill="#B64BFF" stroke="#111111" stroke-width="7"/>
    <path d="M91 42v172" fill="none" stroke="#4522F5" stroke-width="19"/>
    <path d="M96 196h151c9 0 16 7 16 16v3H91v-14c0-3 2-5 5-5Z" fill="#F8F3E8" stroke="#111111" stroke-width="7"/>
    <path d="M118 44h22v44l-11-9-11 9V44Z" fill="#4522F5" stroke="#111111" stroke-width="5" stroke-linejoin="round"/>
    <ellipse cx="154" cy="120" rx="24" ry="29" fill="#FFFFFF"/><ellipse cx="220" cy="120" rx="24" ry="29" fill="#FFFFFF"/>
    <circle cx="160" cy="124" r="10" fill="#111111"/><circle cx="226" cy="124" r="10" fill="#111111"/>
    <circle cx="164" cy="120" r="3" fill="#FFFFFF"/><circle cx="230" cy="120" r="3" fill="#FFFFFF"/>
    <path d="M166 163c12 11 29 11 41 0" fill="none" stroke="#111111" stroke-width="7" stroke-linecap="round"/>
  </svg>`;
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.colorScheme = state.theme;
  localStorage.setItem("booknest-theme", state.theme);
}

function showToast(message) {
  state.toast = message;
  render();
  window.setTimeout(() => {
    if (state.toast === message) {
      state.toast = "";
      const toast = $(".toast");
      if (toast) toast.remove();
    }
  }, 2200);
}

function bookById(id) {
  return state.books.find((book) => book.id === id);
}

function reviewsFor(bookId) {
  return state.reviews.filter((review) => review.bookId === bookId);
}

function averageFor(book) {
  const list = reviewsFor(book.id);
  if (!list.length) return Number(book.rating || 0).toFixed(1);
  const sum = list.reduce((total, review) => total + review.rating, 0);
  return ((sum + Number(book.rating || 0)) / (list.length + (book.rating ? 1 : 0) || 1)).toFixed(1);
}

function inList(book, list) {
  const status = state.library.statuses[book.id];
  if (list === "TBR") return status === "TBR" || status === "Currently Reading";
  return status === list;
}

function bindReveal() {
  const header = $(".topbar");
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 24);
  updateHeader();
  window.onscroll = () => {
    updateHeader();
    const stage = $(".hero-book-stage");
    if (!stage || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = stage.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
    const progress = (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height);
    stage.style.setProperty("--scroll-shift", `${(progress - 0.5) * 34}px`);
    stage.style.setProperty("--shape-scroll", `${(progress - 0.5) * -15}px`);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px" },
  );
  document
    .querySelectorAll(
      ".discover-hero .hero-copy > *, .discover-hero .hero-tools, .browse-book-card, .review-card, .submitted-review, .summary-row > button, .shelf-card, .page-heading > *, .section-label, .library-toolbar, .empty-state",
    )
    .forEach((target, index) => {
      target.classList.add("reveal");
      target.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 70}ms`);
      observer.observe(target);
    });
}

function searchField(value, placeholder, action) {
  return `<label class="search-field">${icon("search")}<input data-field="${action}" value="${escapeHtml(value)}" placeholder="${placeholder}"/>${
    value
      ? `<button type="button" class="btn clear-search" data-action="clear-${action}" aria-label="Clear search">${icon("close", 16)}</button>`
      : ""
  }</label>`;
}

function renderHeader() {
  return `<header class="topbar">
    <button class="brand" data-action="navigate" data-page="discover" aria-label="BookNest home">
      <span class="brand-mark">${icon("book", 19)}</span><span>Book<span>Nest</span></span>
    </button>
    <nav aria-label="Main navigation">
      ${[
        ["discover", "Discover"],
        ["reviews", "Book Review"],
        ["books", "My Books"],
      ]
        .map(
          ([key, label]) =>
            `<button class="${state.page === key ? "active" : ""}" data-action="navigate" data-page="${key}">${label}</button>`,
        )
        .join("")}
    </nav>
    <div class="nav-actions">
      <button class="theme-toggle" data-action="toggle-theme" aria-label="Switch theme" aria-pressed="${state.theme === "dark"}">
        <span class="${state.theme === "light" ? "active" : ""}">${icon("sun", 16)}</span>
        <span class="${state.theme === "dark" ? "active" : ""}">${icon("moon", 15)}</span>
      </button>
      <button class="avatar" aria-label="View profile">AM</button>
    </div>
  </header>`;
}

function renderDiscover() {
  const visible = state.books.filter((book) => {
    const text = `${book.title} ${book.author} ${book.genre}`.toLowerCase();
    return text.includes(state.browseQuery.toLowerCase()) && (state.browseGenre === "All" || book.genre === state.browseGenre);
  });
  const featured = state.books[0];
  return `<main>
    <section class="editorial-hero">
      <div class="editorial-intro">
        <span class="hero-index">BOOKNEST / 001</span>
        <h1>YOUR NEXT<br>FAVORITE<br>BOOK.</h1>
        <p>Browse stories that match your curiosity, open their details, and build a library that feels entirely your own.</p>
        <div class="hero-actions">
          <button class="btn editorial-primary" data-action="scroll-browse">START DISCOVERING ${icon("arrow", 18)}</button>
          <button class="btn editorial-secondary" data-action="navigate" data-page="books">EXPLORE MY BOOKS</button>
        </div>
      </div>
      <div class="hero-book-stage">
        <div class="purple-shape"></div>
        <span class="vertical-note">CURATED FOR CURIOUS MINDS</span>
        ${featured ? coverHtml(featured) : `<div class="cover-fallback">Loading</div>`}
        <div class="hero-book-meta">
          <span>${escapeHtml(featured?.genre || "Catalog")} / ${escapeHtml(featured?.year || "")}</span>
          <h2>${escapeHtml(featured?.title || "Finding books…")}</h2>
          <p>${escapeHtml(featured?.author || "Open Library")}</p>
          ${featured ? `<button class="btn" data-action="status" data-id="${escapeHtml(featured.id)}" data-status="TBR">ADD TO TBR</button>` : ""}
        </div>
      </div>
    </section>
    <section class="browse-section">
      <div class="discover-hero">
        <div class="hero-copy">
          <span class="eyebrow">BROWSE / SEARCH / EXPLORE</span>
          <h1>DISCOVER<br><em>NEW BOOKS.</em></h1>
          <p>Explore the shelf and find something unexpected.</p>
        </div>
        <div class="hero-tools">
          ${searchField(state.browseQuery, "Search books, authors, or genres…", "browseQuery")}
          <div class="browse-filter-row">
            <div class="chips">${GENRES.map((item) => `<button data-action="browse-genre" data-value="${item}" class="${state.browseGenre === item ? "active" : ""}">${item}</button>`).join("")}</div>
            <button class="btn shuffle-books" data-action="shuffle">${icon("shuffle", 16)} Shuffle</button>
          </div>
        </div>
      </div>
      ${state.loading ? `<div class="loading-banner">Loading live books from Open Library…</div>` : ""}
      ${state.error ? `<div class="error-banner">${escapeHtml(state.error)}</div>` : ""}
      ${
        visible.length
          ? `<div class="browse-grid">${visible
              .map(
                (book, index) => `<button class="browse-book-card" data-action="details" data-id="${escapeHtml(book.id)}" style="--card-index:${index}">
                <div class="browse-cover"><span>0${index + 1}</span>${coverHtml(book)}</div>
                <div class="browse-book-copy"><small>${escapeHtml(book.genre)} / ${escapeHtml(book.year)}</small><h2>${escapeHtml(book.title)}</h2><p>${escapeHtml(book.author)}</p><span class="browse-more">VIEW DETAILS ${icon("arrow", 15)}</span></div>
              </button>`,
              )
              .join("")}</div>`
          : `<div class="empty-state"><span class="empty-icon">${icon("search")}</span><h2>No books found</h2><p>Try a different title, author, or genre.</p></div>`
      }
    </section>
  </main>`;
}

function renderReviewDeck() {
  const filtered = state.books.filter((book) => {
    const query = state.search.toLowerCase();
    return (!query || `${book.title} ${book.author} ${book.genre}`.toLowerCase().includes(query)) && (state.genre === "All" || book.genre === state.genre);
  });
  const current = filtered[state.discoverIndex];
  const total = filtered.length;
  return `<main>
    <section class="discover-hero">
      <div class="hero-copy">
        <span class="eyebrow">REVIEW / DECIDE / SAVE</span>
        <h1>MAKE YOUR<br><em>NEXT PICK.</em></h1>
        <p>Recommend it, pass on it, or go back and reconsider.</p>
      </div>
      <div class="hero-tools">
        ${searchField(state.search, "Search books, authors, or genres…", "search")}
        <div class="chips">${GENRES.map((g) => `<button data-action="review-genre" data-value="${g}" class="${state.genre === g ? "active" : ""}">${g}</button>`).join("")}</div>
      </div>
    </section>
    <section class="discovery-stage">
      ${
        current
          ? `<article class="discovery-card ${state.cardMotion}">
              <div class="cover-wrap"><span class="pick-label">TODAY’S DISCOVERY</span><div class="cover-glow" style="background:${escapeHtml(current.accent || "#4522f5")}"></div>${coverHtml(current)}</div>
              <div class="book-info">
                <span class="match"><span>✦</span> SELECTED FOR YOU</span>
                <h2>${escapeHtml(current.title)}</h2>
                <p class="author">by ${escapeHtml(current.author)}</p>
                <div class="rating">${stars(averageFor(current))}<strong>${averageFor(current)}</strong><span>· ${reviewsFor(current.id).length} reviews</span></div>
                <div class="tags">${(current.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
                <div class="rule"></div>
                <p class="description">${escapeHtml(current.description)}</p>
                <button class="btn text-button" data-action="details" data-id="${escapeHtml(current.id)}">VIEW BOOK DETAILS ${icon("arrow", 17)}</button>
              </div>
            </article>
            <div class="actions">
              <button class="btn reject" data-action="decide" data-status="Not for Me" ${state.cardMotion ? "disabled" : ""}>${icon("x")} <span>Not for me</span></button>
              <button class="btn back" data-action="go-back" ${!state.history.length || state.cardMotion ? "disabled" : ""}>${icon("back")}<span>Back</span></button>
              <button class="btn recommend" data-action="decide" data-status="TBR" ${state.cardMotion ? "disabled" : ""}>${icon("heart")}<span>Recommend</span></button>
            </div>
            <div class="progress"><span>Book ${state.discoverIndex + 1} of ${total}</span><div><i style="width:${((state.discoverIndex + 1) / total) * 100}%"></i></div><span class="shortcuts"><kbd>←</kbd> Skip <kbd>→</kbd> Recommend</span></div>`
          : `<div class="empty-state"><span class="empty-icon">${icon("book", 28)}</span><h2>${total ? "You’ve explored every pick!" : "No books found in this nook"}</h2><p>${total ? "Your bookshelf is looking more like you already." : "Try another title, author, or genre."}</p><button class="btn primary" data-action="reset-deck">Start a new discovery</button></div>`
      }
    </section>
  </main>
  <main class="page-container">
    <section class="page-heading review-heading">
      <div><span class="eyebrow">REVIEWS / RATINGS / READERS</span><h1>WHAT READERS THINK<span>.</span></h1><p>Honest notes, strong opinions, and books worth talking about.</p></div>
      ${searchField(state.reviewSearch, "Search books, authors, or genres…", "reviewSearch")}
    </section>
    <div class="section-label"><span>FEATURED REVIEWS</span><small>Thoughts from the BookNest community</small></div>
    ${renderReviewCards()}
    <section class="submitted-reviews">
      <div class="section-label"><span>LATEST COMMUNITY REVIEWS</span><small>${state.reviews.length} submitted reviews</small></div>
      ${
        state.reviews.length
          ? `<div class="submitted-review-list">${[...state.reviews]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((review) => {
                const book = bookById(review.bookId);
                return `<article class="submitted-review">
                  <div class="submitted-review-meta"><span>${escapeHtml(review.reviewer)}</span><time datetime="${escapeHtml(review.date)}">${new Date(review.date).toLocaleDateString()}</time></div>
                  <h3>${escapeHtml(review.title)}</h3>
                  <div class="rating">${stars(review.rating)}<strong>${review.rating}/5</strong></div>
                  <p>${escapeHtml(review.text)}</p>
                  <button data-action="details" data-id="${escapeHtml(review.bookId)}">${escapeHtml(book?.title || "Book")} · Read all reviews</button>
                </article>`;
              })
              .join("")}</div>`
          : `<div class="review-feed-empty">Submitted reviews will appear here instantly.</div>`
      }
    </section>
  </main>`;
}

function renderReviewCards() {
  const visible = state.books.filter((book) => `${book.title} ${book.author}`.toLowerCase().includes(state.reviewSearch.toLowerCase()));
  if (!visible.length) {
    return `<div class="empty-state"><span class="empty-icon">${icon("search")}</span><h2>No books found</h2><p>Try a different title, author, or genre.</p></div>`;
  }
  return `<div class="review-grid">${visible
    .map((book, i) => {
      const bookReviews = reviewsFor(book.id);
      const latest = bookReviews[0];
      const fallback = [
        "A timeless adventure that feels both grand and deeply personal.",
        "Practical, clear, and genuinely useful.",
        "Beautifully observed, sharp, and full of characters who stay with you.",
      ][i % 3];
      return `<article class="review-card ${i === 0 ? "featured" : ""}" data-action="details" data-id="${escapeHtml(book.id)}">
        ${coverHtml(book)}
        <div>
          <span class="genre">${escapeHtml(book.genre)}</span>
          <h3>${escapeHtml(book.title)}</h3>
          <p class="author">by ${escapeHtml(book.author)}</p>
          <div class="rating">${stars(averageFor(book))}<strong>${averageFor(book)}</strong><span>· ${bookReviews.length} ${bookReviews.length === 1 ? "review" : "reviews"}</span></div>
          <blockquote>“${escapeHtml(latest?.text || fallback)}”</blockquote>
          <button class="btn text-button">READ ${bookReviews.length ? "REVIEWS" : "BOOK DETAILS"} ${icon("chevron", 16)}</button>
        </div>
      </article>`;
    })
    .join("")}</div>`;
}

function renderLibrary() {
  const filter = state.libraryFilter;
  const list = state.books
    .filter((book) => inList(book, filter))
    .sort((a, b) =>
      state.librarySort === "Title A–Z"
        ? a.title.localeCompare(b.title)
        : String(state.library.dates[b.id] || "").localeCompare(String(state.library.dates[a.id] || "")),
    );
  const count = (name) => state.books.filter((book) => inList(book, name)).length;
  const emptyCopy = {
    TBR: "Your reading list is waiting for its first book.",
    Read: "Books you've finished will appear here.",
    "Not for Me": "Books you pass on will appear here.",
  };
  return `<main class="page-container">
    <section class="page-heading shelf-heading">
      <div><span class="eyebrow">SAVED / READ / REMEMBERED</span><h1>MY PERSONAL LIBRARY<span>.</span></h1><p>Your reading journey, all in one place.</p></div>
      <div class="shelf-photo">${cuteBook()}</div>
    </section>
    <div class="summary-row">
      ${[
        ["TBR", "book", "Waiting to be read"],
        ["Read", "check", "Finished books"],
        ["Not for Me", "x", "Passed discoveries"],
      ]
        .map(
          ([status, ico, label]) =>
            `<button class="${filter === status ? "active" : ""}" data-action="library-filter" data-value="${status}"><span>${icon(ico)}</span><strong>${count(status)}</strong><div><b>${status}</b><small>${label}</small></div></button>`,
        )
        .join("")}
    </div>
    <div class="library-toolbar">
      <div class="library-tabs">${["TBR", "Read", "Not for Me"].map((s) => `<button class="${filter === s ? "active" : ""}" data-action="library-filter" data-value="${s}">${s}<span>${count(s)}</span></button>`).join("")}</div>
      <label class="sort">${icon("sort", 17)}<select data-field="librarySort"><option${state.librarySort === "Recently Added" ? " selected" : ""}>Recently Added</option><option${state.librarySort === "Title A–Z" ? " selected" : ""}>Title A–Z</option></select></label>
    </div>
    ${
      list.length
        ? `<div class="book-grid">${list
            .map((book) => {
              const status = state.library.statuses[book.id];
              const rating = state.library.ratings[book.id];
              return `<article class="shelf-card">
                <button class="cover-button" data-action="details" data-id="${escapeHtml(book.id)}">${coverHtml(book)}<span>${escapeHtml(status)}</span></button>
                <div class="shelf-card-info">
                  <span class="genre">${escapeHtml(book.genre)}</span>
                  <h3>${escapeHtml(book.title)}</h3>
                  <p>by ${escapeHtml(book.author)}</p>
                  <small class="date-added">Added ${state.library.dates[book.id] ? new Date(state.library.dates[book.id]).toLocaleDateString() : "today"}</small>
                  ${filter === "Read" && rating ? `<div class="saved-rating">${stars(rating)}<span>${rating}/5</span></div>` : ""}
                  <select aria-label="Reading status for ${escapeHtml(book.title)}" data-action="status-select" data-id="${escapeHtml(book.id)}">
                    <option value="TBR" ${status === "TBR" ? "selected" : ""}>Want to Read (TBR)</option>
                    <option value="Currently Reading" ${status === "Currently Reading" ? "selected" : ""}>Currently Reading</option>
                    <option value="Read" ${status === "Read" ? "selected" : ""}>Read</option>
                    <option value="Not for Me" ${status === "Not for Me" ? "selected" : ""}>Not for Me</option>
                  </select>
                  <div class="library-card-actions">
                    ${filter === "TBR" ? `<button class="btn move-read" data-action="status" data-id="${escapeHtml(book.id)}" data-status="Read">Move to Read</button>` : ""}
                    ${filter === "Read" ? `<button class="btn rate-book" data-action="open-rating" data-id="${escapeHtml(book.id)}">${rating ? "Edit Rating" : "Rate This Book"}</button>` : ""}
                    ${filter === "Not for Me" ? `<button class="btn move-read" data-action="status" data-id="${escapeHtml(book.id)}" data-status="TBR">Move to TBR</button>` : ""}
                  </div>
                  ${
                    state.ratingBook === book.id
                      ? `<div class="personal-rating-editor"><span>YOUR RATING</span>${stars(state.form.rating || rating || 0, true)}<div><button class="btn rating-cancel" data-action="cancel-rating">Cancel</button><button class="btn rating-save" data-action="save-rating" data-id="${escapeHtml(book.id)}">Save Rating</button></div></div>`
                      : ""
                  }
                </div>
              </article>`;
            })
            .join("")}</div>`
        : `<div class="empty-state"><span class="empty-icon">${icon(filter === "Not for Me" ? "x" : "book")}</span><h2>No ${filter.toLowerCase()} books yet</h2><p>${emptyCopy[filter]}</p></div>`
    }
  </main>`;
}

function renderModal() {
  const book = state.selected;
  if (!book) return "";
  const reviews = reviewsFor(book.id);
  const status = state.library.statuses[book.id] || "";
  const personalRating = state.library.ratings[book.id];
  const avg = averageFor(book);
  const bars = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => review.rating === star).length;
    const width = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return `<p><span>${star}</span><i><b style="width:${width}%"></b></i></p>`;
  });
  return `<div class="modal-backdrop" data-action="close-modal">
    <section class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(book.title)} details">
      <button class="btn modal-close" data-action="close-modal" aria-label="Close details">${icon("close")}</button>
      <div class="modal-top">
        ${coverHtml(book)}
        <div>
          <span class="eyebrow">${escapeHtml(book.genre)} · ${escapeHtml(book.openLibraryId || book.id)}</span>
          <h2>${escapeHtml(book.title)}</h2>
          <p class="author">by ${escapeHtml(book.author)}</p>
          <div class="rating">${stars(avg)}<strong>${avg}</strong><span>${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}</span></div>
          <div class="tags">${(book.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>
          <p class="modal-description">${escapeHtml(book.description || "No description is available for this title yet.")}</p>
          <div class="modal-library-controls">
            <label>Reading Status
              <select data-action="status-select" data-id="${escapeHtml(book.id)}">
                <option value="">Add to My Books</option>
                <option value="TBR" ${status === "TBR" ? "selected" : ""}>Want to Read (TBR)</option>
                <option value="Currently Reading" ${status === "Currently Reading" ? "selected" : ""}>Currently Reading</option>
                <option value="Read" ${status === "Read" ? "selected" : ""}>Read</option>
                <option value="Not for Me" ${status === "Not for Me" ? "selected" : ""}>Not for Me</option>
              </select>
            </label>
            <button class="btn primary" data-action="toggle-form">Write a Review</button>
          </div>
          ${
            status === "Read" && !state.showPersonalRating
              ? `<div class="modal-personal-rating"><span>YOUR RATING</span>${personalRating ? stars(personalRating) : "<small>Not rated yet</small>"}<button class="btn rate-book" data-action="open-rating" data-id="${escapeHtml(book.id)}">${personalRating ? "Edit Rating" : "Rate This Book"}</button></div>`
              : ""
          }
          ${
            status === "Read" && state.showPersonalRating
              ? `<div class="personal-rating-editor"><span>YOUR RATING</span>${stars(state.form.rating || personalRating || 0, true)}<div><button class="btn rating-cancel" data-action="cancel-rating">Cancel</button><button class="btn rating-save" data-action="save-rating" data-id="${escapeHtml(book.id)}">Save Rating</button></div></div>`
              : ""
          }
        </div>
      </div>
      ${
        !state.showForm
          ? `<div class="review-breakdown"><div><h3>Reader sentiment</h3><strong>${avg}</strong>${stars(avg)}<small>${reviews.length} submitted reader reviews</small></div><div class="bars">${bars.join("")}</div><blockquote>“${escapeHtml(reviews[0]?.text || "Be the first to share a warm, memorable take on this book.")}”<small>— ${escapeHtml(reviews[0]?.reviewer || "BookNest")}</small></blockquote></div>`
          : state.form.submitted
            ? `<div class="submission"><span>${icon("check")}</span><h3>Review submitted</h3><p>Thanks for sharing your perspective with the BookNest community.</p></div>`
            : `<form class="review-form" data-action="submit-review">
                <div><h3>Share your take</h3><p>Your review will appear instantly across BookNest.</p></div>
                ${state.form.error ? `<p class="form-error">${escapeHtml(state.form.error)}</p>` : ""}
                <label>Your rating ${stars(state.form.rating, true)}</label>
                <label>Your name<input required data-form="reviewer" value="${escapeHtml(state.form.reviewer)}" placeholder="How should your name appear?"></label>
                <label>Review title<input required data-form="title" value="${escapeHtml(state.form.title)}" placeholder="Sum up your thoughts"></label>
                <label>Your review<textarea required rows="4" data-form="text" placeholder="What did you enjoy?">${escapeHtml(state.form.text)}</textarea></label>
                <div><button type="button" class="btn secondary" data-action="toggle-form">Cancel</button><button type="submit" class="btn primary">Submit Review</button></div>
              </form>`
      }
      <section class="modal-review-list">
        <div class="section-label"><span>READER REVIEWS</span><small>${reviews.length} total</small></div>
        ${
          reviews.length
            ? reviews
                .map(
                  (review) => `<article>
                    <div><strong>${escapeHtml(review.reviewer)}</strong><time datetime="${escapeHtml(review.date)}">${new Date(review.date).toLocaleDateString()}</time></div>
                    <h3>${escapeHtml(review.title)}</h3>${stars(review.rating)}<p>${escapeHtml(review.text)}</p>
                  </article>`,
                )
                .join("")
            : `<p class="modal-no-reviews">No reader reviews yet. Be the first to share your take.</p>`
        }
      </section>
    </section>
  </div>`;
}

function render() {
  applyTheme();
  const app = $("#app");
  const pageHtml = state.page === "discover" ? renderDiscover() : state.page === "reviews" ? renderReviewDeck() : renderLibrary();
  app.innerHTML = `${renderHeader()}${pageHtml}${renderModal()}${
    state.toast ? `<div class="toast"><span>${icon("check", 17)}</span>${escapeHtml(state.toast)}</div>` : ""
  }<footer><span class="brand compact"><span class="brand-mark">${icon("book", 15)}</span>BookNest</span><p>Made for readers, one page at a time.</p><span>Student project · Open Library · 2026</span></footer>`;
  bindReveal();
}

async function loadCatalog(query = "award winning novels", genre = "All") {
  state.loading = true;
  state.error = "";
  render();
  try {
    const [books, library, reviews] = await Promise.all([
      query === "__random__" ? api.randomBooks() : api.searchBooks(query, genre),
      api.getLibrary(),
      api.getReviews(),
    ]);
    state.books = books.books || books;
    state.library = library;
    state.reviews = reviews.reviews || reviews;
  } catch (error) {
    state.error = error.message || "Could not reach Open Library. Check that the Java server is running.";
  } finally {
    state.loading = false;
    render();
  }
}

async function setStatus(bookId, status) {
  if (!status) return;
  const book = bookById(bookId);
  await api.updateStatus(bookId, status);
  const library = await api.getLibrary();
  state.library = library;
  if (book && !state.books.some((item) => item.id === book.id)) state.books.unshift(book);
  showToast(status === "TBR" ? `“${book?.title}” moved to TBR` : `“${book?.title}” marked as ${status}`);
  if (status === "Read") {
    state.ratingBook = bookId;
    state.showPersonalRating = true;
  }
  render();
}

async function decide(status) {
  const filtered = state.books.filter((book) => {
    const query = state.search.toLowerCase();
    return (!query || `${book.title} ${book.author} ${book.genre}`.toLowerCase().includes(query)) && (state.genre === "All" || book.genre === state.genre);
  });
  const current = filtered[state.discoverIndex];
  if (!current || state.cardMotion) return;
  state.cardMotion = status === "TBR" ? "swipe-right" : "swipe-left";
  render();
  window.setTimeout(async () => {
    await setStatus(current.id, status);
    state.history.push(current.id);
    state.discoverIndex += 1;
    state.cardMotion = "card-enter";
    render();
    window.setTimeout(() => {
      state.cardMotion = "";
      render();
    }, 420);
  }, 280);
}

function goBack() {
  if (!state.history.length || state.discoverIndex === 0 || state.cardMotion) return;
  state.cardMotion = "swipe-back";
  render();
  window.setTimeout(() => {
    state.discoverIndex -= 1;
    state.history.pop();
    state.cardMotion = "card-enter-back";
    render();
    window.setTimeout(() => {
      state.cardMotion = "";
      render();
    }, 420);
  }, 260);
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "navigate") {
    state.page = target.dataset.page;
    state.selected = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
  } else if (action === "toggle-theme") {
    state.theme = state.theme === "light" ? "dark" : "light";
    render();
  } else if (action === "scroll-browse") {
    $(".browse-section")?.scrollIntoView({ behavior: "smooth" });
  } else if (action === "details") {
    const book = bookById(target.dataset.id);
    if (!book) return;
    state.selected = book;
    state.showForm = false;
    state.form = { rating: 0, reviewer: "", title: "", text: "", error: "", submitted: false };
    render();
    try {
      const fresh = await api.getBook(book.id);
      Object.assign(book, fresh);
      state.reviews = (await api.getReviews()).reviews || state.reviews;
      render();
    } catch {
      /* keep cached book if details lookup fails */
    }
  } else if (action === "close-modal") {
    if (target.classList.contains("modal-backdrop") && event.target !== target) return;
    state.selected = null;
    render();
  } else if (action === "browse-genre") {
    state.browseGenre = target.dataset.value;
    loadCatalog(state.browseQuery || "novels", state.browseGenre);
  } else if (action === "review-genre") {
    state.genre = target.dataset.value;
    state.discoverIndex = 0;
    render();
  } else if (action === "shuffle") {
    loadCatalog("__random__");
    state.shuffleCount += 1;
  } else if (action === "status") {
    setStatus(target.dataset.id, target.dataset.status);
  } else if (action === "decide") {
    decide(target.dataset.status);
  } else if (action === "go-back") {
    goBack();
  } else if (action === "reset-deck") {
    state.discoverIndex = 0;
    state.search = "";
    state.genre = "All";
    render();
  } else if (action === "library-filter") {
    state.libraryFilter = target.dataset.value;
    render();
  } else if (action === "open-rating") {
    state.ratingBook = target.dataset.id;
    state.showPersonalRating = true;
    state.form.rating = state.library.ratings[target.dataset.id] || 0;
    render();
  } else if (action === "cancel-rating") {
    state.ratingBook = null;
    state.showPersonalRating = false;
    render();
  } else if (action === "save-rating") {
    if (!state.form.rating) return;
    await api.saveRating(target.dataset.id, state.form.rating);
    state.library = await api.getLibrary();
    state.ratingBook = null;
    state.showPersonalRating = false;
    showToast(`${state.form.rating}-star rating saved`);
  } else if (action === "toggle-form") {
    state.showForm = !state.showForm;
    state.form.submitted = false;
    render();
  } else if (action === "set-star") {
    state.form.rating = Number(target.dataset.value);
    render();
  } else if (action.startsWith("clear-")) {
    const field = action.replace("clear-", "");
    state[field] = "";
    if (field === "browseQuery") loadCatalog("novels", state.browseGenre);
    else render();
  }
});

document.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  const formField = event.target.dataset.form;
  if (field === "browseQuery") state.browseQuery = event.target.value;
  if (field === "search") {
    state.search = event.target.value;
    state.discoverIndex = 0;
  }
  if (field === "reviewSearch") state.reviewSearch = event.target.value;
  if (field === "librarySort") {
    state.librarySort = event.target.value;
    render();
  }
  if (formField) state.form[formField] = event.target.value;
});

document.addEventListener("change", (event) => {
  if (event.target.dataset.action === "status-select") {
    setStatus(event.target.dataset.id, event.target.value);
  }
});

document.addEventListener("keydown", (event) => {
  if (state.page !== "reviews" || state.selected) return;
  if (event.key === "ArrowRight") decide("TBR");
  if (event.key === "ArrowLeft") decide("Not for Me");
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.target.matches("[data-action='submit-review']") || !state.selected) return;
  const { reviewer, title, text, rating } = state.form;
  if (!reviewer.trim() || !title.trim() || !text.trim() || !rating) {
    state.form.error = "Please complete every field and choose a star rating.";
    render();
    return;
  }
  try {
    await api.submitReview({
      bookId: state.selected.id,
      reviewer: reviewer.trim(),
      title: title.trim(),
      text: text.trim(),
      rating,
    });
    state.reviews = (await api.getReviews()).reviews;
    state.form.submitted = true;
    state.form.error = "";
    showToast("Your review is now live");
  } catch (error) {
    state.form.error = error.message || "Could not save this review.";
    render();
  }
});

let browseTimer;
document.addEventListener("input", (event) => {
  if (event.target.dataset.field !== "browseQuery") return;
  window.clearTimeout(browseTimer);
  browseTimer = window.setTimeout(() => loadCatalog(state.browseQuery || "novels", state.browseGenre), 400);
});

document.addEventListener("pointermove", (event) => {
  const stage = event.target.closest(".hero-book-stage");
  if (!stage) return;
  const bounds = stage.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  stage.style.setProperty("--parallax-x", `${x * 16}px`);
  stage.style.setProperty("--parallax-y", `${y * 16}px`);
  stage.style.setProperty("--shape-x", `${x * -6}px`);
  stage.style.setProperty("--shape-y", `${y * -6}px`);
});

document.addEventListener("pointerleave", (event) => {
  if (!event.target.classList?.contains("hero-book-stage")) return;
  event.target.style.setProperty("--parallax-x", "0px");
  event.target.style.setProperty("--parallax-y", "0px");
  event.target.style.setProperty("--shape-x", "0px");
  event.target.style.setProperty("--shape-y", "0px");
}, true);

applyTheme();
render();
loadCatalog("classic novels");
