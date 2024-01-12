require("dotenv").config();
var express = require("express");
var router = express.Router();
var database = require("../database");

/* GET home page. */
router.get("/", function (req, res, next) {
  let query = `
        SELECT id_node, lokasi_node, UID FROM datanode;
    `;
  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      let queryUser = `SELECT *
            FROM datamahasiswa
            INNER JOIN datanode ON datamahasiswa.id_node=datanode.id_node
            INNER JOIN datakelas ON datamahasiswa.id_kelas=datakelas.id;`;
      database.query(queryUser, function (err2, dataMhs) {
        if (err2) {
          throw err2;
        } else {
          let queryKelas = `SELECT * FROM datakelas`;
          database.query(queryKelas, function (err3, dataKelas) {
            if (err3) {
              throw err3;
            } else {
              res.render("fingerprint/index", {
                title: "Monitor",
                data: data,
                dataMhs: dataMhs,
                dataKelas: dataKelas,
                url: process.env.URL_HOST,
              });
            }
          });
        }
      });
    }
  });
});

router.get("/daftar", function (req, res, next) {
  res.render("fingerprint/fingerprint", {
    title: "Daftar",
    url: process.env.URL_HOST,
  });
});

router.get("/charts", function (req, res, next) {
  let query = `
        SELECT id_node, nama_node, lokasi_node, UID, tgl_daftar, status_node FROM datanode;
    `;
  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.render("fingerprint/charts", {
        title: "Node",
        data: data,
        url: process.env.URL_HOST,
      });
    }
  });
});

router.get("/kelas", function (req, res, next) {
  // Query
  const query = "SELECT id_node, lokasi_node from datanode";
  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.render("fingerprint/kelas", {
        title: "Kelas",
        data: data,
      });
    }
  });
});

router.get("/kelasDet", function (req, res, next) {
  // Ambil data id
  const id = req.query.id;
  const id_node = [
    {
      id_node: id,
    },
  ];
  // Query
  const query = `
    SELECT datajadwal.id, datajadwal.id_matkul, datajadwal.id_hari, datajadwal.id_kelas , datajadwal.waktu_mulai, datajadwal.waktu_selesai, datamatkul.matkul, datanode.id_node, datanode.lokasi_node, datakelas.kelas FROM datajadwal 
    INNER JOIN datamatkul ON datajadwal.id_matkul = datamatkul.id 
    INNER JOIN datanode ON datajadwal.id_node = datanode.id_node
    INNER JOIN datakelas ON datajadwal.id_kelas = datakelas.id
    WHERE datajadwal.id_node = ${id};`;

  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      const queryMatkul = `SELECT * FROM datamatkul`;
      database.query(queryMatkul, function (err2, datamatkul) {
        if (err2) {
          throw err2;
        } else {
          const queryKelas = `SELECT * FROM datakelas WHERE id < 1000`;
          database.query(queryKelas, function (err3, dataKelas) {
            if (err3) {
              throw err3;
            }
            if (data.length == 0) {
              res.render("fingerprint/kelasDet", {
                kosong: true,
                title: "Kosong",
                data: id_node,
                datamatkul: datamatkul,
                datakelas: dataKelas,
              });
            } else {
              res.render("fingerprint/kelasDet", {
                kosong: false,
                data: data,
                datamatkul: datamatkul,
                datakelas: dataKelas,
                title: data[0].lokasi_node,
              });
            }
          });
        }
      });
    }
  });
});

router.post("/addJadwal", function (req, res, next) {
  // Ambil data
  const data = {
    id_matkul: req.body.id_matkul,
    id_hari: req.body.id_hari,
    id_kelas: req.body.id_kelas,
    id_node: req.body.id_node,
    waktu_masuk: req.body.waktu_masuk,
    waktu_keluar: req.body.waktu_keluar,
  };
  console.log(data);
  // Query ribet
  const query = `
  INSERT INTO datajadwal (id, id_node, id_matkul, id_kelas, id_hari, waktu_mulai, waktu_selesai)
  SELECT '', ${data.id_node}, ${data.id_matkul}, ${data.id_kelas}, ${data.id_hari}, '${data.waktu_masuk}', '${data.waktu_keluar}'
  FROM dual
  WHERE NOT EXISTS (
    SELECT 1
    FROM datajadwal
    WHERE (id_node = ${data.id_node} AND id_kelas = ${data.id_kelas} AND id_matkul = ${data.id_matkul} AND
      (('${data.waktu_masuk}' BETWEEN waktu_mulai AND waktu_selesai)
      OR ('${data.waktu_keluar}' BETWEEN waktu_mulai AND waktu_selesai)
      OR (waktu_mulai BETWEEN '${data.waktu_masuk}' AND '${data.waktu_keluar}')
      OR (waktu_selesai BETWEEN '${data.waktu_masuk}' AND '${data.waktu_keluar}'))
    )
    OR (id_node = ${data.id_node} AND id_hari = ${data.id_hari} AND
      (('${data.waktu_masuk}' BETWEEN waktu_mulai AND waktu_selesai)
      OR ('${data.waktu_keluar}' BETWEEN waktu_mulai AND waktu_selesai)
      OR (waktu_mulai BETWEEN '${data.waktu_masuk}' AND '${data.waktu_keluar}')
      OR (waktu_selesai BETWEEN '${data.waktu_masuk}' AND '${data.waktu_keluar}'))
    )
    OR (id_matkul = ${data.id_matkul} AND id_kelas = ${data.id_kelas})
  );
  `;

  console.log(query);
  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      // Cek duplikasi jadwal
      const baris = data.affectedRows;
      if (baris > 0) {
        res.json({
          berhasil: true,
          message: "Jadwal berhasil dimasukkan",
        });
      } else {
        res.json({
          berhasil: false,
          message: "Sepertinya ada jadwal kelas yang bertabrakan :(",
        });
      }
    }
  });
});

