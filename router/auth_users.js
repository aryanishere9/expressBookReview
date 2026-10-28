const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");

const regd_users = express.Router();

let users = [];

const authenticatedUser = (username, password) =>
  users.some((u) => u.username === username && u.password === password);

// Only registered users can login
const login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login. Check username and password" });
  }
  const accessToken = jwt.sign({ data: username }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({ message: "Login successful!", token: accessToken });
};

regd_users.post("/login", login);

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;
  if (!books[isbn]) return res.status(404).json({ message: "Book not found" });
  if (!review) return res.status(400).json({ message: "Review text is required (?review=...)" });
  const existed = books[isbn].reviews[username] !== undefined;
  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: existed
      ? `Review for ISBN ${isbn} updated successfully`
      : `Review for ISBN ${isbn} added successfully`,
    reviews: books[isbn].reviews
  });
});

// Delete the logged-in user's review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;
  if (!books[isbn]) return res.status(404).json({ message: "Book not found" });
  if (books[isbn].reviews[username] === undefined) {
    return res.status(404).json({ message: "No review by this user for that book" });
  }
  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Review for ISBN ${isbn} posted by user ${username} deleted`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.users = users;
module.exports.login = login;
