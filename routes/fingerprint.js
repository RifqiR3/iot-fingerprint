require('dotenv').config();
var express = require('express');
var router = express.Router();
var database = require('../database');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render("fingerprint/index", {
        title: 'Index',
    })
});

router.get('/daftar', function(req, res, next) {
    res.render("fingerprint/fingerprint", {
        title: 'Daftar',
        url: process.env.URL_HOST,
    })
});

router.get('/charts', function(req, res, next) {
    res.render("fingerprint/charts", {
        title: 'Charts',
        url: process.env.URL_HOST,
    })
});

router.get('/tables', function(req, res, next) {
    var query = `
        SELECT id, nama, kelas, NIM FROM datamahasiswa;
    `;

    database.query(query, function(err, data){
        if (err){
            throw err;
        } else {
            res.render("fingerprint/tables", {
                title: 'Tables',
                data: data,
                url: process.env.URL_HOST,
            })
        }
    })

    
});

router.get('/validasifinger', function(req, res, next) {
    res.render("fingerprint/validasifinger", {
        title: 'Validasi',
        nama: 'Menunggu...',
        kelas: 'Menunggu...',
        nim: 'Menunggu...',
        persentase: 'Menunggu...',
        url: process.env.URL_HOST,
    })
});

router.post('/addfinger', function(req, res, next) {
    // console.log(req.body);
    console.log(req.body);
    var nama = req.body.nama;
    var kelas = req.body.kelas;
    var nim = req.body.nim;
    var finger = req.body.finger;

    var query = `
        INSERT INTO datamahasiswa
        (id, nama, kelas, nim, fingerPrint)
        VALUES ('', "${nama}", "${kelas}", "${nim}", "${finger}")
    `;

    database.query(query, function(err, data){
        if (err){
            throw err;
        } else {
            res.redirect("/fingerprint/daftar");
        }
    })
});

router.post('/validasi', function(req, res, next) {
    let persentaseAwal = 0;
    let persentaseAkhir = 0;
    let finger = req.body.finger;

    if(finger == "") {
        res.redirect('/fingerprint/validasifinger');
    }

    let query = `SELECT * FROM datamahasiswa`;

    database.query(query, function(err, data) {
        if (err) {
            throw err;
        } else {
            let hasilData = [{
                nama: "Tes",
                kelas: "Tes",
                nim: "Tes",
            }];

            for (let index = 0; index <= data.length; index++) {
                if (data[index] && data[index].fingerPrint) {
                    persentaseAwal = calculateSimilarity(finger, data[index].fingerPrint);
                    if (persentaseAkhir <= persentaseAwal) {
                        hasilData[0].nama = data[index].nama;
                        hasilData[0].kelas = data[index].kelas;
                        hasilData[0].nim = data[index].NIM;
                        persentaseAkhir = persentaseAwal;
                    }
                    console.log(data[index].nama);
                    console.log(data[index].fingerPrint);
                    console.log(`Persentase: ${persentaseAwal}`);

                    if (index === data.length - 1) {
                        res.render("fingerprint/validasifinger", { 
                            title: 'Validasi',
                            nama: hasilData[0].nama,
                            kelas: hasilData[0].kelas,
                            nim: hasilData[0].nim,
                            persentase: persentaseAkhir,
                            url: process.env.URL_HOST,
                        });
                        break;
                    }
                } else {
                    continue;
                }
            }
        }
    });
});

function calculateSimilarity(str1, str2) {
    const len1 = str1.length + 1;
    const len2 = str2.length + 1;

    const matrix = Array(len1).fill(null).map(() => Array(len2).fill(0));

    for (let i = 0; i < len1; i++) {
        for (let j = 0; j < len2; j++) {
            if (i === 0) {
                matrix[i][j] = j;
            } else if (j === 0) {
                matrix[i][j] = i;
            } else {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
    }

    const distance = matrix[len1 - 1][len2 - 1];
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return similarity.toFixed(2);
}

function calculateBinarySimilarity(str1, str2) {
    if (str1.length !== str2.length) {
        throw new Error("Strings must have the same length for comparison.");
    }

    const totalBytes = str1.length;
    let matchingBytes = 0;

    for (let i = 0; i < totalBytes; i += 2) {
        const byte1 = str1.slice(i, i + 2);
        const byte2 = str2.slice(i, i + 2);

        if (byte1 === byte2) {
            matchingBytes += 2; // Assuming each character represents a byte in hexadecimal
        }
    }

    const similarityPercentage = (matchingBytes / totalBytes) * 100;

    return similarityPercentage.toFixed(2);
}

function hexSimilarity(hexString1, hexString2) {
    // Convert hexadecimal strings to binary
    const bin1 = BigInt(`0x${hexString1}`).toString(2);
    const bin2 = BigInt(`0x${hexString2}`).toString(2);
  
    // Pad the binary strings to make them of equal length
    const maxLength = Math.max(bin1.length, bin2.length);
    const paddedBin1 = bin1.padStart(maxLength, '0');
    const paddedBin2 = bin2.padStart(maxLength, '0');
  
    // Calculate the Hamming distance
    const hammingDistance = [...paddedBin1].reduce(
      (acc, bit, index) => acc + (bit !== paddedBin2[index] ? 1 : 0),
      0
    );
  
    // Calculate the percentage similarity
    const similarityPercentage = ((maxLength - hammingDistance) / maxLength) * 100;
  
    return similarityPercentage.toFixed(2);
}
  

module.exports = router;
