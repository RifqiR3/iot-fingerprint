require("dotenv").config();
var express = require("express");
var router = express.Router();
var database = require("../database");
const excel = require("exceljs");
const moment = require("moment");

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
            INNER JOIN datakelas ON datamahasiswa.id_kelas=datakelas.id_kelas;`;
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
    }
    const queryMatkul = "SELECT * FROM datamatkul";
    database.query(queryMatkul, function (err2, datamatkul) {
      if (err2) {
        throw err2;
      }
      res.render("fingerprint/kelas", {
        title: "Kelas",
        data: data,
        datamatkul: datamatkul,
      });
    });
  });
});

router.post("/addMatkul", function (req, res, next) {
  const matkul = req.body.matkul;
  const query = `INSERT INTO datamatkul VALUES (NULL, "${matkul}")`;
  database.query(query, function (err, data) {
    if (err) {
      throw err;
    }
    res.json({
      berhasil: true,
      message: "Jadwal berhasil dimasukkan",
    });
  });
});

router.post("/deleteMatkul", function (req, res, next) {
  const id_matkul = req.body.id_matkul;
  const query = `DELETE FROM datamatkul WHERE id_matkul = ${id_matkul}`;
  database.query(query, function (err, data) {
    if (err) {
      throw err;
    }
    res.json({
      berhasil: true,
      message: "Matkul berhasil dihapus!",
    });
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
    INNER JOIN datamatkul ON datajadwal.id_matkul = datamatkul.id_matkul
    INNER JOIN datanode ON datajadwal.id_node = datanode.id_node
    INNER JOIN datakelas ON datajadwal.id_kelas = datakelas.id_kelas
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
          const queryKelas = `SELECT * FROM datakelas WHERE id_kelas < 1000`;
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
  SELECT NULL, ${data.id_node}, ${data.id_matkul}, ${data.id_kelas}, ${data.id_hari}, '${data.waktu_masuk}', '${data.waktu_keluar}'
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
    waktu_mulai: req.body.waktu_mulai,
    waktu_selesai: req.body.waktu_selesai,
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
    SELECT
      a.id_absen,
      m.nama,
      m.NIM,
      k.kelas,
      n.lokasi_node,
      h.hari,
      c.matkul,
      a.tanggal,
      a.absen_in,
      a.absen_out,
      a.waktu_terlambat
    FROM
      dataabsen a
    INNER JOIN
      datamahasiswa m ON a.id_mahasiswa = m.id_mahasiswa
    INNER JOIN
      datamatkul c ON a.id_matkul = c.id_matkul
    INNER JOIN
      datanode n ON a.id_node = n.id_node
    INNER JOIN 
      datahari h ON a.id_hari = h.id_hari
    INNER JOIN
      datakelas k ON m.id_kelas = k.id_kelas;
    `;

  database.query(query, function (err, data) {
    if (err) {
      throw err;
    }

    const queryKelas = "SELECT * FROM datakelas WHERE id_kelas < 10000";
    database.query(queryKelas, function (err2, datakelas) {
      if (err2) {
        throw err2;
      }

      res.render("fingerprint/tables", {
        title: "Tables",
        data: data,
        datakelas: datakelas,
        url: process.env.URL_HOST,
      });
    });
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
      const query = `INSERT INTO datamahasiswa (NIM, nama, id_kelas, id_finger, id_node, tgl_daftar_mhs, status_finger) VALUES ("empty", "empty", "10000", ?, ?, ?, "empty")`;
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
  console.log(id_finger);
  console.log(id_node);
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
    const queryCheckMatkul = `SELECT * FROM datajadwal WHERE id_kelas = ${check[0].id_kelas} AND id_hari = ${today} AND id_node = ${id_node} AND ('${time}' BETWEEN waktu_mulai AND waktu_selesai)`;
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
      IF(SELECT absen_out FROM dataabsen WHERE id_mahasiswa = ${check[0].id_mahasiswa} AND id_node = ${check[0].id_node} AND id_matkul = ${checkMatkul[0].id_matkul} AND tanggal = '${todayFullDate}') = '00:00:00' THEN
        UPDATE dataabsen SET absen_out = '${time}' WHERE id_mahasiswa = ${check[0].id_mahasiswa} AND id_node = ${check[0].id_node} AND id_matkul = ${checkMatkul[0].id_matkul} AND tanggal = '${todayFullDate}';
        UPDATE datarekap SET status_hadir = "Hadir" WHERE id_mahasiswa = ${check[0].id_mahasiswa} AND id_node = ${check[0].id_node} AND id_matkul = ${checkMatkul[0].id_matkul} AND tanggal = '${todayFullDate}';
      ELSEIF(SELECT absen_out FROM dataabsen WHERE id_mahasiswa = ${check[0].id_mahasiswa} AND id_node = ${check[0].id_node} AND id_matkul = ${checkMatkul[0].id_matkul} AND tanggal = '${todayFullDate}') != '00:00:00' THEN
        SELECT id_absen FROM dataabsen WHERE id_absen = 0;
      ELSE
        INSERT INTO dataabsen (id_absen, id_mahasiswa, id_node, id_hari, id_matkul, tanggal, absen_in, absen_out, waktu_terlambat)
        VALUES (NULL, ${check[0].id_mahasiswa}, ${check[0].id_node}, ${today}, ${checkMatkul[0].id_matkul}, '${todayFullDate}', '${time}', '00:00:00', '${waktuTerlambat}');
        INSERT INTO datarekap VALUES (NULL, ${check[0].id_mahasiswa}, ${check[0].id_kelas}, ${checkMatkul[0].id_matkul}, ${check[0].id_node}, '${todayFullDate}', "Alfa");
      END IF`;
      console.log(queryInsertAbsen);
      database.query(queryInsertAbsen, function (err3, insertAbsen) {
        console.log(insertAbsen);
        if (err3) {
          throw err3;
        }
        const queryCheckColumn = `
        SELECT * FROM dataabsen 
        WHERE id_mahasiswa = ${check[0].id_mahasiswa} AND id_node = ${check[0].id_node} AND id_matkul = ${checkMatkul[0].id_matkul} AND tanggal = '${todayFullDate}'
        `;
        database.query(queryCheckColumn, function (err4, checkColumn) {
          if (err4) {
            throw err4;
          } else if (checkColumn[0].absen_out == "00:00:00") {
            console.log(checkColumn[0].absen_out);
            return res.json({
              status: `Halo ${check[0].nama}, kelas ini sudah dimulai dan anda terlambat sekitar ${waktuTerlambat}`,
            });
          } else if (insertAbsen[1]) {
            console.log(insertAbsen[1]);
            return res.json({
              status: `Sepertinya anda sudah absen dua kali, silahkan tunggu kelas berikutnya`,
            });
          } else if (checkColumn[0].absen_out != "00:00:00") {
            console.log(checkColumn[0].absen_out);
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

router.get("/download-rekap", function (req, res) {
  // Ambil data
  const id_kelas = req.query.kelas;
  const startDate = moment(req.query.tglawal, "YYYY-MM-DD").format(
    "DD-MM-YYYY"
  );
  const endDate = moment(req.query.tglakhir, "YYYY-MM-DD").format("DD-MM-YYYY");

  // Sheet
  const workbook = new excel.Workbook();
  const queryNIM = `
  SELECT 
    m.nama, 
    m.NIM, 
    k.kelas, 
    c.matkul, 
    r.lokasi_node, 
    tanggal, 
    status_hadir 
  FROM datarekap dr 
  INNER JOIN 
    datamahasiswa m ON m.id_mahasiswa = dr.id_mahasiswa 
  INNER JOIN 
    datakelas k ON k.id_kelas = dr.id_kelas 
  INNER JOIN 
    datamatkul c ON c.id_matkul = dr.id_matkul 
  INNER JOIN 
    datanode r ON r.id_node = dr.id_node
  WHERE dr.id_kelas = ${id_kelas} 
  ORDER BY m.NIM ASC`;

  database.query(queryNIM, function (err, results) {
    if (err) {
      throw err;
    }
    let checkNIM = [];
    let checkMatkul = [];
    let counter = 0;
    for (let index = 0; index < results.length; index++) {
      if (checkNIM.includes(results[index].NIM)) {
        counter++;
      } else {
        checkNIM.push(results[index].NIM);
        counter = 0;
        checkMatkul.length = 0;
      }

      // Inisiasi Worksheet
      let worksheet = workbook.getWorksheet(results[index].NIM);
      // Check worksheet ada atau tidak
      if (!worksheet) {
        // Tambah worksheet baru
        worksheet = workbook.addWorksheet(results[index].NIM);
        // Set worksheet ke worksheet yang sekarang
        workbook.activeSheet = results[index].NIM;

        // Kolom Header
        worksheet.addRow(["Mata Kuliah", "Minggu ke"]);

        // Styling dan Merge kolom ID
        worksheet.mergeCells(1, 1, 2, 1);
        const kolom_id = worksheet.getCell(2, 1);
        kolom_id.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        kolom_id.font = { bold: true };

        // Data minggu berdasarkan jarak waktu
        const week = Array.from(
          { length: getWeeksBetween(startDate, endDate).length },
          (_, index) => index + 1
        );

        // Masukkan data minggu berdasarkan tanggal yang dimasukkan
        week.forEach((value, index) => {
          worksheet.getCell(2, index + 2).value = value;
          worksheet.getCell(2, index + 2).alignment = { horizontal: "center" };
        });

        // Styling dan Merging Kolom Header Minggu-ke
        worksheet.mergeCells(1, 2, 1, week.length + 1);
        const kolom_minggu = worksheet.getCell(1, 2);
        kolom_minggu.alignment = { horizontal: "center" };
        kolom_minggu.font = { bold: true };

        // Masukkan data ke excel
        // Masukkan matkul ke setiap baris di awal
        checkMatkul.push(results[index].matkul);
        checkMatkul.push("counter + 3, 1");
        worksheet.getCell(counter + 3, 1).value = results[index].matkul;

        // Auto-size kolom
        const column = worksheet.getColumn(1);
        const columnLength = results[index].matkul
          ? results[index].matkul.toString().length
          : 10;
        column.width = columnLength < 10 ? 10 : columnLength + 4;

        // Cari minggu keberapa kehadiran
        const minggu = cariMinggu(results[index].tanggal, startDate, endDate);
        if (minggu == -1) {
          continue;
        } else {
          worksheet.getCell(counter + 3, minggu + 1).value =
            results[index].status_hadir;
          worksheet.getCell(counter + 3, minggu + 1).alignment = {
            horizontal: "center",
          };
        }
      } else {
        // Cari minggu keberapa kehadiran
        const minggu = cariMinggu(results[index].tanggal, startDate, endDate);
        // Masukkan data ke excel
        // Masukkan matkul ke setiap baris di awal
        if (checkMatkul.includes(results[index].matkul)) {
          if (minggu == -1) {
            continue;
          } else {
            worksheet.getCell(counter + 3, minggu + 1).value =
              results[index].status_hadir;
            worksheet.getCell(counter + 3, minggu + 1).alignment = {
              horizontal: "center",
            };
          }
        } else {
          checkMatkul.push(results[index].matkul);
          checkMatkul.push("counter + 3, 1");
          worksheet.getCell(counter + 3, 1).value = results[index].matkul;
          if (minggu == -1) {
            continue;
          } else {
            worksheet.getCell(counter + 3, minggu + 1).value =
              results[index].status_hadir;
            worksheet.getCell(counter + 3, minggu + 1).alignment = {
              horizontal: "center",
            };
          }
        }
      }
    }

    // Set header file, baru save
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Rekap-absen-mahasiswa-${results[0].kelas}(${startDate}-${endDate}).xlsx"`
    );
    workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Internal Server Error");
      });
  });

  // Fungsi buat array kolom minggu
  function getWeeksBetween(startDate, endDate) {
    const weeks = [];
    let currentWeek = moment(startDate, "DD-MM-YYYY").startOf("week");

    while (
      currentWeek.isBefore(moment(endDate, "DD-MM-YYYY").startOf("week"))
    ) {
      weeks.push(currentWeek.format("DD-MM-YYYY"));
      currentWeek.add(1, "week");
    }

    return weeks;
  }

  function cariMinggu(targetDate, startDate, endDate) {
    var momentStartDate = moment(startDate, "DD-MM-YYYY");
    var momentEndDate = moment(endDate, "DD-MM-YYYY");
    var momentTargetDate = moment(targetDate, "DD-MM-YYYY");

    // Check if the target date is within the range
    if (
      momentTargetDate.isBetween(momentStartDate, momentEndDate, null, "[]")
    ) {
      // Calculate the week number of the target date within the specified range
      var weekNumber = momentTargetDate.isoWeek();
      return weekNumber;
    } else {
      // Return an indication that the target date is outside the specified range
      return -1; // You can choose any value that indicates the target date is outside the range
    }
  }
});

