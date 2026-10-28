const express = require("express");
const axios = require("axios");
let books = require("./booksdb.js");
let users = require("./auth_users.js").users;
const login = require("./auth_users.js").login;

const public_users = express.Router();

// Base URL of this same server, so every public route can fetch its data with Axios
const baseUrl = (req) => `${req.protocol}://${req.get("host")}`;

/* ---------- Data endpoints (the "remote" source that Axios calls) ---------- */

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

/* ---------- Public routes (each one uses Axios) ---------- */

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

// Task 10: Get the list of all books - async/await with Axios
public_users.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${baseUrl(req)}/api/books`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving the book list" });
  }
});

// Task 11: Get book details by ISBN - Promise callbacks with Axios
public_users.get("/isbn/:isbn", (req, res) => {
  axios
    .get(`${baseUrl(req)}/api/books/isbn/${encodeURIComponent(req.params.isbn)}`)
    .then((response) => res.status(200).send(JSON.stringify(response.data, null, 4)))
    .catch((error) => {
      const status = error.response ? error.response.status : 500;
      return res.status(status).json({ message: "Book not found" });
    });
});

// Task 12: Get book details by author - async/await with Axios
public_users.get("/author/:author", async (req, res) => {
  try {
    const response = await axios.get(
      `${baseUrl(req)}/api/books/author/${encodeURIComponent(req.params.author)}`
    );
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    return res.status(status).json({ message: "No books found for that author" });
  }
});

// Task 13: Get book details by title - async/await with Axios
public_users.get("/title/:title", async (req, res) => {
  try {
    const response = await axios.get(
      `${baseUrl(req)}/api/books/title/${encodeURIComponent(req.params.title)}`
    );
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    return res.status(status).json({ message: "No books found with that title" });
  }
});

// Get book review
public_users.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book.reviews, null, 4));
});

module.exports.general = public_users;
