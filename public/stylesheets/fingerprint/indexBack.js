const Swal = require('sweetalert2');

function clickRow(data) {
    console.log(data);
    // Hilangkan konfirmasi table terpilih
    document.getElementById('confirm_row').style.display = 'none';
    document.getElementById('input_nim').value = '';
    document.getElementById('input_nama').value = '';
    document.getElementById('input_kelas').value = '';
    // Cek apakah baris aktif
    let isActive = data.classList.contains('table-active');
    // Hapus class 'table-active' dari semua baris
    let allRows = document.querySelectorAll('tbody tr');
    allRows.forEach(function(row) {
        row.classList.remove('table-active');
    });
    // Jika baris tidak aktif, aktifkan dan ambil datanya didalam
    if (!isActive) {
      data.classList.add('table-active');
      // Tampilkan konfirmasi table dipilih
      document.getElementById('confirm_row').style.display = 'block';
      // Ambil data dari baris yang dipilih
      let dataKolom = data.getElementsByTagName('td');
      // Masukkan data baris yang dipilih ke input form 2
      document.getElementById('input_nim').value = dataKolom[3].innerText;
      document.getElementById('input_nama').value = dataKolom[2].innerText;
      document.getElementById('input_kelas').value = dataKolom[4].innerText;
    }
}

function addUser(event) {
    event.preventDefault();
    fetch('/fingerprint/addUser', {
      method: 'POST',
      headers:{
        'Content-Type': 'Application/json'
      },
      body: JSON.stringify({
        id_finger: document.getElementById('idfinger').value,
        id_node: document.getElementById('idnode').value
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      if (data.error) {
        // Periksa console jika ada error
        console.error(data.error)
      } else if (data.exists) {
        Swal.fire({
          icon: 'error',
          title: 'Data sudah ada',
          text: 'ID dan Node ini sudah ada di database',
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Data Dimasukkan!',
          text: 'Data berhasil dimasukkan ke dalam database',
        }).then (() => {
          window.location.href = '/fingerprint';
        });
      }
    })
    .catch(error => {
      console.error('Error:', error);
    })
  }