router.get("/perizinan", function (req, res) {
  const query = `
    SELECT DISTINCT
      m.nama,
      m.NIM,
      k.kelas
    FROM datamahasiswa m
    INNER JOIN
      datakelas k ON m.id_kelas = k.id_kelas
    ;
  `;

  database.query(query, function (err, results) {
    if (err) {
      throw err;
    }

    res.render("fingerprint/perizinan", {
      title: "Perizinan",
      data: results,
      url: process.env.URL_HOST,
    });
  });
});

router.post("/izin", function (req, res) {
  const nim = req.body.nim;

  const currentDate = new Date();
  const today = currentDate.getDay();
  const time = `${
    currentDate.getHours() < 10 ? "0" : ""
  }${currentDate.getHours()}:${
    currentDate.getMinutes() < 10 ? "0" : ""
  }${currentDate.getMinutes()}:${
    currentDate.getSeconds() < 10 ? "0" : ""
  }${currentDate.getSeconds()}`;
  // Data tanggal hari ini full
  const todayFullDate = `${
    currentDate.getDate() < 10 ? "0" : ""
  }${currentDate.getDate()}/${currentDate.getMonth() + 1 < 10 ? "0" : ""}${
    currentDate.getMonth() + 1
  }/${currentDate.getFullYear()}`;

  const queryCheckMahasiswa = `
  SELECT DISTINCT m.id_mahasiswa, m.nama, m.NIM, m.id_kelas, k.kelas
  FROM datamahasiswa m 
  INNER JOIN
    datakelas k ON k.id_kelas = m.id_kelas
  WHERE NIM = ${nim};
  `;

  database.query(queryCheckMahasiswa, function (err, checkMahasiswa) {
    if (err) {
      throw err;
    }

    const queryCheckJadwal = `
    SELECT * FROM datajadwal 
    WHERE id_kelas = ${checkMahasiswa[0].id_kelas} AND id_hari = ${today} AND ('${time}' BETWEEN waktu_mulai AND waktu_selesai);
    `;

    database.query(queryCheckJadwal, function (err2, checkJadwal) {
      if (err2) {
        throw err2;
      }

      if (checkJadwal.length == 0) {
        return res.json({
          berhasil: false,
          pesan: "Mahasiswa ini tidak memiliki kuliah yang berjalan sekarang",
        });
      }

      const queryCheckIzin = `
      SELECT * FROM datarekap 
      WHERE id_mahasiswa = ${checkMahasiswa[0].id_mahasiswa} 
      AND id_kelas = ${checkMahasiswa[0].id_kelas} 
      AND id_matkul = ${checkJadwal[0].id_matkul}
      AND id_node = ${checkJadwal[0].id_node}
      AND tanggal = '${todayFullDate}'
      `;

      database.query(queryCheckIzin, function (err3, checkIzin) {
        if (err3) {
          throw err3;
        }

        if (checkIzin.length > 0) {
          if (checkIzin[0].status_hadir == "Izin") {
            return res.json({
              berhasil: false,
              pesan:
                "Mahasiswa ini sudah izin pada mata kuliah ini pada minggu ini",
            });
          } else if (checkIzin[0].status_hadir == "Hadir") {
            return res.json({
              berhasil: false,
              pesan:
                "Mahasiswa ini sudah hadir pada mata kuliah ini pada minggu ini",
            });
          } else {
            return res.json({
              berhasil: false,
              pesan:
                "Mahasiswa ini belum checkout pada mata kuliah ini pada minggu ini",
            });
          }
        }

        const queryInsertIzinAbsen = `
          INSERT INTO dataabsen VALUES (NULL, ${checkMahasiswa[0].id_mahasiswa}, ${checkJadwal[0].id_node}, ${today}, ${checkJadwal[0].id_matkul}, '${todayFullDate}', '00:00:01', '00:00:01', '00:00:01');
        `;

        database.query(queryInsertIzinAbsen, function (err4, izinAbsen) {
          if (err4) {
            throw err4;
          }

          const queryInsertIzinRekap = `
            INSERT INTO datarekap VALUES (NULL, ${checkMahasiswa[0].id_mahasiswa}, ${checkMahasiswa[0].id_kelas}, ${checkJadwal[0].id_matkul}, ${checkJadwal[0].id_node}, '${todayFullDate}', "Izin");
          `;

          database.query(queryInsertIzinRekap, function (err5, izinRekap) {
            if (err5) {
              throw err5;
            }
            return res.json({ berhasil: true });
          });
        });
      });
    });
  });
});

router.get("/chart-mahasiswa", function (req, res) {
  const nim = req.query.nim;

  const query = `SELECT dr.status_hadir, dr.tanggal, dt.matkul, dm.nama FROM datarekap dr
  INNER JOIN datamahasiswa dm ON dr.id_mahasiswa = dm.id_mahasiswa
  INNER JOIN datamatkul dt ON dr.id_matkul = dt.id_matkul
  WHERE dm.NIM = ${nim}`;

  database.query(query, function (err, result) {
    if (err) {
      throw err;
    }

    let statusData = [];
    let tanggalData = [];
    let matkulData = [];
    let namaData = result[0].nama;

    for (let index = 0; index < result.length; index++) {
      if (result[index].status_hadir == "Hadir") {
        statusData.push(3);
      } else if (result[index].status_hadir == "Alfa") {
        statusData.push(2);
      } else {
        statusData.push(1);
      }

      tanggalData.push(result[index].tanggal);
      matkulData.push(result[index].matkul);
    }

    res.render("fingerprint/chart", {
      data_status: statusData,
      data_tanggal: tanggalData,
      data_matkul: matkulData,
      data_nama: namaData,
    });
  });
});

module.exports = router;
