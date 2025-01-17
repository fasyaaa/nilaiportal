const express = require("express");
const router = express.Router();
const connection = require("../config/database");
const puppeteer = require("puppeteer"); 

// Middleware untuk memastikan user sudah login
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/portalnilai"); // Redirect ke halaman login jika belum login
  }
  next();
};



// Halaman dashboard dosen
router.get("/", isAuthenticated, (req, res) => {
  const user = req.session.user;
  connection.query("SELECT * FROM nilai ORDER BY idMk DESC", (err, rows) => {
    if (err) {
      console.error("Error fetching matakuliah:", err);
      return res.status(500).send("Error fetching matakuliah");
    }

    res.render("dosen", {
      title: "Dashboard Dosen",
      data: rows,
      user: user,
    });
  });
});

// Tampilkan daftar nilai berdasarkan mata kuliah
// router.get("/nilai", isAuthenticated, (req, res) => {
//   const { idMk } = req.query; // Ambil idMk dari query (bukan params)

//   connection.query("SELECT * FROM matakuliah", (err, matkulRows) => {
//     if (err) {
//       console.error("Error fetching matakuliah:", err);
//       return res.status(500).send("Error fetching matakuliah");
//     }

//     connection.query(
//       `SELECT 
//           n.idMk, 
//           n.idMahasiswa, 
//           n.nilai, 
//           n.predikat, 
//           n.keterangan, 
//           m.namaMk, 
//           mh.nama AS namaMahasiswa
//        FROM nilai n
//        JOIN matakuliah m ON n.idMk = m.idMk
//        JOIN mahasiswa mh ON n.idMahasiswa = mh.idMahasiswa
//        WHERE n.idMk = ?`,
//       [idMk],
//       (err, nilaiRows) => {
//         if (err) {
//           console.error("Error fetching nilai:", err);
//           return res.status(500).send("Error fetching nilai");
//         }

//         connection.query("SELECT * FROM mahasiswa", (err, mahasiswaRows) => {
//           if (err) {
//             console.error("Error fetching mahasiswa:", err);
//             return res.status(500).send("Error fetching mahasiswa");
//           }

//           res.render("nilai", {
//             title: "Kelola Nilai Mahasiswa",
//             matkulList: matkulRows,
//             nilaiList: nilaiRows,
//             mahasiswaList: mahasiswaRows,
//             idMk: idMk,
//           });
//         });
//       }
//     );
//   });
// });

router.get("/nilai", isAuthenticated, (req, res) => {
  const { idMk } = req.query;

  connection.query("SELECT * FROM matakuliah", (err, matkulRows) => {
    if (err) {
      return res.status(500).send("Error fetching matakuliah");
    }

    connection.query("SELECT * FROM mahasiswa", (err, mahasiswaRows) => {
      if (err) {
        return res.status(500).send("Error fetching mahasiswa");
      }

      connection.query(
        `SELECT * FROM nilai WHERE idMk = ?`,
        [idMk],
        (err, nilaiRows) => {
          if (err) {
            return res.status(500).send("Error fetching nilai");
          }

          res.render("nilai", {
            title: "Kelola Nilai Mahasiswa",
            matkulList: matkulRows,
            mahasiswaList: mahasiswaRows,
            nilaiList: nilaiRows,
            idMk: idMk || "",
          });
        }
      );
    });
  });
});


// Tambah atau update nilai mahasiswa
router.post('/nilai/tambah', (req, res) => {
  const { idMk, idMahasiswa, nilai, predikat, keterangan } = req.body;

  // Ambil nama mata kuliah berdasarkan idMk
  connection.query("SELECT namaMk FROM matakuliah WHERE idMk = ?", [idMk], (err, result) => {
      if (err || result.length === 0) {
          return res.status(500).send("Mata kuliah tidak ditemukan.");
      }

      const namaMk = result[0].namaMk;
      const values = [idMk, idMahasiswa, nilai, predikat, keterangan, namaMk];

      const query = `
          INSERT INTO nilai (idMk, idMahasiswa, nilai, predikat, keterangan, namaMk)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          nilai = VALUES(nilai), 
          predikat = VALUES(predikat), 
          keterangan = VALUES(keterangan), 
          namaMk = VALUES(namaMk);
      `;

      connection.query(query, values, (err) => {
          if (err) {
              console.error("Error inserting/updating nilai:", err);
              return res.status(500).send("Error inserting/updating nilai");
          }
          res.redirect(`/portalnilai/dosen/nilai?idMk=${idMk}`);
      });
  });
});

