package booknest.model;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Book {
  public String id;
  public String openLibraryId;
  public String title;
  public String author;
  public int year;
  public String genre;
  public List<String> tags = new ArrayList<>();
  public double rating;
  public int reviewCount;
  public String description;
  public String cover;
  public String accent = "#4522F5";

  public Map<String, Object> toMap() {
    Map<String, Object> map = new LinkedHashMap<>();
    map.put("id", id);
    map.put("openLibraryId", openLibraryId);
    map.put("title", title);
    map.put("author", author);
    map.put("year", year);
    map.put("genre", genre);
    map.put("tags", tags);
    map.put("rating", rating);
    map.put("reviewCount", reviewCount);
    map.put("reviews", reviewCount + " reviews");
    map.put("description", description);
    map.put("cover", cover);
    map.put("accent", accent);
    return map;
  }
}
