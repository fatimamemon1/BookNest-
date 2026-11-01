package booknest.test;

import booknest.dsa.BinarySearchTree;
import booknest.dsa.DoublyLinkedList;
import booknest.dsa.HashTable;
import booknest.dsa.MergeSort;
import booknest.dsa.Queue;
import booknest.store.Json;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

public class DsaTests {
  private static int passed;
  private static int failed;

  public static void main(String[] args) {
    hashTableStoresAndDetectsDuplicates();
    doublyLinkedListNavigatesBack();
    bstIndexesTitlesAndBfsWalksLevelOrder();
    queueIsFifo();
    mergeSortOrdersTitles();
    jsonRoundTrip();
    if (failed > 0) {
      System.err.println("FAILED " + failed + " of " + (passed + failed) + " tests");
      System.exit(1);
    }
    System.out.println("Passed " + passed + " DSA/unit tests");
  }

  private static void hashTableStoresAndDetectsDuplicates() {
    HashTable<String, String> table = new HashTable<>();
    table.put("OL1", "The Hobbit");
    table.put("OL1", "The Hobbit Updated");
    expect("hash overwrite", "The Hobbit Updated".equals(table.get("OL1")));
    expect("hash size stays 1", table.size() == 1);
    expect("missing key", table.get("nope") == null);
  }

  private static void doublyLinkedListNavigatesBack() {
    DoublyLinkedList<String> history = new DoublyLinkedList<>();
    history.append("a");
    history.append("b");
    history.append("c");
    expect("current is last", "c".equals(history.current()));
    expect("back", "b".equals(history.back()));
    expect("remove last", "c".equals(history.removeLast()));
  }

  private static void bstIndexesTitlesAndBfsWalksLevelOrder() {
    BinarySearchTree<String> tree = new BinarySearchTree<>();
    tree.insert("Neuromancer", "N");
    tree.insert("Dune", "D");
    tree.insert("Pride and Prejudice", "P");
    expect("bst search", "D".equals(tree.search("Dune")));
    List<String> bfs = tree.breadthFirstValues();
    expect("bfs starts at root", "N".equals(bfs.get(0)));
    expect("prefix finds dune", tree.prefix("du").contains("D"));
  }

  private static void queueIsFifo() {
    Queue<Integer> queue = new Queue<>();
    queue.enqueue(1);
    queue.enqueue(2);
    expect("fifo first", queue.dequeue() == 1);
    expect("fifo second", queue.dequeue() == 2);
    expect("empty", queue.isEmpty());
  }

  private static void mergeSortOrdersTitles() {
    List<String> sorted = MergeSort.sort(List.of("Zoo", "Apple", "Moon"), Comparator.naturalOrder());
    expect("merge sort", List.of("Apple", "Moon", "Zoo").equals(sorted));
  }

  private static void jsonRoundTrip() {
    String encoded = Json.stringify(Map.of("title", "Dune", "year", 1965));
    Map<String, Object> parsed = Json.object(Json.parse(encoded));
    expect("json title", "Dune".equals(parsed.get("title")));
    expect("json year", Json.integer(parsed.get("year"), 0) == 1965);
  }

  private static void expect(String name, boolean condition) {
    if (condition) {
      passed++;
      System.out.println("PASS " + name);
    } else {
      failed++;
      System.err.println("FAIL " + name);
    }
  }
}
