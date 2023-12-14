// Disable tombol update
document.getElementById("update_user").classList.add("disabled");
document.getElementById("fingerButton").classList.add("disabled");

function clickRow(data) {
  console.log(data);
  // Disable tombol update
  document.getElementById("update_user").classList.add("disabled");
  document.getElementById("fingerButton").classList.add("disabled");
  // Hilangkan konfirmasi table terpilih
  document.getElementById("confirm_row").style.display = "none";
  document.getElementById("input_nim").value = "";
  document.getElementById("input_nama").value = "";
  document.getElementById("input_id_finger").value = "";
  document.getElementById("input_UID").value = "";
  document.getElementById("input_id_node").value = "";
  document.getElementById("statusFinger").value = "";
  // Cek apakah baris aktif
  let isActive = data.classList.contains("table-active");
  // Hapus class 'table-active' dari semua baris
  let allRows = document.querySelectorAll("tbody tr");
  allRows.forEach(function (row) {
    row.classList.remove("table-active");
  });
  // Jika baris tidak aktif, aktifkan dan ambil datanya didalam
  if (!isActive) {
    document.getElementById("update_user").classList.remove("disabled");
    data.classList.add("table-active");
    // Tampilkan konfirmasi table dipilih
    document.getElementById("confirm_row").style.display = "block";
    // Ambil data dari baris yang dipilih
    let dataKolom = data.getElementsByTagName("td");
    console.log(dataKolom);
    // Masukkan data baris yang dipilih ke input form 2
    document.getElementById("input_nim").value = dataKolom[3].innerText;
    document.getElementById("input_nama").value = dataKolom[2].innerText;
    document.getElementById("input_id_finger").value = dataKolom[0].innerText;
    document.getElementById("input_UID").value = dataKolom[7].innerText;
    document.getElementById("input_id_node").value = dataKolom[8].innerText;
    // Cek mode node
    if (dataKolom[9].innerText == "129") {
      document.getElementById("statusFinger").value =
        "NODE INI DALAM MODE ABSENSI";
    } else {
      document.getElementById("statusFinger").value =
        "KLIK TOMBOL UNTUK MENDAFTAR FINGER";
      document.getElementById("fingerButton").classList.remove("disabled");
    }
  }
}

function addUser() {
  fetch("/fingerprint/addUser", {
    method: "POST",
    headers: {
      "Content-Type": "Application/json",
    },
    body: JSON.stringify({
      id_finger: document.getElementById("idfinger").value,
      id_node: document.getElementById("idnode").value,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.error) {
        // Periksa console jika ada error
        console.error(data.error);
      } else if (data.exists) {
        Swal.fire({
          icon: "error",
          title: "Data sudah ada",
          text: "ID dan Node ini sudah ada di database",
        });
      } else if (data.zerofinger) {
        Swal.fire({
          icon: "error",
          title: "ID ERROR",
          text: "ID tidak boleh 0 atau lebih dari 127",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Data Dimasukkan!",
          text: "Data berhasil dimasukkan ke dalam database",
        }).then(() => {
          window.location.href = "/fingerprint";
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function updateUser() {
  console.log("Form submitted");
  const payload = {
    nim: document.getElementById("input_nim").value,
    nama: document.getElementById("input_nama").value,
    kelas: document.getElementById("selectKelas").value,
    id_finger: document.getElementById("input_id_finger").value,
    uid: document.getElementById("input_UID").value,
  };
  console.log("Payload:", payload);
  fetch("/fingerprint/updateUser", {
    method: "POST",
    headers: {
      "Content-Type": "Application/json",
    },
    body: JSON.stringify({
      nim: document.getElementById("input_nim").value,
      nama: document.getElementById("input_nama").value,
      kelas: document.getElementById("selectKelas").value,
      id_finger: document.getElementById("input_id_finger").value,
      uid: document.getElementById("input_UID").value,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.error) {
        // Periksa console jika ada error
        console.error(data.error);
      } else if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil Update!",
          text: "Data berhasil diupdate!",
        }).then(() => {
          window.location.href = "/fingerprint";
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