// Edit nilai mahasiswa
// Route untuk mendapatkan data nilai berdasarkan ID (untuk pengeditan)
router.get("/nilai/edit", isAuthenticated, (req, res) => {
  const { idMk, idMahasiswa } = req.query;

  if (!idMk || !idMahasiswa) {
    return res.status(400).send("Parameter idMk dan idMahasiswa diperlukan.");
  }

  connection.query(
    "SELECT * FROM nilai WHERE idMk = ? AND idMahasiswa = ?",
    [idMk, idMahasiswa],
    (err, nilaiRows) => {
      if (err) {
        console.error("Error fetching nilai:", err);
        return res.status(500).send("Error fetching nilai");
      }

      if (nilaiRows.length === 0) {
        return res.status(404).send("Nilai tidak ditemukan.");
      }

      connection.query("SELECT * FROM matakuliah", (err, matkulRows) => {
        if (err) {
          return res.status(500).send("Error fetching matakuliah");
        }

        connection.query("SELECT * FROM mahasiswa", (err, mahasiswaRows) => {
          if (err) {
            return res.status(500).send("Error fetching mahasiswa");
          }

          res.render("editNilai", {
            title: "Edit Nilai Mahasiswa",
            nilai: nilaiRows[0],
            matkulList: matkulRows,
            mahasiswaList: mahasiswaRows,
          });
        });
      });
    }
  );
});


// Route untuk menampilkan halaman edit nilai
router.get("/nilai/edit/:idMk/:idMahasiswa", isAuthenticated, (req, res) => {
  const { idMk, idMahasiswa } = req.params;

  // Ambil data nilai berdasarkan idMk dan idMahasiswa
  connection.query(
    "SELECT * FROM nilai WHERE idMk = ? AND idMahasiswa = ?",
    [idMk, idMahasiswa],
    (err, nilaiRows) => {
      if (err) {
        console.error("Error fetching nilai:", err);
        return res.status(500).send("Error fetching nilai");
      }

      if (nilaiRows.length === 0) {
        return res.status(404).send("Data nilai tidak ditemukan");
      }

      // Ambil daftar mata kuliah dan mahasiswa untuk form
      connection.query("SELECT * FROM matakuliah", (err, matkulRows) => {
        if (err) {
          console.error("Error fetching matakuliah:", err);
          return res.status(500).send("Error fetching matakuliah");
        }

        connection.query("SELECT * FROM mahasiswa", (err, mahasiswaRows) => {
          if (err) {
            console.error("Error fetching mahasiswa:", err);
            return res.status(500).send("Error fetching mahasiswa");
          }

          // Render halaman edit nilai
          res.render("editnilai", {
            title: "Edit Nilai Mahasiswa",
            nilai: nilaiRows[0], // Data nilai yang akan diedit
            matkulList: matkulRows, // Daftar mata kuliah
            mahasiswaList: mahasiswaRows, // Daftar mahasiswa
          });
        });
      });
    }
  );
});

// Route untuk memperbarui nilai mahasiswa
router.post("/nilai/update", isAuthenticated, (req, res) => {
  const { idMk, idMahasiswa, nilai, predikat, keterangan } = req.body;

  connection.query(
    "UPDATE nilai SET nilai = ?, predikat = ?, keterangan = ? WHERE idMk = ? AND idMahasiswa = ?",
    [nilai, predikat, keterangan, idMk, idMahasiswa],
    (err) => {
      if (err) {
        console.error("Error updating nilai:", err);
        return res.status(500).send("Error updating nilai");
      }
      res.redirect(`/portalnilai/dosen`);
    }
  );
});


