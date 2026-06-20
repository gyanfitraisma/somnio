/* =========================
   LOGIN
========================= */
function loginUser(event) {
    // Mencegah reload halaman bawaan saat form disubmit
    event.preventDefault();

    // Mengambil nilai teks dari input username dan password
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Validasi untuk memastikan kedua kolom tidak kosong
    if (username === "" || password === "") {
        alert("Lengkapi data login");
        return;
    }

    // Menyimpan session nama pengguna dan kata sandi ke LocalStorage
    localStorage.setItem("somnioUser", username);
    localStorage.setItem("somnioPassword", password);

    // Mengalihkan halaman ke dashboard utama setelah sukses login
    window.location.href = "dashboard.html";
}

/* =========================
   LOGOUT
========================= */
function logout() {
    // Menghapus data session user untuk keluar dari aplikasi
    localStorage.removeItem("somnioUser");
    // Mengembalikan pengguna ke halaman login
    window.location.href = "login.html";
}

/* =========================
   TAMPILKAN USER
========================= */
function tampilkanUser() {
    // Mengambil nama user yang sedang aktif dari LocalStorage
    const nama = localStorage.getItem("somnioUser");
    const element = document.getElementById("namaUser");
    // Jika elemen HTML pembungkus nama ada, injeksikan nama user ke dalamnya
    if (element) {
        element.innerHTML = nama || "Pengguna";
    }
}

/* =========================
   SIMPAN DATA TIDUR (DARI FORM)
========================= */
function simpanDataTidur(event) {
    // Mencegah form memicu reload halaman otomatis
    event.preventDefault();

    // Mengambil nilai skor kualitas tidur yang dihasilkan form
    const kualitasValue = document.getElementById("kualitas").value;

    // Validasi memastikan perhitungan jam sudah berjalan (form sudah diisi lengkap)
    if (!kualitasValue || kualitasValue === "") {
        alert("Silakan isi Jam Mulai Tidur dan Jam Bangun terlebih dahulu agar kualitas terhitung!");
        return;
    }

    // Menyusun kumpulan data form menjadi satu objek utuh
    const data = {
        tanggal: document.getElementById("tanggal").value,
        jamTidur: document.getElementById("jamTidur").value,
        jamBangun: document.getElementById("jamBangun").value,
        kualitas: kualitasValue,
        catatan: document.getElementById("catatan").value
    };

    // Mengambil identitas user aktif untuk memisahkan database penyimpanan lokal
    const user = localStorage.getItem("somnioUser");

    // Mengambil array riwayat lama (jika ada), jika belum ada buat array kosong baru
    let riwayat = JSON.parse(localStorage.getItem(`sleepData_${user}`)) || [];
    // Menambahkan objek data tidur baru ke dalam array riwayat
    riwayat.push(data);

    // Menyimpan kembali array riwayat yang telah diperbarui ke LocalStorage dalam bentuk teks JSON
    localStorage.setItem(`sleepData_${user}`, JSON.stringify(riwayat));
    alert("Data berhasil disimpan");

    // Mengalihkan navigasi halaman ke riwayat tabel data tidur
    window.location.href = "history.html";
}

/* =========================
   AMBIL DATA TIDUR
========================= */
function ambilDataTidur() {
    // Fungsi pembantu untuk memanggil array data tidur milik user yang sedang aktif
    const user = localStorage.getItem("somnioUser");
    return JSON.parse(localStorage.getItem(`sleepData_${user}`)) || [];
}

/* =========================
   RESET DATA
========================= */
function resetDataTidur() {
    // Memunculkan dialog konfirmasi sebelum melakukan penghapusan data
    if (confirm("Hapus seluruh data tidur?")) {
        const user = localStorage.getItem("somnioUser");
        // Menghapus database riwayat tidur lokal spesifik untuk user tersebut
        localStorage.removeItem(`sleepData_${user}`);
        alert("Data berhasil dihapus");
        // Memuat ulang halaman untuk memperbarui tampilan UI
        location.reload();
    }
}

/* =========================
   SIMPAN PENGINGAT
========================= */
function simpanReminder(event) {
    event.preventDefault();

    // Menyusun objek pengaturan waktu pengingat tidur
    const data = {
        sleepTime: document.getElementById("sleepTime").value
    };

    const user = localStorage.getItem("somnioUser");
    // Menyimpan target jam tidur dalam format teks string JSON ke LocalStorage
    localStorage.setItem(`reminder_${user}`, JSON.stringify(data));
    alert("Pengingat berhasil disimpan");
    location.reload();
}

/* =========================
   TAMPILKAN PENGINGAT
========================= */
function tampilkanReminder() {
    const user = localStorage.getItem("somnioUser");
    // Mengambil data preferensi waktu tidur user
    const reminder = JSON.parse(localStorage.getItem(`reminder_${user}`));
    const target = document.getElementById("savedReminder");

    // Jika komponen HTML tujuan tersedia dan data pengingat eksis, render ke layar
    if (target && reminder) {
        target.innerHTML = `
        <h5>Pengingat Aktif</h5>
        <p>Jam Tidur : <b>${reminder.sleepTime}</b></p>
        `;
    }
}

