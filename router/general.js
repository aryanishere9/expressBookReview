const express = require("express");
const axios = require("axios");
let books = require("./booksdb.js");
let users = require("./auth_users.js").users;

const public_users = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

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

// Get the book list available in the shop
public_users.get("/", (req, res) => {
  return new Promise((resolve) => resolve(books)).then((data) =>
    res.status(200).send(JSON.stringify(data, null, 4))
  );
});

// Get book details based on ISBN
public_users.get("/isbn/:isbn", (req, res) => {
  new Promise((resolve, reject) => {
    const book = books[req.params.isbn];
    book ? resolve(book) : reject(new Error("Book not found"));
  })
    .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
    .catch((err) => res.status(404).json({ message: err.message }));
});

// Get book details based on author
public_users.get("/author/:author", (req, res) => {
  new Promise((resolve) => {
    const author = req.params.author.toLowerCase();
    resolve(
      Object.entries(books)
        .filter(([, b]) => b.author.toLowerCase() === author)
        .map(([isbn, b]) => ({ isbn, ...b }))
    );
  }).then((result) => {
    if (result.length === 0) return res.status(404).json({ message: "No books found for that author" });
    return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
  });
});

// Get all books based on title
public_users.get("/title/:title", (req, res) => {
  new Promise((resolve) => {
    const title = req.params.title.toLowerCase();
    resolve(
      Object.entries(books)
        .filter(([, b]) => b.title.toLowerCase() === title)
        .map(([isbn, b]) => ({ isbn, ...b }))
    );
  }).then((result) => {
    if (result.length === 0) return res.status(404).json({ message: "No books found with that title" });
    return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
  });
});

// Get book review
public_users.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Book not found" });
  return res.status(200).send(JSON.stringify(book.reviews, null, 4));
});

/* ---------- Axios client functions (promise callbacks / async-await) ---------- */

// Get all books using async/await with Axios
const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

// Get book details by ISBN using a Promise callback with Axios
const getBookByISBN = (isbn) =>
  axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`).then((response) => response.data);

// Get book details by author using async/await with Axios
const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

// Get book details by title using async/await with Axios
const getBooksByTitle = async (title) => {
  const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
  return response.data;
};

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
