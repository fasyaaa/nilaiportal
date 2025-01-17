const express = require("express");
const router = express.Router();
const connection = require("../config/database");

// Halaman dashboard dosen untuk mengelola nilai
router.get("/", (req, res) => {
  connection.query("SELECT * FROM matakuliah", (err, matkulRows) => {
    if (err) {
      return res.status(500).send("Error fetching matakuliah");
    }
    res.render("dosen", { title: "Dashboard Dosen", matkulList: matkulRows });
  });
});

// Tampilkan daftar mahasiswa berdasarkan mata kuliah yang dipilih
router.post("/nilai", (req, res) => {
  const { idMk } = req.body;

  connection.query(
    "SELECT n.*, m.namaMk, d.nama AS namaDosen, mh.nama AS namaMahasiswa FROM nilai n JOIN matakuliah m ON n.idMk = m.idMk JOIN dosen d ON n.idDosen = d.idDosen JOIN mahasiswa mh ON n.idMahasiswa = mh.idMahasiswa WHERE n.idMk = ?",
    [idMk],
    (err, nilaiRows) => {
      if (err) {
        return res.status(500).send("Error fetching nilai");
      }
      connection.query("SELECT * FROM mahasiswa", (err, mahasiswaRows) => {
        if (err) {
          return res.status(500).send("Error fetching mahasiswa");
        }
        connection.query("SELECT * FROM dosen", (err, dosenRows) => {
          if (err) {
            return res.status(500).send("Error fetching dosen");
          }
          connection.query("SELECT * FROM matakuliah", (err, matkulRows) => {
            if (err) {
              return res.status(500).send("Error fetching matakuliah");
            }
            res.render("nilai", {
              title: "Kelola Nilai Mahasiswa",
              nilaiList: nilaiRows || [],
              mahasiswaList: mahasiswaRows || [],
              dosenList: dosenRows || [],
              matkulList: matkulRows || [],
              idMk: idMk,
            });
          });
        });
      });
    }
  );
});

// Tambah atau update nilai mahasiswa
router.post('/nilai/tambah', (req, res) => {
  const { idMk, idMahasiswa, idDosen, nilai, predikat, keterangan } = req.body;

  // Validasi data input
  if (!idMk || !idMahasiswa || !idDosen || !nilai || !predikat || !keterangan) {
      return res.status(400).send('Data tidak lengkap. Pastikan semua kolom terisi.');
  }

  // Query untuk menyimpan data nilai
  const sql = 'INSERT INTO nilai (idMk, idMahasiswa, idDosen, nilai, predikat, keterangan) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [idMk, idMahasiswa, idDosen, nilai, predikat, keterangan], (err, result) => {
      if (err) throw err;
      res.redirect('/portalnilai/dosen');
  });
});


// Hapus nilai mahasiswa
router.get("/nilai", (req, res) => {
  connection.query("SELECT * FROM nilai", (err, nilaiRows) => {
    if (err) {
      return res.status(500).send("Error fetching nilai");
    }
    connection.query("SELECT * FROM dosen", (err, dosenRows) => {
      if (err) {
        return res.status(500).send("Error fetching dosen");
      }
      connection.query("SELECT * FROM mahasiswa", (err, mahasiswaRows) => {
        if (err) {
          return res.status(500).send("Error fetching mahasiswa");
        }
        connection.query("SELECT * FROM matakuliah", (err, matkulRows) => {
          if (err) {
            return res.status(500).send("Error fetching matakuliah");
          }
          res.render("nilai", {
            title: "Kelola Nilai Mahasiswa",
            nilaiList: nilaiRows || [],
            dosenList: dosenRows || [],
            mahasiswaList: mahasiswaRows || [],
            matkulList: matkulRows || [],
          });
        });
      });
    });
  });
});

module.exports = router;
