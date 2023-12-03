// Disable tombol update
document.getElementById('update_user').classList.add('disabled');
document.getElementById('fingerButton').classList.add('disabled');

function clickRow(data) {
    console.log(data);
    // Disable tombol update
    document.getElementById('update_user').classList.add('disabled');
    document.getElementById('fingerButton').classList.add('disabled');
    // Hilangkan konfirmasi table terpilih
    document.getElementById('confirm_row').style.display = 'none';
    document.getElementById('input_nim').value = '';
    document.getElementById('input_nama').value = '';
    document.getElementById('input_kelas').value = '';
    document.getElementById('input_id_finger').value = '';
    document.getElementById('input_UID').value = '';
    document.getElementById('statusFinger').value = '';
    // Cek apakah baris aktif
    let isActive = data.classList.contains('table-active');
    // Hapus class 'table-active' dari semua baris
    let allRows = document.querySelectorAll('tbody tr');
    allRows.forEach(function(row) {
        row.classList.remove('table-active');
    });
    // Jika baris tidak aktif, aktifkan dan ambil datanya didalam
    if (!isActive) {
        document.getElementById('update_user').classList.remove('disabled');
        document.getElementById('fingerButton').classList.remove('disabled');
        data.classList.add('table-active');
        // Tampilkan konfirmasi table dipilih
        document.getElementById('confirm_row').style.display = 'block';
        // Ambil data dari baris yang dipilih
        let dataKolom = data.getElementsByTagName('td');
        // Masukkan data baris yang dipilih ke input form 2
        document.getElementById('input_nim').value = dataKolom[3].innerText;
        document.getElementById('input_nama').value = dataKolom[2].innerText;
        document.getElementById('input_kelas').value = dataKolom[4].innerText;
        document.getElementById('input_id_finger').value = dataKolom[0].innerText;
        document.getElementById('input_UID').value = dataKolom[7].innerText;
        document.getElementById('statusFinger').value = 'KLIK TOMBOL UNTUK MENDAFTAR FINGER';
    }
}