router.post("/deleteJadwal", function (req, res, next) {
  // Ambil data
  const id_jadwal = req.body.id_jadwal;
  // Query
  const query = `DELETE FROM datajadwal WHERE id = ${id_jadwal}`;
  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.json({ success: true, id: id_jadwal });
    }
  });
});

router.post("/updateJadwal", function (req, res, next) {
  // Ambil data
  const data = {
    id_node: req.body.id_node,
    id_jadwal: req.body.id_jadwal,
    id_hari: req.body.id_hari,
    id_matkul: req.body.id_matkul,
    id_kelas: req.body.id_kelas,
    waktu_mulai: req.body.waktu_mulai + ":00",
    waktu_selesai: req.body.waktu_selesai + ":00",
  };

  // Query ribet again
  const query = `
  UPDATE datajadwal SET
  id_matkul = ${data.id_matkul},
  id_kelas = ${data.id_kelas},
  id_hari = ${data.id_hari},
  waktu_mulai = '${data.waktu_mulai}',
  waktu_selesai = '${data.waktu_selesai}'
  WHERE id = ${data.id_jadwal}
  AND NOT EXISTS (
    SELECT 1
    FROM datajadwal
    WHERE (id_node = ${data.id_node} AND id_kelas = ${data.id_kelas} AND id_matkul = ${data.id_matkul} AND
      (('${data.waktu_mulai}' BETWEEN waktu_mulai AND waktu_selesai)
      OR ('${data.waktu_selesai}' BETWEEN waktu_mulai AND waktu_selesai)
      OR (waktu_mulai BETWEEN '${data.waktu_mulai}' AND '${data.waktu_selesai}')
      OR (waktu_selesai BETWEEN '${data.waktu_mulai}' AND '${data.waktu_selesai}'))
    )
    OR (id_node = ${data.id_node} AND id_hari = ${data.id_hari} AND
      (('${data.waktu_mulai}' BETWEEN waktu_mulai AND waktu_selesai)
      OR ('${data.waktu_selesai}' BETWEEN waktu_mulai AND waktu_selesai)
      OR (waktu_mulai BETWEEN '${data.waktu_mulai}' AND '${data.waktu_selesai}')
      OR (waktu_selesai BETWEEN '${data.waktu_mulai}' AND '${data.waktu_selesai}'))
    )
  );
  `;
  const queryCheckJadwal = `SELECT * FROM datajadwal WHERE id_matkul = ${data.id_matkul} AND id_kelas = ${data.id_kelas}`;
  console.log(query);
  database.query(queryCheckJadwal, function (errCheck, dataCheck) {
    if (errCheck) {
      throw errCheck;
    }
    if (dataCheck.length == 1) {
      database.query(query, function (err, data) {
        if (err) {
          throw err;
        } else {
          // Cek duplikasi jadwal
          const baris = data.affectedRows;
          if (baris > 0) {
            res.json({
              berhasil: true,
              message: "Jadwal berhasil diedit",
            });
          } else {
            res.json({
              berhasil: false,
              message: "Sepertinya ada jadwal kelas yang bertabrakan :(",
            });
          }
        }
      });
    }
  });
});

router.get("/tables", function (req, res, next) {
  let query = `
        SELECT id_mahasiswa, nama, id_kelas, NIM FROM datamahasiswa;
    `;

  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.render("fingerprint/tables", {
        title: "Tables",
        data: data,
        url: process.env.URL_HOST,
      });
    }
  });
});

