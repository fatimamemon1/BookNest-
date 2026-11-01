const API = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export const api = {
  searchBooks(query, genre) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (genre && genre !== "All") params.set("genre", genre);
    return request(`/books/search?${params}`);
  },
  randomBooks() {
    return request("/books/random");
  },
  getBook(id) {
    return request(`/books/${encodeURIComponent(id)}`);
  },
  getLibrary() {
    return request("/library");
  },
  updateStatus(bookId, status) {
    return request(`/library/${encodeURIComponent(bookId)}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
  saveRating(bookId, rating) {
    return request(`/library/${encodeURIComponent(bookId)}/rating`, {
      method: "PUT",
      body: JSON.stringify({ rating }),
    });
  },
  getReviews(bookId) {
    const params = bookId ? `?bookId=${encodeURIComponent(bookId)}` : "";
    return request(`/reviews${params}`);
  },
  submitReview(review) {
    return request("/reviews", {
      method: "POST",
      body: JSON.stringify(review),
    });
  },
};
