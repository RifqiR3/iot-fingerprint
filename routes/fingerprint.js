require('dotenv').config();
var express = require('express');
var router = express.Router();
var database = require('../database');

/* GET home page. */
router.get('/', function(req, res, next) {
    let query = `
        SELECT lokasi_node, UID FROM datanode;
    `;
    database.query(query, function(err, data){
        if (err) {
            throw err;
        } else {
            res.render("fingerprint/index", {
                title: "Monitor",
                data: data,
            });
        }
    })
});

router.get('/daftar', function(req, res, next) {
    res.render("fingerprint/fingerprint", {
        title: 'Daftar',
        url: process.env.URL_HOST,
    })
});

router.get('/charts', function(req, res, next) {
    let query = `
        SELECT nama_node, lokasi_node, UID, tgl_daftar, status_node FROM datanode;
    `;
    database.query(query, function(err, data){
        if (err) {
            throw err;
        } else {
            res.render("fingerprint/charts", {
                title: 'Node',
                data: data,
                url: process.env.URL_HOST,
            })
        }
    })
});

router.get('/tables', function(req, res, next) {
    let query = `
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

router.post('/addNode', function(req, res, next){
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
        (id_node, nama_node, lokasi_node, UID, tgl_daftar)
        VALUES ('', "${namaNode}", "${lokasiNode}", "${uid}", "${tanggal.toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })}")
    `;

    database.query(query, function (err, data) {
        if (err){
            throw err;
        } else {
            res.redirect("/fingerprint/charts");
        }
    })
});

router.post('/deleteNode', function(req,res, next){
    // Ambil data dari modal
    let uid = req.body.UID;

    // Query Delete
    let query = `
        DELETE FROM datanode where UID ="${uid}";
    `;

    database.query(query, function (err, data) {
        if (err){
            throw err;
        } else {
            res.redirect("/fingerprint/charts");
        }
    })
});

router.post('/updateNodeStatus', function(req, res, next) {
    // Ambil status update node
    let status = req.body.status;
    let UID = req.body.UID;

    // Query
    let query = `
    UPDATE datanode SET status_node="${status}" WHERE uid="${UID}";
    `;

    database.query(query, function (err, data) {
        if (err){
            throw err;
        } else {
            res.redirect("/fingerprint/charts");
        }
    })
});

router.post('/addUser', function(req, res, next) {
    
});

module.exports = router;
