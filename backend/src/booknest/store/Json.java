package booknest.store;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Minimal JSON parser and serializer with no third-party libraries. */
public final class Json {
  private Json() {}

  public static Object parse(String text) {
    return new Parser(text).parseValue();
  }

  @SuppressWarnings("unchecked")
  public static Map<String, Object> object(Object value) {
    return value instanceof Map<?, ?> map ? (Map<String, Object>) map : new LinkedHashMap<>();
  }

  @SuppressWarnings("unchecked")
  public static List<Object> array(Object value) {
    return value instanceof List<?> list ? (List<Object>) list : new ArrayList<>();
  }

  public static String str(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  public static int integer(Object value, int fallback) {
    if (value instanceof Number number) {
      return number.intValue();
    }
    try {
      return value == null || str(value).isBlank() ? fallback : Integer.parseInt(str(value));
    } catch (NumberFormatException ignored) {
      return fallback;
    }
  }

  public static double decimal(Object value, double fallback) {
    if (value instanceof Number number) {
      return number.doubleValue();
    }
    try {
      return value == null || str(value).isBlank() ? fallback : Double.parseDouble(str(value));
    } catch (NumberFormatException ignored) {
      return fallback;
    }
  }

  public static String stringify(Object value) {
    StringBuilder builder = new StringBuilder();
    write(builder, value);
    return builder.toString();
  }

  private static void write(StringBuilder builder, Object value) {
    if (value == null) {
      builder.append("null");
    } else if (value instanceof String text) {
      builder.append('"').append(escape(text)).append('"');
    } else if (value instanceof Number || value instanceof Boolean) {
      builder.append(value);
    } else if (value instanceof Map<?, ?> map) {
      builder.append('{');
      boolean first = true;
      for (Map.Entry<?, ?> entry : map.entrySet()) {
        if (!first) {
          builder.append(',');
        }
        first = false;
        builder.append('"').append(escape(String.valueOf(entry.getKey()))).append("\":");
        write(builder, entry.getValue());
      }
      builder.append('}');
    } else if (value instanceof Iterable<?> iterable) {
      builder.append('[');
      boolean first = true;
      for (Object item : iterable) {
        if (!first) {
          builder.append(',');
        }
        first = false;
        write(builder, item);
      }
      builder.append(']');
    } else {
      builder.append('"').append(escape(String.valueOf(value))).append('"');
    }
  }

  private static String escape(String text) {
    return text.replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t");
  }

  private static final class Parser {
    private final String text;
    private int index;

    Parser(String text) {
      this.text = text == null ? "" : text;
    }

    Object parseValue() {
      skip();
      if (index >= text.length()) {
        return null;
      }
      char current = text.charAt(index);
      if (current == '{') {
        return parseObject();
      }
      if (current == '[') {
        return parseArray();
      }
      if (current == '"') {
        return parseString();
      }
      if (current == 't' || current == 'f') {
        return parseBoolean();
      }
      if (current == 'n') {
        expect("null");
        return null;
      }
      return parseNumber();
    }

    private Map<String, Object> parseObject() {
      expect("{");
      Map<String, Object> object = new LinkedHashMap<>();
      skip();
      if (peek('}')) {
        index++;
        return object;
      }
      while (index < text.length()) {
        skip();
        String key = parseString();
        skip();
        expect(":");
        object.put(key, parseValue());
        skip();
        if (peek('}')) {
          index++;
          break;
        }
        expect(",");
      }
      return object;
    }

    private List<Object> parseArray() {
      expect("[");
      List<Object> array = new ArrayList<>();
      skip();
      if (peek(']')) {
        index++;
        return array;
      }
      while (index < text.length()) {
        array.add(parseValue());
        skip();
        if (peek(']')) {
          index++;
          break;
        }
        expect(",");
      }
      return array;
    }

    private String parseString() {
      expect("\"");
      StringBuilder builder = new StringBuilder();
      while (index < text.length()) {
        char current = text.charAt(index++);
        if (current == '"') {
          return builder.toString();
        }
        if (current == '\\' && index < text.length()) {
          char escaped = text.charAt(index++);
          builder.append(
              switch (escaped) {
                case 'n' -> '\n';
                case 'r' -> '\r';
                case 't' -> '\t';
                case 'u' -> parseUnicode();
                default -> escaped;
              });
        } else {
          builder.append(current);
        }
      }
      return builder.toString();
    }

    private char parseUnicode() {
      if (index + 4 > text.length()) {
        return '?';
      }
      String hex = text.substring(index, index + 4);
      index += 4;
      try {
        return (char) Integer.parseInt(hex, 16);
      } catch (NumberFormatException ignored) {
        return '?';
      }
    }

    private Object parseNumber() {
      int start = index;
      if (peek('-')) {
        index++;
      }
      while (index < text.length() && (Character.isDigit(text.charAt(index)) || text.charAt(index) == '.' || text.charAt(index) == 'e' || text.charAt(index) == 'E' || text.charAt(index) == '+' || text.charAt(index) == '-')) {
        if (text.charAt(index) == '-' && index > start && text.charAt(index - 1) != 'e' && text.charAt(index - 1) != 'E') {
          break;
        }
        index++;
      }
      String raw = text.substring(start, index);
      if (raw.contains(".") || raw.contains("e") || raw.contains("E")) {
        return Double.parseDouble(raw);
      }
      try {
        return Long.parseLong(raw);
      } catch (NumberFormatException ignored) {
        return Double.parseDouble(raw);
      }
    }

    private boolean parseBoolean() {
      if (peek('t')) {
        expect("true");
        return true;
      }
      expect("false");
      return false;
    }

    private void skip() {
      while (index < text.length() && Character.isWhitespace(text.charAt(index))) {
        index++;
      }
    }

    private boolean peek(char expected) {
      return index < text.length() && text.charAt(index) == expected;
    }

    private void expect(String token) {
      skip();
      if (!text.startsWith(token, index)) {
        throw new IllegalArgumentException("Expected " + token + " at " + index);
      }
      index += token.length();
    }
  }
}
