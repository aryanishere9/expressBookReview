const express = require("express");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const customer_routes = require("./router/auth_users.js").authenticated;
const genl_routes = require("./router/general.js").general;

const app = express();
app.use(express.json());

app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

// Authentication middleware for protected customer routes
app.use("/customer/auth", (req, res, next) => {
  const auth = req.session.authorization;
  if (!auth) return res.status(403).json({ message: "User not logged in" });
  jwt.verify(auth.accessToken, "access", (err) => {
    if (err) return res.status(403).json({ message: "User not authenticated" });
    next();
  });
});

const PORT = 5000;
app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running on port " + PORT));