// Hapus nilai mahasiswa
router.post("/nilai/hapus", isAuthenticated, (req, res) => {
  const { idMk, idMahasiswa } = req.body;

  connection.query(
    "DELETE FROM nilai WHERE idMk = ? AND idMahasiswa = ?",
    [idMk, idMahasiswa],
    (err) => {
      if (err) {
        console.error("Error deleting nilai:", err);
        return res.status(500).send("Error deleting nilai");
      }
      res.redirect(`/portalnilai/dosen`);
    }
  );
});

// Logout dosen
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).send("Error logging out");
    }
    res.redirect("/portalnilai");
  });
});

// Route untuk menampilkan laporan berdasarkan mata kuliah
router.get("/laporan", (req, res) => {
  const { idMk } = req.query;

  // Query untuk mengambil daftar mata kuliah
  connection.query("SELECT idMk, namaMk FROM matakuliah", (err, mataKuliahRows) => {
    if (err) {
      console.error("Error fetching mata kuliah:", err);
      return res.status(500).send("Error fetching mata kuliah");
    }

    if (idMk) {
      connection.query(
        `SELECT 
            n.idMk, 
            n.idMahasiswa, 
            n.nilai, 
            n.predikat, 
            n.keterangan, 
            m.namaMk, 
            mh.nama AS namaMahasiswa
         FROM nilai n
         JOIN matakuliah m ON n.idMk = m.idMk
         JOIN mahasiswa mh ON n.idMahasiswa = mh.idMahasiswa
         WHERE n.idMk = ?`,
        [idMk],
        (err, laporanRows) => {
          if (err) {
            console.error("Error fetching laporan:", err);
            return res.status(500).send("Error fetching laporan");
          }
    
          res.render("laporan", {
            mataKuliahList: mataKuliahRows,  // Daftar mata kuliah
            laporanList: laporanRows || [], // Default ke array kosong jika tidak ada data
          });
        }
      );
    } else {
      // Jika tidak ada idMk, hanya tampilkan daftar mata kuliah
      res.render("laporan", { 
        mataKuliahList: mataKuliahRows, 
        laporanList: [] // Default ke array kosong
      });
    }    
  });
});

// Route untuk mengunduh laporan
router.get("/laporan/unduh", (req, res) => {
  const { idMk } = req.query;

  connection.query(
    `SELECT 
        n.idMk, 
        n.idMahasiswa, 
        n.nilai, 
        n.predikat, 
        n.keterangan, 
        m.namaMk, 
        mh.nama AS namaMahasiswa
     FROM nilai n
     JOIN matakuliah m ON n.idMk = m.idMk
     JOIN mahasiswa mh ON n.idMahasiswa = mh.idMahasiswa
     WHERE n.idMk = ?`,
    [idMk],
    async (err, laporanRows) => {
      if (err) {
        console.error("Error fetching laporan:", err);
        return res.status(500).send("Error fetching laporan");
      }

      if (!laporanRows.length) {
        return res.status(404).send("Tidak ada data untuk mata kuliah ini.");
      }

      // Render HTML ke PDF
      res.render(
        "printLaporan",
        { title: `Laporan Nilai Mata Kuliah ${idMk}`, laporanList: laporanRows },
        async (err, htmlContent) => {
          if (err) {
            console.error("Error rendering HTML:", err);
            return res.status(500).send("Error rendering HTML");
          }

          try {
            const browser = await puppeteer.launch({
              headless: true,
              args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
            const page = await browser.newPage();

            // Menunggu halaman selesai dimuat
            await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

            // Ambil screenshot untuk verifikasi
            await page.screenshot({ path: "screenshot.png" });
            console.log("Screenshot saved for debugging.");

            // Generate PDF
            const pdfBuffer = await page.pdf({
              format: "A4",
              printBackground: true,
              margin: { top: "20px", bottom: "20px", left: "10px", right: "10px" },
            });
            await browser.close();
            const fs = require('fs');
fs.writeFileSync('laporan_output.pdf', pdfBuffer);  // Menyimpan PDF ke disk untuk pemeriksaan
console.log('PDF saved.');
            // Kirimkan PDF ke pengguna
            res.set({
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="laporan_${idMk}.pdf"`,
            });
            res.send(pdfBuffer);
          } catch (pdfErr) {
            console.error("Error generating PDF:", pdfErr);
            res.status(500).send("Error generating PDF");
          }
        }
      );
    }
  );
});

module.exports = router;
