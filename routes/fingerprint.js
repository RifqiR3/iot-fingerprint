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
        SELECT nama_node, lokasi_node, UID, tgl_daftar, status_node FROM datanode;
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
  const query = `DELETE FROM datajadwal WHERE id = ${id_jadwal}`;
  database.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.json({ success: true, id: id_jadwal });
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

router.get("/receive", function (req, res, next) {
  // Ambil ID jari
  const id_finger = req.query.id;
  console.log(id_finger);
});

module.exports = router;
