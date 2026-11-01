package booknest.dsa;

import java.util.ArrayList;
import java.util.List;

/**
 * Doubly linked list used for discovery history and Back navigation.
 * Insert/remove at ends: O(1). Index access: O(n).
 */
public class DoublyLinkedList<T> {
  public static class Node<T> {
    public T value;
    public Node<T> prev;
    public Node<T> next;

    Node(T value) {
      this.value = value;
    }
  }

  private Node<T> head;
  private Node<T> tail;
  private Node<T> cursor;
  private int size;

  public int size() {
    return size;
  }

  public boolean isEmpty() {
    return size == 0;
  }

  public void append(T value) {
    Node<T> node = new Node<>(value);
    if (tail == null) {
      head = tail = cursor = node;
    } else {
      tail.next = node;
      node.prev = tail;
      tail = node;
      cursor = node;
    }
    size++;
  }

  public T back() {
    if (cursor == null || cursor.prev == null) {
      return cursor == null ? null : cursor.value;
    }
    cursor = cursor.prev;
    return cursor.value;
  }

  public T current() {
    return cursor == null ? null : cursor.value;
  }

  public T peekLast() {
    return tail == null ? null : tail.value;
  }

  public T removeLast() {
    if (tail == null) {
      return null;
    }
    T value = tail.value;
    tail = tail.prev;
    if (tail == null) {
      head = cursor = null;
    } else {
      tail.next = null;
      cursor = tail;
    }
    size--;
    return value;
  }

  public List<T> toList() {
    List<T> values = new ArrayList<>();
    Node<T> node = head;
    while (node != null) {
      values.add(node.value);
      node = node.next;
    }
    return values;
  }
}
