package booknest.dsa;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Separate-chaining hash table.
 * Average lookup/insert: O(1). Worst case: O(n) if every key collides.
 */
public class HashTable<K, V> {
  private static class Node<K, V> {
    final K key;
    V value;
    Node<K, V> next;

    Node(K key, V value, Node<K, V> next) {
      this.key = key;
      this.value = value;
      this.next = next;
    }
  }

  private Node<K, V>[] buckets;
  private int size;

  @SuppressWarnings("unchecked")
  public HashTable() {
    buckets = (Node<K, V>[]) new Node[16];
  }

  public int size() {
    return size;
  }

  public boolean containsKey(K key) {
    return get(key) != null || find(key) != null;
  }

  public V get(K key) {
    Node<K, V> node = find(key);
    return node == null ? null : node.value;
  }

  public void put(K key, V value) {
    Objects.requireNonNull(key, "key");
    int index = index(key);
    Node<K, V> node = buckets[index];
    while (node != null) {
      if (node.key.equals(key)) {
        node.value = value;
        return;
      }
      node = node.next;
    }
    buckets[index] = new Node<>(key, value, buckets[index]);
    size++;
    if (size > buckets.length * 0.75) {
      resize();
    }
  }

  public V remove(K key) {
    int index = index(key);
    Node<K, V> prev = null;
    Node<K, V> node = buckets[index];
    while (node != null) {
      if (node.key.equals(key)) {
        if (prev == null) {
          buckets[index] = node.next;
        } else {
          prev.next = node.next;
        }
        size--;
        return node.value;
      }
      prev = node;
      node = node.next;
    }
    return null;
  }

  public List<V> values() {
    List<V> result = new ArrayList<>();
    for (Node<K, V> bucket : buckets) {
      Node<K, V> node = bucket;
      while (node != null) {
        result.add(node.value);
        node = node.next;
      }
    }
    return result;
  }

  private Node<K, V> find(K key) {
    if (key == null) {
      return null;
    }
    Node<K, V> node = buckets[index(key)];
    while (node != null) {
      if (node.key.equals(key)) {
        return node;
      }
      node = node.next;
    }
    return null;
  }

  private int index(K key) {
    return Math.floorMod(key.hashCode(), buckets.length);
  }

  @SuppressWarnings("unchecked")
  private void resize() {
    Node<K, V>[] old = buckets;
    buckets = (Node<K, V>[]) new Node[old.length * 2];
    size = 0;
    for (Node<K, V> bucket : old) {
      Node<K, V> node = bucket;
      while (node != null) {
        put(node.key, node.value);
        node = node.next;
      }
    }
  }
}
