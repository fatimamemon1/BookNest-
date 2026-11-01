package booknest.dsa;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Merge sort. Time: O(n log n). Extra space: O(n). Stable.
 */
public final class MergeSort {
  private MergeSort() {}

  public static <T> List<T> sort(List<T> input, Comparator<T> comparator) {
    List<T> items = new ArrayList<>(input);
    if (items.size() <= 1) {
      return items;
    }
    mergeSort(items, 0, items.size() - 1, comparator);
    return items;
  }

  private static <T> void mergeSort(List<T> items, int left, int right, Comparator<T> comparator) {
    if (left >= right) {
      return;
    }
    int mid = left + (right - left) / 2;
    mergeSort(items, left, mid, comparator);
    mergeSort(items, mid + 1, right, comparator);
    merge(items, left, mid, right, comparator);
  }

  private static <T> void merge(List<T> items, int left, int mid, int right, Comparator<T> comparator) {
    List<T> buffer = new ArrayList<>(right - left + 1);
    int i = left;
    int j = mid + 1;
    while (i <= mid && j <= right) {
      if (comparator.compare(items.get(i), items.get(j)) <= 0) {
        buffer.add(items.get(i++));
      } else {
        buffer.add(items.get(j++));
      }
    }
    while (i <= mid) {
      buffer.add(items.get(i++));
    }
    while (j <= right) {
      buffer.add(items.get(j++));
    }
    for (int k = 0; k < buffer.size(); k++) {
      items.set(left + k, buffer.get(k));
    }
  }
}
