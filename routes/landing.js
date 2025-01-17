const express = require("express");
//const bcrypt = require("bcrypt");
const router = express.Router();
const connection = require("../config/database");

router.get("/", (req, res) => {
    console.log("Akses landing");
    res.render("landing", {title: "Homepage", error: null});
  });

router.post("/", async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.render("login", {
        title: "Login",
        error: "Masukkan Username dan Password yang benar.",
      });
    }
  
    const query = "SELECT * FROM user WHERE username = ?";
    connection.query(query, [username], async (err, result) => {
      if (err) {
        console.error("Error querying database:", err);
        return res.status(500).send("Database Error");
      }
  
      if (result.length === 0) {
        return res.render("login", {
          title: "Login",
          error: "Username tidak ditemukan.",
        });
      }
  
      const user = result[0];
  
      // Validasi password
      const isPasswordValid = password === user.password; // Jika password plaintext
      // const isPasswordValid = await bcrypt.compare(password, user.password); // Jika password hashed
  
      if (!isPasswordValid) {
        return res.render("login", {
          title: "Login",
          error: "Password salah.",
        });
      }
  
      req.session.user = user; // Simpan session user
  
      // Redirect berdasarkan role
      const userPath = user.role === 3 ? "mahasiswa" : "dosen";
      res.redirect(`/portalnilai/${userPath}`);
    });
  });
  
  module.exports = router;
 