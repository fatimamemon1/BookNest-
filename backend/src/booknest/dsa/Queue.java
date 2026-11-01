package booknest.dsa;

/**
 * Linked queue used by BFS.
 * Enqueue/dequeue: O(1).
 */
public class Queue<T> {
  private static class Node<T> {
    final T value;
    Node<T> next;

    Node(T value) {
      this.value = value;
    }
  }

  private Node<T> head;
  private Node<T> tail;
  private int size;

  public void enqueue(T value) {
    Node<T> node = new Node<>(value);
    if (tail == null) {
      head = tail = node;
    } else {
      tail.next = node;
      tail = node;
    }
    size++;
  }

  public T dequeue() {
    if (head == null) {
      return null;
    }
    T value = head.value;
    head = head.next;
    if (head == null) {
      tail = null;
    }
    size--;
    return value;
  }

  public boolean isEmpty() {
    return size == 0;
  }

  public int size() {
    return size;
  }
}
