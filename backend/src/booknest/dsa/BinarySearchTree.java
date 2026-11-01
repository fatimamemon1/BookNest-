package booknest.dsa;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Binary search tree indexed by book title.
 * Average insert/search: O(log n). Worst case (sorted inserts): O(n).
 * BFS traversal: O(n).
 */
public class BinarySearchTree<T> {
  public static class Node<T> {
    public final String key;
    public T value;
    public Node<T> left;
    public Node<T> right;

    Node(String key, T value) {
      this.key = key;
      this.value = value;
    }
  }

  private Node<T> root;
  private int size;

  public int size() {
    return size;
  }

  public void insert(String title, T value) {
    String key = normalize(title);
    if (root == null) {
      root = new Node<>(key, value);
      size++;
      return;
    }
    Node<T> current = root;
    while (true) {
      int cmp = key.compareTo(current.key);
      if (cmp == 0) {
        current.value = value;
        return;
      }
      if (cmp < 0) {
        if (current.left == null) {
          current.left = new Node<>(key, value);
          size++;
          return;
        }
        current = current.left;
      } else {
        if (current.right == null) {
          current.right = new Node<>(key, value);
          size++;
          return;
        }
        current = current.right;
      }
    }
  }

  public T search(String title) {
    String key = normalize(title);
    Node<T> current = root;
    while (current != null) {
      int cmp = key.compareTo(current.key);
      if (cmp == 0) {
        return current.value;
      }
      current = cmp < 0 ? current.left : current.right;
    }
    return null;
  }

  public List<T> prefix(String query) {
    List<T> matches = new ArrayList<>();
    String needle = normalize(query);
    bfsCollect(node -> {
      if (node.key.startsWith(needle) || node.key.contains(needle)) {
        matches.add(node.value);
      }
    });
    return matches;
  }

  /** Breadth-first traversal using the custom queue. */
  public List<T> breadthFirstValues() {
    List<T> values = new ArrayList<>();
    bfsCollect(node -> values.add(node.value));
    return values;
  }

  private void bfsCollect(java.util.function.Consumer<Node<T>> visitor) {
    if (root == null) {
      return;
    }
    Queue<Node<T>> queue = new Queue<>();
    queue.enqueue(root);
    while (!queue.isEmpty()) {
      Node<T> node = queue.dequeue();
      visitor.accept(node);
      if (node.left != null) {
        queue.enqueue(node.left);
      }
      if (node.right != null) {
        queue.enqueue(node.right);
      }
    }
  }

  private String normalize(String title) {
    return title == null ? "" : title.toLowerCase(Locale.ROOT).trim();
  }
}
