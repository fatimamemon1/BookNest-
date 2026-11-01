package booknest.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class Review {
  public String id;
  public String bookId;
  public String reviewer;
  public int rating;
  public String title;
  public String text;
  public String date;

  public Map<String, Object> toMap() {
    Map<String, Object> map = new LinkedHashMap<>();
    map.put("id", id);
    map.put("bookId", bookId);
    map.put("reviewer", reviewer);
    map.put("rating", rating);
    map.put("title", title);
    map.put("text", text);
    map.put("date", date);
    return map;
  }
}