/* =========================
   HELPER: HITUNG SELISIH JAM TIDUR
========================= */
function hitungDurasi(jamTidur, jamBangun) {
    // Memisahkan format waktu string "HH:MM" menjadi angka jam dan menit murni
    const [hTidur, mTidur] = jamTidur.split(':').map(Number);
    const [hBangun, mBangun] = jamBangun.split(':').map(Number);

    // Mengonversi masing-masing komponen waktu menjadi satuan menit murni
    let menitTidur = hTidur * 60 + mTidur;
    let menitBangun = hBangun * 60 + mBangun;

    // Logika penanganan jika waktu bangun lebih kecil dari tidur (berarti melewati tengah malam)
    if (menitBangun < menitTidur) {
        menitBangun += 24 * 60; // Ditambah durasi 24 jam penuh agar hasilnya tidak negatif
    }

    // Menghitung selisih durasi bersih dalam menit
    const selisihMenit = menitBangun - menitTidur;
    // Mengonversi kembali hasil total menit bersih menjadi satuan Jam dan Sisa Menit
    const jam = Math.floor(selisihMenit / 60);
    const menit = selisihMenit % 60;

    // Mengembalikan objek ringkas berisi hasil kalkulasi waktu tidur
    return { jam, menit, totalMenit: selisihMenit };
}

/* =========================
   LOGIKA DINAMIS DASHBOARD & CHART
========================= */
let sleepChartInstance = null; // Variabel penampung objek instansiasi Chart.js agar bisa di-reset