router.get("/validasifinger", function (req, res, next) {
  res.render("fingerprint/validasifinger", {
    title: "Validasi",
    nama: "Menunggu...",
    kelas: "Menunggu...",
    nim: "Menunggu...",
    persentase: "Menunggu...",
    url: process.env.URL_HOST,
  });
});

router.post("/addNode", function (req, res, next) {
  // Ambil data dari model form node
  let namaNode = req.body.namaNode;
  let lokasiNode = req.body.lokasiNode;
  // Generate UID
  let uid = Math.random().toString(16).slice(2);
  // Tanggal Daftar
  let tanggal = new Date();
  // Query insert ke datanode
  let query = `
        INSERT INTO datanode
        (id_node, nama_node, lokasi_node, UID, tgl_daftar, status_node)
        VALUES ('', "${namaNode}", "${lokasiNode}", "${uid}", "${tanggal.toLocaleString(
          "id-ID",
          { timeZone: "Asia/Makassar" }
        )}", "128")
    `;

  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.redirect("/fingerprint/charts");
    }
  });
});

router.post("/deleteNode", function (req, res, next) {
  // Ambil data dari modal
  let uid = req.body.UID;

  // Query Delete
  let query = `
        DELETE FROM datanode where UID ="${uid}";
    `;

  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.redirect("/fingerprint/charts");
    }
  });
});

router.post("/updateNodeStatus", function (req, res, next) {
  // Ambil status update node
  let status = req.body.status;
  let UID = req.body.UID;

  // Query
  let query = `
    UPDATE datanode SET status_node="${status}" WHERE uid="${UID}";
    `;

  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.redirect("/fingerprint/charts");
    }
  });
});

router.post("/addUser", function (req, res, next) {
  // Ambil data id_finger
  const id_finger = req.body.id_finger;
  // Cek value id_finger
  if (id_finger <= 0 || id_finger > 127) {
    res.json({ zerofinger: true });
    return;
  }
  // Ambil data id_node
  const id_node = req.body.id_node;
  // Query
  const queryCheck =
    "SELECT * FROM datamahasiswa WHERE id_finger = ? AND id_node = ?";
  const valuesCheck = [id_finger, id_node];
  // Check dulu apakah data sudah ada atau belum
  database.query(queryCheck, valuesCheck, function (err, data) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    } else if (data.length > 0) {
      console.log("Data ada");
      res.json({ exists: true });
    } else {
      // Kalau tidak ada lanjut insert data ke database
      let tanggal = new Date();
      const query = `INSERT INTO datamahasiswa VALUES ('', "empty", "empty", "10000", ?, ?, ?, "empty")`;
      const values = [
        id_finger,
        id_node,
        tanggal.toLocaleString("id-ID", { timeZone: "Asia/Makassar" }),
      ];

      database.query(query, values, function (err, data) {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal Server Error" });
        } else {
          res.json({ exists: false });
        }
      });
    }
  });
});

router.post("/updateUser", function (req, res, next) {
  // Ambil data
  const nim = req.body.nim;
  const nama = req.body.nama;
  const kelas = req.body.kelas;
  const id_finger = req.body.id_finger;
  const uid = req.body.uid;
  // Query
  const query = `UPDATE datamahasiswa
    JOIN datanode
    ON datanode.id_node = datamahasiswa.id_node
    SET datamahasiswa.nama = "${nama}", datamahasiswa.NIM = "${nim}", datamahasiswa.id_kelas = "${kelas}"
    WHERE datamahasiswa.id_finger = "${id_finger}" AND datanode.UID = "${uid}"`;
  // Jalankan query
  database.query(query, function (err, data) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err });
    } else {
      res.json({ success: true });
    }
  });
});

router.post("/updateStatusFinger", function (req, res, next) {
  // Ambil data
  const id_node = req.body.id_node;
  const id_finger = req.body.id_finger;
  // Query
  const query = `
    UPDATE datamahasiswa
    SET status_finger = 'ada'
    WHERE id_finger = ${id_finger} AND id_node = ${id_node};
    `;
  // Jalankan Query
  database.query(query, function (err, data) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err });
    } else {
      res.json({ success: true });
    }
  });
});

router.post("/getMahasiswa", function (req, res, next) {
  // Ambil data
  const id_node = req.body.id_node;
  const id_finger = req.body.id_finger;
  // Query
  const query = `
    SELECT nama FROM datamahasiswa WHERE id_node = "${id_node}" AND id_finger = "${id_finger}";
    `;
  // Jalankan Query
  database.query(query, function (err, data) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err });
    } else {
      console.log(data);
      res.json({ success: true, nama: data[0].nama });
    }
  });
});

