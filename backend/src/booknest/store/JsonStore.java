package booknest.store;

import booknest.model.Review;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class JsonStore {
  private final Path libraryFile;
  private final Path reviewsFile;

  public JsonStore(Path dataDir) throws IOException {
    Files.createDirectories(dataDir);
    this.libraryFile = dataDir.resolve("library.json");
    this.reviewsFile = dataDir.resolve("reviews.json");
    if (!Files.exists(libraryFile)) {
      write(libraryFile, Map.of("statuses", Map.of(), "ratings", Map.of(), "dates", Map.of()));
    }
    if (!Files.exists(reviewsFile)) {
      write(reviewsFile, Map.of("reviews", List.of()));
    }
  }

  @SuppressWarnings("unchecked")
  public Map<String, Object> loadLibrary() {
    Map<String, Object> data = Json.object(Json.parse(read(libraryFile)));
    data.putIfAbsent("statuses", new LinkedHashMap<>());
    data.putIfAbsent("ratings", new LinkedHashMap<>());
    data.putIfAbsent("dates", new LinkedHashMap<>());
    return data;
  }

  public synchronized void saveStatus(String bookId, String status) {
    Map<String, Object> library = loadLibrary();
    Map<String, Object> statuses = Json.object(library.get("statuses"));
    Map<String, Object> dates = Json.object(library.get("dates"));
    statuses.put(bookId, status);
    dates.putIfAbsent(bookId, Instant.now().toString());
    library.put("statuses", statuses);
    library.put("dates", dates);
    write(libraryFile, library);
  }

  public synchronized void saveRating(String bookId, int rating) {
    Map<String, Object> library = loadLibrary();
    Map<String, Object> ratings = Json.object(library.get("ratings"));
    ratings.put(bookId, rating);
    library.put("ratings", ratings);
    write(libraryFile, library);
  }

  public List<Review> loadReviews() {
    Map<String, Object> data = Json.object(Json.parse(read(reviewsFile)));
    List<Review> reviews = new ArrayList<>();
    for (Object item : Json.array(data.get("reviews"))) {
      Map<String, Object> map = Json.object(item);
      Review review = new Review();
      review.id = Json.str(map.get("id"));
      review.bookId = Json.str(map.get("bookId"));
      review.reviewer = Json.str(map.get("reviewer"));
      review.rating = Json.integer(map.get("rating"), 0);
      review.title = Json.str(map.get("title"));
      review.text = Json.str(map.get("text"));
      review.date = Json.str(map.get("date"));
      reviews.add(review);
    }
    return reviews;
  }

  public synchronized void saveReviews(List<Review> reviews) {
    List<Map<String, Object>> payload = new ArrayList<>();
    for (Review review : reviews) {
      payload.add(review.toMap());
    }
    write(reviewsFile, Map.of("reviews", payload));
  }

  private String read(Path path) {
    try {
      return Files.readString(path, StandardCharsets.UTF_8);
    } catch (IOException exception) {
      throw new IllegalStateException("Could not read " + path, exception);
    }
  }

  private void write(Path path, Object value) {
    try {
      Path temp = path.resolveSibling(path.getFileName() + ".tmp");
      Files.writeString(temp, Json.stringify(value), StandardCharsets.UTF_8);
      Files.move(temp, path, java.nio.file.StandardCopyOption.REPLACE_EXISTING, java.nio.file.StandardCopyOption.ATOMIC_MOVE);
    } catch (IOException exception) {
      try {
        Files.writeString(path, Json.stringify(value), StandardCharsets.UTF_8);
      } catch (IOException fallback) {
        throw new IllegalStateException("Could not write " + path, fallback);
      }
    }
  }
}
