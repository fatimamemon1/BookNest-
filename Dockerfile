FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY backend/src ./backend/src
COPY frontend ./frontend

RUN mkdir -p backend/out && \
    javac -d backend/out $(find backend/src -name "*.java")

EXPOSE 8080

CMD ["sh", "-c", "java -cp backend/out booknest.server.BookNestServer ${PORT:-8080}"]