router.post("/absen", function (req, res, next) {
  // Ambil data yang dibutuh
  const id_finger = req.body.id_finger;
  const id_node = req.body.id_node;
  // Inisialisasi instance object untuk dapat id_hari hari ini, dan ambil tanggal hari ini
  const currentDate = new Date();
  // Data hari
  const today = currentDate.getDay();
  // Data tanggal hari ini full
  const todayFullDate = `${
    currentDate.getDate() < 10 ? "0" : ""
  }${currentDate.getDate()}/${currentDate.getMonth() + 1 < 10 ? "0" : ""}${
    currentDate.getMonth() + 1
  }/${currentDate.getFullYear()}`;
  // Data Waktu sekarang
  const time = `${
    currentDate.getHours() < 10 ? "0" : ""
  }${currentDate.getHours()}:${
    currentDate.getMinutes() < 10 ? "0" : ""
  }${currentDate.getMinutes()}:${
    currentDate.getSeconds() < 10 ? "0" : ""
  }${currentDate.getSeconds()}`;
  // Query check mahasiswa
  const queryCheckMahasiswa = `SELECT * FROM datamahasiswa WHERE id_finger = ${id_finger} AND id_node = ${id_node};`;
  // Jalankan query terus check ada tidak mahasiswa ini dikelas yang bersangkutan
  database.query(queryCheckMahasiswa, function (err, check) {
    if (err) {
      throw err;
    } else if (check.length == 0) {
      return res.json({ status: "Anda tidak punya kelas disini" });
    }
    // Query check matkul
    const queryCheckMatkul = `SELECT * FROM datajadwal WHERE id_hari = ${today} AND id_node = ${id_node} AND ('${time}' BETWEEN waktu_mulai AND waktu_selesai)`;
    database.query(queryCheckMatkul, function (err2, checkMatkul) {
      if (err2) {
        throw err2;
      } else if (checkMatkul.length == 0) {
        return res.json({
          status: `Halo ${check[0].nama}, kelas ini belum dimulai`,
        });
      }
      const waktuTerlambat = checkLateTime(time, checkMatkul[0].waktu_mulai);
      const queryInsertAbsen = `
      IF(SELECT absen_out FROM dataabsen WHERE id_mahasiswa = ${check[0].id_mahasiswa} AND id_node = ${check[0].id_node} AND tanggal = '${todayFullDate}') = '00:00:00' THEN
        UPDATE dataabsen SET absen_out = '${time}' WHERE id_mahasiswa = ${check[0].id_mahasiswa} AND id_node = ${check[0].id_node} AND tanggal = '${todayFullDate}';
      ELSEIF(SELECT absen_out FROM dataabsen WHERE id_mahasiswa = ${check[0].id_mahasiswa} AND id_node = ${check[0].id_node} AND tanggal = '${todayFullDate}') != '00:00:00' THEN
        SELECT id_absen FROM dataabsen WHERE id_absen = 0;
      ELSE
        INSERT INTO dataabsen (id_absen, id_mahasiswa, id_node, id_hari, id_matkul, tanggal, absen_in, absen_out, waktu_terlambat)
        VALUES ('', ${check[0].id_mahasiswa}, ${check[0].id_node}, ${today}, ${checkMatkul[0].id_matkul}, '${todayFullDate}', '${time}', '00:00:00', '${waktuTerlambat}');
      END IF`;
      database.query(queryInsertAbsen, function (err3, insertAbsen) {
        console.log(insertAbsen);
        if (err3) {
          throw err3;
        }
        const queryCheckColumn = `
        SELECT * FROM dataabsen 
        WHERE id_mahasiswa = ${check[0].id_mahasiswa} AND id_node = ${check[0].id_node} AND tanggal = '${todayFullDate}';
        `;
        database.query(queryCheckColumn, function (err4, checkColumn) {
          console.log(checkColumn);
          if (err4) {
            throw err4;
          } else if (checkColumn[0].absen_out == "00:00:00") {
            return res.json({
              status: `Selamat datang ${check[0].nama}, kelas ini sudah dimulai dan anda terlambat sekitar ${waktuTerlambat}`,
            });
          } else if (
            checkColumn[0].absen_out != "00:00:00" &&
            checkColumn[0].absen_in != "00:00:00"
          ) {
            return res.json({
              status: `Sepertinya anda sudah absen dua kali, silahkan tunggu kelas berikutnya`,
            });
          } else {
            return res.json({
              status: `Halo ${check[0].nama}, anda keluar di waktu ${checkColumn[0].absen_out}`,
            });
          }
        });
      });
    });
  });

  function checkLateTime(time1, time2) {
    const date1 = new Date("1970-01-01T" + time1 + "Z");
    const date2 = new Date("1970-01-01T" + time2 + "Z");
    const timeDiffMilliseconds = date1 - date2;
    const timeDiff = new Date(timeDiffMilliseconds).toISOString().substr(11, 8);
    return timeDiff;
  }
});

module.exports = router;
