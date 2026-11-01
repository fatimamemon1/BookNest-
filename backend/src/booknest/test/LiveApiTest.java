package booknest.test;

import booknest.api.OpenLibraryClient;
import booknest.model.Book;
import booknest.model.Review;
import booknest.service.CatalogService;
import booknest.store.JsonStore;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

public class LiveApiTest {
  public static void main(String[] args) throws Exception {
    Path temp = Files.createTempDirectory("booknest-test");
    CatalogService catalog = new CatalogService(new OpenLibraryClient(), new JsonStore(temp));
    List<Book> books = catalog.search("the hobbit", "Fantasy");
    if (books.isEmpty()) {
      throw new IllegalStateException("Open Library search returned no books");
    }
    Book first = books.get(0);
    if (first.title == null || first.title.isBlank()) {
      throw new IllegalStateException("Book is missing a title");
    }
    catalog.updateStatus(first.id, "TBR");
    Review review =
        catalog.addReview(
            Map.of(
                "bookId", first.id,
                "reviewer", "Fatima",
                "title", "A keeper",
                "text", "I would recommend this on the BookNest shelf.",
                "rating", 5));
    if (catalog.reviews(first.id).isEmpty()) {
      throw new IllegalStateException("Review did not persist");
    }
    boolean duplicateFailed = false;
    try {
      catalog.addReview(
          Map.of(
              "bookId", first.id,
              "reviewer", "Fatima",
              "title", "A keeper",
              "text", "I would recommend this on the BookNest shelf.",
              "rating", 5));
    } catch (IllegalArgumentException expected) {
      duplicateFailed = true;
    }
    if (!duplicateFailed) {
      throw new IllegalStateException("Duplicate review was accepted");
    }
    Book detailed = catalog.getBook(first.id);
    System.out.println("Live API test passed: " + detailed.title + " / review " + review.id);
  }
}
