package booknest.server;

import booknest.api.OpenLibraryClient;
import booknest.model.Book;
import booknest.model.Review;
import booknest.service.CatalogService;
import booknest.store.Json;
import booknest.store.JsonStore;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class BookNestServer {
  private final CatalogService catalog;
  private final Path frontend;
  private final int port;

  public BookNestServer(CatalogService catalog, Path frontend, int port) {
    this.catalog = catalog;
    this.frontend = frontend;
    this.port = port;
  }

  public static void main(String[] args) throws Exception {
    Path root = Path.of("").toAbsolutePath();
    Path frontend = resolveFrontend(root);
    Path data = root.resolve("data");
    int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
    CatalogService catalog = new CatalogService(new OpenLibraryClient(), new JsonStore(data));
    new BookNestServer(catalog, frontend, port).start();
  }

  public void start() throws IOException {
    HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
    server.createContext("/api/books/search", this::search);
    server.createContext("/api/books/random", this::random);
    server.createContext("/api/books/", this::book);
    server.createContext("/api/library", this::library);
    server.createContext("/api/reviews", this::reviews);
    server.createContext("/api/dsa", this::dsa);
    server.createContext("/", this::files);
    server.setExecutor(null);
    server.start();
    System.out.println("BookNest running at http://localhost:" + port);
    System.out.println("Serving frontend from " + frontend.toAbsolutePath());
  }

  private void search(HttpExchange exchange) throws IOException {
    if (!"GET".equals(exchange.getRequestMethod())) {
      send(exchange, 405, Map.of("message", "Method not allowed"));
      return;
    }
    Map<String, String> query = query(exchange);
    try {
      List<Book> books = catalog.search(query.getOrDefault("q", "novels"), query.getOrDefault("genre", "All"));
      send(exchange, 200, Map.of("books", maps(books)));
    } catch (Exception exception) {
      send(exchange, 502, Map.of("message", "Open Library is unavailable: " + exception.getMessage()));
    }
  }

  private void random(HttpExchange exchange) throws IOException {
    try {
      send(exchange, 200, Map.of("books", maps(catalog.randomBooks())));
    } catch (Exception exception) {
      send(exchange, 502, Map.of("message", "Open Library is unavailable: " + exception.getMessage()));
    }
  }

  private void book(HttpExchange exchange) throws IOException {
    String id = exchange.getRequestURI().getPath().substring("/api/books/".length());
    if (id.isBlank()) {
      send(exchange, 404, Map.of("message", "Book id required"));
      return;
    }
    try {
      send(exchange, 200, catalog.getBook(id).toMap());
    } catch (Exception exception) {
      send(exchange, 404, Map.of("message", "Could not load this book: " + exception.getMessage()));
    }
  }

  private void library(HttpExchange exchange) throws IOException {
    String path = exchange.getRequestURI().getPath();
    if ("GET".equals(exchange.getRequestMethod()) && "/api/library".equals(path)) {
      send(exchange, 200, catalog.libraryPayload());
      return;
    }
    if ("PUT".equals(exchange.getRequestMethod()) && path.contains("/rating")) {
      String id = path.substring("/api/library/".length(), path.indexOf("/rating"));
      Map<String, Object> body = Json.object(Json.parse(body(exchange)));
      try {
        catalog.saveRating(id, Json.integer(body.get("rating"), 0));
        send(exchange, 200, catalog.libraryPayload());
      } catch (IllegalArgumentException exception) {
        send(exchange, 400, Map.of("message", exception.getMessage()));
      }
      return;
    }
    if ("PUT".equals(exchange.getRequestMethod()) && path.startsWith("/api/library/")) {
      String id = path.substring("/api/library/".length());
      Map<String, Object> body = Json.object(Json.parse(body(exchange)));
      catalog.updateStatus(id, Json.str(body.get("status")));
      send(exchange, 200, catalog.libraryPayload());
      return;
    }
    send(exchange, 404, Map.of("message", "Unknown library route"));
  }

  private void reviews(HttpExchange exchange) throws IOException {
    if ("GET".equals(exchange.getRequestMethod())) {
      String bookId = query(exchange).get("bookId");
      send(exchange, 200, Map.of("reviews", reviewMaps(catalog.reviews(bookId))));
      return;
    }
    if ("POST".equals(exchange.getRequestMethod())) {
      try {
        Review review = catalog.addReview(Json.object(Json.parse(body(exchange))));
        send(exchange, 201, review.toMap());
      } catch (IllegalArgumentException exception) {
        send(exchange, 400, Map.of("message", exception.getMessage()));
      }
      return;
    }
    send(exchange, 405, Map.of("message", "Method not allowed"));
  }

  private void dsa(HttpExchange exchange) throws IOException {
    send(exchange, 200, catalog.dsaStats());
  }

  private void files(HttpExchange exchange) throws IOException {
    if (exchange.getRequestURI().getPath().startsWith("/api/")) {
      send(exchange, 404, Map.of("message", "Unknown API route"));
      return;
    }
    String raw = exchange.getRequestURI().getPath();
    String relative = "/".equals(raw) ? "index.html" : raw.substring(1);
    Path file = frontend.resolve(relative).normalize();
    if (!file.startsWith(frontend) || !Files.exists(file) || Files.isDirectory(file)) {
      file = frontend.resolve("index.html");
    }
    byte[] bytes = Files.readAllBytes(file);
    Headers headers = exchange.getResponseHeaders();
    headers.set("Content-Type", contentType(file.getFileName().toString()));
    exchange.sendResponseHeaders(200, bytes.length);
    try (OutputStream output = exchange.getResponseBody()) {
      output.write(bytes);
    }
  }

  private List<Map<String, Object>> maps(List<Book> books) {
    List<Map<String, Object>> result = new ArrayList<>();
    for (Book book : books) {
      result.add(book.toMap());
    }
    return result;
  }

  private List<Map<String, Object>> reviewMaps(List<Review> reviews) {
    List<Map<String, Object>> result = new ArrayList<>();
    for (Review review : reviews) {
      result.add(review.toMap());
    }
    return result;
  }

  private void send(HttpExchange exchange, int status, Object payload) throws IOException {
    byte[] bytes = Json.stringify(payload).getBytes(StandardCharsets.UTF_8);
    Headers headers = exchange.getResponseHeaders();
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("Access-Control-Allow-Origin", "*");
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream output = exchange.getResponseBody()) {
      output.write(bytes);
    }
  }

  private String body(HttpExchange exchange) throws IOException {
    try (InputStream input = exchange.getRequestBody()) {
      return new String(input.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  private Map<String, String> query(HttpExchange exchange) {
    Map<String, String> map = new LinkedHashMap<>();
    String raw = exchange.getRequestURI().getRawQuery();
    if (raw == null) {
      return map;
    }
    for (String part : raw.split("&")) {
      String[] pair = part.split("=", 2);
      map.put(decode(pair[0]), pair.length > 1 ? decode(pair[1]) : "");
    }
    return map;
  }

  private String decode(String value) {
    return java.net.URLDecoder.decode(value, StandardCharsets.UTF_8);
  }

  private String contentType(String name) {
    if (name.endsWith(".css")) return "text/css; charset=utf-8";
    if (name.endsWith(".js")) return "application/javascript; charset=utf-8";
    if (name.endsWith(".svg")) return "image/svg+xml";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    return "text/html; charset=utf-8";
  }

  private static Path resolveFrontend(Path root) {
    Path nested = root.resolve("frontend");
    if (Files.exists(nested.resolve("index.html"))) {
      return nested;
    }
    Path parent = root.getParent() == null ? root : root.getParent();
    Path sibling = parent.resolve("frontend");
    if (Files.exists(sibling.resolve("index.html"))) {
      return sibling;
    }
    return nested;
  }
}
