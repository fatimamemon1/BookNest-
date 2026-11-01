package booknest.service;

import booknest.api.OpenLibraryClient;
import booknest.dsa.BinarySearchTree;
import booknest.dsa.DoublyLinkedList;
import booknest.dsa.HashTable;
import booknest.dsa.MergeSort;
import booknest.model.Book;
import booknest.model.Review;
import booknest.store.Json;
import booknest.store.JsonStore;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class CatalogService {
  private final OpenLibraryClient openLibrary;
  private final JsonStore store;
  private final HashTable<String, Book> books = new HashTable<>();
  private final HashTable<String, Boolean> reviewFingerprints = new HashTable<>();
  private final BinarySearchTree<Book> titleIndex = new BinarySearchTree<>();
  private final DoublyLinkedList<String> discoveryHistory = new DoublyLinkedList<>();
  private final List<Review> reviews = new ArrayList<>();

  public CatalogService(OpenLibraryClient openLibrary, JsonStore store) {
    this.openLibrary = openLibrary;
    this.store = store;
    for (Review review : store.loadReviews()) {
      reviews.add(review);
      reviewFingerprints.put(fingerprint(review.bookId, review.reviewer, review.text), Boolean.TRUE);
    }
  }

  public List<Book> search(String query, String genre) throws Exception {
    List<Book> fetched = openLibrary.search(query, genre);
    indexAll(fetched);
    List<Book> filtered = new ArrayList<>();
    for (Book book : fetched) {
      if (genre == null || genre.isBlank() || "All".equalsIgnoreCase(genre) || genre.equalsIgnoreCase(book.genre)) {
        filtered.add(enrich(book));
      }
    }
    String needle = query == null ? "" : query.toLowerCase(Locale.ROOT);
    return MergeSort.sort(
        filtered,
        (left, right) -> {
          int ranked = Integer.compare(relevance(right, needle), relevance(left, needle));
          return ranked != 0 ? ranked : left.title.compareToIgnoreCase(right.title);
        });
  }

  public List<Book> randomBooks() throws Exception {
    List<Book> fetched = openLibrary.randomCollection();
    indexAll(fetched);
    List<Book> shuffled = new ArrayList<>(fetched);
    for (int i = shuffled.size() - 1; i > 0; i--) {
      int j = (int) (Math.random() * (i + 1));
      Book temp = shuffled.get(i);
      shuffled.set(i, shuffled.get(j));
      shuffled.set(j, temp);
    }
    for (Book book : shuffled) {
      discoveryHistory.append(book.id);
    }
    List<Book> enriched = new ArrayList<>();
    for (Book book : shuffled) {
      enriched.add(enrich(book));
    }
    return enriched;
  }

  public Book getBook(String id) throws Exception {
    Book cached = books.get(id);
    Book detailed = openLibrary.details(id);
    if (cached != null) {
      if (detailed.description != null && !detailed.description.isBlank()) {
        cached.description = detailed.description;
      }
      if (detailed.cover != null && !detailed.cover.isBlank()) {
        cached.cover = detailed.cover;
      }
      if (detailed.author != null && !detailed.author.isBlank()) {
        cached.author = detailed.author;
      }
      return enrich(cached);
    }
    index(detailed);
    return enrich(detailed);
  }

  public String previousDiscovery() {
    return discoveryHistory.back();
  }

  public Map<String, Object> libraryPayload() {
    Map<String, Object> library = store.loadLibrary();
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("statuses", library.get("statuses"));
    payload.put("ratings", numberMap(Json.object(library.get("ratings"))));
    payload.put("dates", library.get("dates"));
    return payload;
  }

  public void updateStatus(String bookId, String status) {
    store.saveStatus(bookId, status);
    discoveryHistory.append(bookId);
  }

  public void saveRating(String bookId, int rating) {
    if (rating < 1 || rating > 5) {
      throw new IllegalArgumentException("Rating must be between 1 and 5.");
    }
    store.saveRating(bookId, rating);
  }

  public List<Review> reviews(String bookId) {
    List<Review> result = new ArrayList<>();
    for (Review review : reviews) {
      if (bookId == null || bookId.isBlank() || review.bookId.equals(bookId)) {
        result.add(review);
      }
    }
    return MergeSort.sort(result, Comparator.comparing((Review review) -> review.date).reversed());
  }

  public Review addReview(Map<String, Object> body) {
    String bookId = Json.str(body.get("bookId"));
    String reviewer = Json.str(body.get("reviewer")).trim();
    String title = Json.str(body.get("title")).trim();
    String text = Json.str(body.get("text")).trim();
    int rating = Json.integer(body.get("rating"), 0);
    if (bookId.isBlank() || reviewer.isBlank() || title.isBlank() || text.isBlank() || rating < 1 || rating > 5) {
      throw new IllegalArgumentException("Please complete every field and choose a star rating.");
    }
    String print = fingerprint(bookId, reviewer, text);
    if (reviewFingerprints.get(print) != null) {
      throw new IllegalArgumentException("This review has already been submitted.");
    }
    Review review = new Review();
    review.id = bookId + "-" + System.currentTimeMillis();
    review.bookId = bookId;
    review.reviewer = reviewer;
    review.title = title;
    review.text = text;
    review.rating = rating;
    review.date = Instant.now().toString();
    reviews.add(0, review);
    reviewFingerprints.put(print, Boolean.TRUE);
    store.saveReviews(reviews);
    return review;
  }

  public Map<String, Object> dsaStats() {
    Map<String, Object> stats = new LinkedHashMap<>();
    stats.put("hashTableBooks", books.size());
    stats.put("titleIndexSize", titleIndex.size());
    stats.put("discoveryHistory", discoveryHistory.size());
    stats.put("bfsTitleWalk", titleIndex.breadthFirstValues().stream().map(book -> book.title).limit(12).toList());
    stats.put(
        "complexities",
        Map.of(
            "HashTable lookup", "average O(1), worst O(n)",
            "DoublyLinkedList back", "O(1)",
            "BST search", "average O(log n), worst O(n)",
            "BFS traversal", "O(n)",
            "MergeSort", "O(n log n)"));
    return stats;
  }

  public List<Book> titlesMatching(String query) {
    return titleIndex.prefix(query);
  }

  private void indexAll(List<Book> fetched) {
    for (Book book : fetched) {
      index(book);
    }
  }

  private void index(Book book) {
    if (books.get(book.id) == null) {
      books.put(book.id, book);
      titleIndex.insert(book.title, book);
    } else {
      books.put(book.id, book);
    }
  }

  private Book enrich(Book book) {
    List<Review> bookReviews = reviews(book.id);
    if (!bookReviews.isEmpty()) {
      double sum = 0;
      for (Review review : bookReviews) {
        sum += review.rating;
      }
      double community = book.rating > 0 ? (sum + book.rating) / (bookReviews.size() + 1) : sum / bookReviews.size();
      book.rating = Math.round(community * 10.0) / 10.0;
    }
    book.reviewCount = bookReviews.size();
    return book;
  }

  private int relevance(Book book, String needle) {
    if (needle.isBlank()) {
      return 0;
    }
    String title = book.title.toLowerCase(Locale.ROOT);
    String author = book.author.toLowerCase(Locale.ROOT);
    if (title.equals(needle)) {
      return 4;
    }
    if (title.startsWith(needle)) {
      return 3;
    }
    if (title.contains(needle)) {
      return 2;
    }
    if (author.contains(needle)) {
      return 1;
    }
    return 0;
  }

  private String fingerprint(String bookId, String reviewer, String text) {
    return (bookId + "|" + reviewer.trim().toLowerCase(Locale.ROOT) + "|" + text.trim().toLowerCase(Locale.ROOT));
  }

  private Map<String, Object> numberMap(Map<String, Object> source) {
    Map<String, Object> copy = new LinkedHashMap<>();
    for (Map.Entry<String, Object> entry : source.entrySet()) {
      copy.put(entry.getKey(), Json.integer(entry.getValue(), 0));
    }
    return copy;
  }
}
