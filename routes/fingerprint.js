var express = require('express');
var router = express.Router();
var database = require('../database');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render("fingerprintIndex", {
        title: 'Daftar',
    })
});

router.post('/addfinger', function(req, res, next) {
    // console.log(req.body);
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
            res.redirect("/fingerprint");
        }
        
    })
});

module.exports = router;
