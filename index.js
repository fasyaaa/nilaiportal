const express = require("express");
const app = express();
const port = 3000;
const session = require("express-session");

// Konfigurasi session
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Gunakan true jika menggunakan HTTPS di produksi
  })
);

// Middleware untuk menangani body-parser (untuk menangani form-data)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const cors = require("cors");
app.use(cors());

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.static("assets"));

// import routes file
app.use('/assets', express.static('assets'));

// Import routes
const landingPage = require("./routes/landing");
const loginRouter = require("./routes/login");
const mahasiswaRouter = require("./routes/mahasiswa");
const dosenRouter = require("./routes/dosen");
const nilaiRouter = require("./routes/nilai");

// Routing landing
app.use("/portalnilai/", landingPage);
app.get("/", (req, res) => {
  res.redirect("/portalnilai/");
});


//ruting login
app.use("/portalnilai/login", loginRouter);

app.use("/portalnilai/mahasiswa", mahasiswaRouter);
app.use("/portalnilai/dosen", dosenRouter);
app.use("/portalnilai/dosen/nilai", nilaiRouter);

app.listen(port, () => {
  console.log(`Website listening at http://localhost:${port}`);
});