function renderDashboardDinamis() {
    // Mengambil database array tidur lokal user aktif
    const data = ambilDataTidur();

    // Mapping seluruh elemen kartu informasi statistik di halaman dashboard
    const elDurasi = document.getElementById("dashDurasi");
    const elKualitas = document.getElementById("dashKualitas");
    const elTepatWaktu = document.getElementById("dashTepatWaktu");
    const elProduktivitas = document.getElementById("dashProduktivitas");
    
    const subDurasi = document.getElementById("subDurasi");
    const subKualitas = document.getElementById("subKualitas");
    const subProduktivitas = document.getElementById("subProduktivitas");
    
    const statMingguanText = document.getElementById("statMingguanText");
    const pencapaianText = document.getElementById("pencapaianText");
    const ctx = document.getElementById("sleepChart");

    // Skenario apabila pengguna belum memiliki data riwayat sama sekali
    if (data.length === 0) {
        if(elDurasi) elDurasi.innerText = "-";
        if(elKualitas) elKualitas.innerText = "-";
        if(elTepatWaktu) elTepatWaktu.innerText = "-";
        if(elProduktivitas) elProduktivitas.innerText = "-";
        
        if(subDurasi) subDurasi.innerText = "Belum ada data input";
        if(subKualitas) subKualitas.innerText = "-";
        if(subProduktivitas) subProduktivitas.innerText = "-";

        // Menggambar teks pemberitahuan kosong langsung di dalam kanvas grafik
        if (ctx) {
            const ctx2d = ctx.getContext('2d');
            ctx2d.clearRect(0, 0, ctx.width, ctx.height);
            ctx2d.font = "16px sans-serif";
            ctx2d.fillStyle = "#888888";
            ctx2d.textAlign = "center";
            ctx2d.fillText("Belum ada data grafik untuk ditampilkan", ctx.width / 2, ctx.height / 2);
        }
        return; // Menghentikan kelanjutan fungsi agar tidak terjadi error kalkulasi matematika
    }

    let totalMenit = 0;
    let totalKualitas = 0;

    // Menghitung akumulasi total menit dan kualitas dari seluruh record data tidur
    data.forEach(item => {
        const dur = hitungDurasi(item.jamTidur, item.jamBangun);
        totalMenit += dur.totalMenit;
        totalKualitas += Number(item.kualitas);
    });

    // Menghitung nilai rata-rata akumulatif berdasarkan total hari yang tercatat
    const rataMenit = totalMenit / data.length;
    const avgJam = Math.floor(rataMenit / 60);
    const avgMenit = Math.round(rataMenit % 60);
    const avgKualitas = Math.round(totalKualitas / data.length);

    // Menginjeksikan nilai rata-rata teks statistik ke elemen HTML masing-masing kartu dasbor
    if(elDurasi) elDurasi.innerText = `${avgJam}h ${avgMenit}m`;
    if(elKualitas) elKualitas.innerText = `${avgKualitas}%`;
    if(elTepatWaktu) elTepatWaktu.innerText = `${data.length} Hari`; 
    if(elProduktivitas) elProduktivitas.innerText = `${Math.min(avgKualitas - 5, 100)}%`; 

    if(subDurasi) subDurasi.innerText = "Rata-rata tidur";
    
    // Penentuan kategori teks deskripsi dan pewarnaan kelas CSS dinamis berdasarkan skor rata-rata kualitas
    if(subKualitas) {
        subKualitas.innerText = avgKualitas >= 85 ? "Baik" : (avgKualitas >= 70 ? "Cukup" : "Kurang");
        subKualitas.className = avgKualitas >= 85 ? "text-success mb-0" : "text-warning mb-0";
    }
    if(subProduktivitas) {
        subProduktivitas.innerText = avgKualitas >= 75 ? "Meningkat" : "Menurun";
        subProduktivitas.className = avgKualitas >= 75 ? "text-primary mb-0" : "text-danger mb-0";
    }

    if(statMingguanText) statMingguanText.innerText = `Rata-rata kualitas tidur Anda saat ini adalah ${avgKualitas}%.`;
    if(pencapaianText) pencapaianText.innerText = `🔥 Anda telah mencatat riwayat tidur selama ${data.length} hari teratur.`;

    // PROSES MERENDER GRAFIK CHART.JS
    if (ctx) {
        // Menyusun label baris sumbu X (Nama Hari)
        const labelsGrafik = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        // Menyiapkan nilai awal kosong (null) untuk data sumbu Y grafik
        const dataKualitasGrafik = [null, null, null, null, null, null, null];

        // Memetakan string kalender input pengguna ke penempatan hari yang tepat di grafik
        data.forEach(item => {
            const namaHariUrutan = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            // Mengganti karakter strip (-) menjadi garis miring (/) agar kompatibel dikonversi di semua browser
            const formatTanggalTepat = item.tanggal.replace(/-/g, "/");
            const d = new Date(formatTanggalTepat);
            
            // Validasi untuk memastikan string tanggal sukses diubah menjadi objek Date JavaScript yang valid
            if (!isNaN(d.getDay())) {
                const namaHariInput = namaHariUrutan[d.getDay()]; // Mendapatkan nama hari (contoh: "Selasa")
                const indexHari = labelsGrafik.indexOf(namaHariInput); // Mencari letak urutan index pada label grafik
                if (indexHari !== -1) {
                    dataKualitasGrafik[indexHari] = Number(item.kualitas); // Memasukkan skor kualitas ke sumbu Y grafik
                }
            }
        });

        // Pengaman: Jika objek grafik lama sudah aktif, hancurkan terlebih dahulu untuk mencegah glitch visual tumpang tindih
        if (sleepChartInstance) {
            sleepChartInstance.destroy(); 
        }

        // Melakukan instansiasi pembuatan grafik garis Chart.js baru
        sleepChartInstance = new Chart(ctx, {
            type: 'line', // Jenis diagram: Grafik Garis
            data: {
                labels: labelsGrafik, // Sumbu X
                datasets: [{
                    label: 'Kualitas Tidur (%)',
                    data: dataKualitasGrafik, // Sumbu Y
                    borderWidth: 3,
                    borderColor: '#0d6efd', // Warna garis utama (Biru)
                    backgroundColor: 'rgba(13, 110, 253, 0.1)', // Warna area transparan di bawah garis
                    tension: 0.4, // Membuat sudut garis melengkung dengan efek mulus (Bezier Curve)
                    fill: true, // Mengaktifkan background fill di bawah kurva garis
                    spanGaps: true // Menghubungkan titik garis secara otomatis jika ada hari yang kosong/null tanpa data
                }]
            },
            options: {
                responsive: true, // Membuat ukuran diagram otomatis menyesuaikan kontainer pembungkusnya
                scales: {
                    y: { min: 0, max: 100 } // Mengunci rentang penilaian kualitas tidur dari batas 0 hingga 100%
                }
            }
        });
    }
}

/* =========================
   JALANKAN OTOMATIS SAAT DOM SELESAI DI-LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
    tampilkanUser();          // Tampilkan nama profil di pojok antarmuka
    renderDashboardDinamis(); // Jalankan kalkulasi angka rata-rata sekaligus render grafik
    tampilkanReminder();       // Perbarui tampilan informasi status pengingat aktif

    // Menghubungkan form input pengisian data tidur dengan fungsi simpanDataTidur saat disubmit
    const formTidur = document.getElementById("sleepForm");
    if (formTidur) {
        formTidur.addEventListener("submit", simpanDataTidur);
    }

    // Mengambil setelan jam pengingat dari LocalStorage untuk disinkronkan ke widget mini dasbor
    const user = localStorage.getItem("somnioUser");
    const reminder = JSON.parse(localStorage.getItem(`reminder_${user}`));

    if (reminder) {
        const reminderElement = document.getElementById("dashboardReminderTime");
        if (reminderElement) {
            reminderElement.innerHTML = reminder.sleepTime;
        }
    }
});