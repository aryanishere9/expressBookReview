const express = require("express");
const axios = require("axios");
let books = require("./booksdb.js");
let users = require("./auth_users.js").users;
const login = require("./auth_users.js").login;

const public_users = express.Router();

// Base URL of this same server, so every public route can fetch its data with Axios
const baseUrl = (req) => `${req.protocol}://${req.get("host")}`;

/* ---------- Data endpoints (the source that Axios calls) ---------- */

public_users.get("/api/books", (req, res) => res.status(200).json(books));

public_users.get("/api/books/isbn/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).json(book);
});

public_users.get("/api/books/author/:author", (req, res) => {
  const author = req.params.author.toLowerCase();
  const result = Object.entries(books)
    .filter(([, b]) => b.author.toLowerCase() === author)
    .map(([isbn, b]) => ({ isbn, ...b }));
  if (result.length === 0) return res.status(404).json({ message: "No books found for that author" });
  return res.status(200).json({ booksbyauthor: result });
});

public_users.get("/api/books/title/:title", (req, res) => {
  const title = req.params.title.toLowerCase();
  const result = Object.entries(books)
    .filter(([, b]) => b.title.toLowerCase() === title)
    .map(([isbn, b]) => ({ isbn, ...b }));
  if (result.length === 0) return res.status(404).json({ message: "No books found with that title" });
  return res.status(200).json({ booksbytitle: result });
});

/* ---------- Axios helpers (async/await and Promise callbacks, with error handling) ---------- */

// Get the list of all books - async/await with Axios
const getAllBooks = async (base) => {
  try {
    const response = await axios.get(`${base}/api/books`);
    return response.data;
  } catch (error) {
    throw new Error("Unable to retrieve the list of books: " + error.message);
  }
};

// Get book details by ISBN - Promise callbacks with Axios
const getBookByISBN = (base, isbn) =>
  axios
    .get(`${base}/api/books/isbn/${encodeURIComponent(isbn)}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(
        error.response && error.response.status === 404
          ? "Book not found"
          : "Unable to retrieve the book: " + error.message
      );
    });

// Get book details by author - async/await with Axios
const getBooksByAuthor = async (base, author) => {
  try {
    const response = await axios.get(`${base}/api/books/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response && error.response.status === 404
        ? "No books found for that author"
        : "Unable to retrieve books by author: " + error.message
    );
  }
};

// Get book details by title - async/await with Axios
const getBooksByTitle = async (base, title) => {
  try {
    const response = await axios.get(`${base}/api/books/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response && error.response.status === 404
        ? "No books found with that title"
        : "Unable to retrieve books by title: " + error.message
    );
  }
};

/* ---------- Public routes ---------- */

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (users.some((u) => u.username === username)) {
    return res.status(409).json({ message: "User already exists!" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Login (also available as /customer/login)
public_users.post("/login", login);

// Get the list of all books
public_users.get("/", async (req, res) => {
  try {
    const data = await getAllBooks(baseUrl(req));
    return res.status(200).send(JSON.stringify(data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get book details by ISBN
public_users.get("/isbn/:isbn", (req, res) => {
  getBookByISBN(baseUrl(req), req.params.isbn)
    .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
    .catch((error) =>
      res.status(error.message === "Book not found" ? 404 : 500).json({ message: error.message })
    );
});

// Get book details by author
public_users.get("/author/:author", async (req, res) => {
  try {
    const data = await getBooksByAuthor(baseUrl(req), req.params.author);
    return res.status(200).send(JSON.stringify(data, null, 4));
  } catch (error) {
    return res.status(error.message.startsWith("No books") ? 404 : 500).json({ message: error.message });
  }
});

// Get book details by title
public_users.get("/title/:title", async (req, res) => {
  try {
    const data = await getBooksByTitle(baseUrl(req), req.params.title);
    return res.status(200).send(JSON.stringify(data, null, 4));
  } catch (error) {
    return res.status(error.message.startsWith("No books") ? 404 : 500).json({ message: error.message });
  }
});

// Get book review
public_users.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book.reviews, null, 4));
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
