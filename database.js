const mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    database: 'finger_mahasiswa',
    user: 'root',
    password: ''
});

connection.connect(function(error){
    if(error) {
        throw new Error("Database tidak aktif");
    } else {
        console.log('MySQL database terconnect');
    }
});

module.exports = connection;