package booknest.api;

import booknest.model.Book;
import booknest.store.Json;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class OpenLibraryClient {
  private static final String SEARCH = "https://openlibrary.org/search.json?limit=300&fields=key,title,author_name,first_publish_year,subject,cover_i,ratings_average,ratings_count,number_of_pages_median";
  private final HttpClient client =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).followRedirects(HttpClient.Redirect.NORMAL).build();

  public List<Book> search(String query, String genre) throws IOException, InterruptedException {
    String q = (query == null || query.isBlank()) ? "novels" : query.trim();
    if (genre != null && !genre.isBlank() && !"All".equalsIgnoreCase(genre)) {
      q = q + " " + genre;
    }
    String url = SEARCH + "&q=" + URLEncoder.encode(q, StandardCharsets.UTF_8);
    Map<String, Object> payload = Json.object(Json.parse(get(url)));
    List<Book> books = new ArrayList<>();
    for (Object item : Json.array(payload.get("docs"))) {
      Book book = fromDoc(Json.object(item));
      if (book != null) {
        books.add(book);
      }
    }
    return books;
  }

  public List<Book> randomCollection() throws IOException, InterruptedException {
    String[] seeds = {
      "fantasy adventure",
      "mystery thriller",
      "science fiction",
      "romance novels",
      "history biography",
      "classic literature"
    };
    String seed = seeds[(int) (Math.random() * seeds.length)];
    return search(seed, "All");
  }

  public Book details(String workId) throws IOException, InterruptedException {
    String id = workId.startsWith("OL") ? workId : workId.replace("/works/", "");
    String workUrl = "https://openlibrary.org/works/" + id + ".json";
    Map<String, Object> work = Json.object(Json.parse(get(workUrl)));
    Book book = new Book();
    book.id = id;
    book.openLibraryId = id;
    book.title = missing(Json.str(work.get("title")), "Untitled");
    book.description = extractDescription(work.get("description"));
    book.tags = subjects(Json.array(work.get("subjects")));
    book.genre = classify(book.tags);
    book.author = "Unknown author";
    if (!Json.array(work.get("authors")).isEmpty()) {
      Map<String, Object> authorRef = Json.object(Json.array(work.get("authors")).get(0));
      Map<String, Object> authorObj = Json.object(authorRef.get("author"));
      String key = Json.str(authorObj.get("key"));
      if (!key.isBlank()) {
        try {
          Map<String, Object> author = Json.object(Json.parse(get("https://openlibrary.org" + key + ".json")));
          book.author = missing(Json.str(author.get("name")), book.author);
        } catch (Exception ignored) {
          book.author = "Unknown author";
        }
      }
    }
    List<Object> covers = Json.array(work.get("covers"));
    if (!covers.isEmpty()) {
      book.cover = "https://covers.openlibrary.org/b/id/" + Json.str(covers.get(0)) + "-L.jpg";
    }
    return book;
  }

  private Book fromDoc(Map<String, Object> doc) {
    String key = Json.str(doc.get("key"));
    if (key.isBlank()) {
      return null;
    }
    Book book = new Book();
    book.id = key.replace("/works/", "");
    book.openLibraryId = book.id;
    book.title = missing(Json.str(doc.get("title")), "Untitled");
    List<Object> authors = Json.array(doc.get("author_name"));
    book.author = authors.isEmpty() ? "Unknown author" : Json.str(authors.get(0));
    book.year = Json.integer(doc.get("first_publish_year"), 0);
    book.tags = subjects(Json.array(doc.get("subject")));
    book.genre = classify(book.tags);
    book.rating = round(Json.decimal(doc.get("ratings_average"), 0));
    book.reviewCount = Json.integer(doc.get("ratings_count"), 0);
    int coverId = Json.integer(doc.get("cover_i"), 0);
    book.cover = coverId == 0 ? "" : "https://covers.openlibrary.org/b/id/" + coverId + "-L.jpg";
    book.description =
        book.year > 0
            ? book.title + " by " + book.author + " (" + book.year + "). Open Library subject tags: " + String.join(", ", book.tags.stream().limit(6).toList()) + "."
            : "A title from Open Library. Full bibliographic details are still loading.";
    book.accent = accentFor(book.genre);
    return book;
  }

  private List<String> subjects(List<Object> raw) {
    List<String> tags = new ArrayList<>();
    for (Object item : raw) {
      String tag = Json.str(item);
      if (!tag.isBlank() && tags.size() < 4 && tag.length() < 28) {
        tags.add(tag);
      }
    }
    if (tags.isEmpty()) {
      tags.add("General");
    }
    return tags;
  }

  private String classify(List<String> tags) {
    String haystack = String.join(" ", tags).toLowerCase(Locale.ROOT);
    if (haystack.contains("fantasy")) return "Fantasy";
    if (haystack.contains("mystery") || haystack.contains("crime") || haystack.contains("detective")) return "Mystery";
    if (haystack.contains("romance")) return "Romance";
    if (haystack.contains("biography") || haystack.contains("history") || haystack.contains("self-help") || haystack.contains("business")) {
      return "Non-fiction";
    }
    return "Fiction";
  }

  private String extractDescription(Object value) {
    if (value instanceof String text) {
      return text.isBlank() ? "No description is available for this title yet." : text;
    }
    String nested = Json.str(Json.object(value).get("value"));
    return nested.isBlank() ? "No description is available for this title yet." : nested;
  }

  private String get(String url) throws IOException, InterruptedException {
    HttpRequest request =
        HttpRequest.newBuilder(URI.create(url))
            .timeout(Duration.ofSeconds(20))
            .header("User-Agent", "BookNestStudentProject/1.0 (educational)")
            .GET()
            .build();
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() >= 400) {
      throw new IOException("Open Library returned HTTP " + response.statusCode());
    }
    return response.body();
  }

  private String missing(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }

  private double round(double value) {
    return Math.round(value * 10.0) / 10.0;
  }

  private String accentFor(String genre) {
    return switch (genre) {
      case "Fantasy" -> "#A56C39";
      case "Mystery" -> "#6D7C69";
      case "Romance" -> "#906971";
      case "Non-fiction" -> "#B7A28A";
      default -> "#4522F5";
    };
  }
}
