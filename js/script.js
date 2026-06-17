/* =========================
   LOGIN
========================= */
function loginUser(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "" || password === "") {
        alert("Lengkapi data login");
        return;
    }

    localStorage.setItem("somnioUser", username);
    localStorage.setItem("somnioPassword", password);

    window.location.href = "dashboard.html";
}

/* =========================
   LOGOUT
========================= */
function logout() {
    localStorage.removeItem("somnioUser");
    window.location.href = "login.html";
}

/* =========================
   TAMPILKAN USER
========================= */
function tampilkanUser() {
    const nama = localStorage.getItem("somnioUser");
    const element = document.getElementById("namaUser");
    if (element) {
        element.innerHTML = nama || "Pengguna";
    }
}

/* =========================
   SIMPAN DATA TIDUR (DARI FORM)
========================= */
function simpanDataTidur(event) {
    event.preventDefault();

    const kualitasValue = document.getElementById("kualitas").value;

    if (!kualitasValue || kualitasValue === "") {
        alert("Silakan isi Jam Mulai Tidur dan Jam Bangun terlebih dahulu agar kualitas terhitung!");
        return;
    }

    const data = {
        tanggal: document.getElementById("tanggal").value,
        jamTidur: document.getElementById("jamTidur").value,
        jamBangun: document.getElementById("jamBangun").value,
        kualitas: kualitasValue,
        catatan: document.getElementById("catatan").value
    };

    const user = localStorage.getItem("somnioUser");

    let riwayat = JSON.parse(localStorage.getItem(`sleepData_${user}`)) || [];
    riwayat.push(data);

    localStorage.setItem(`sleepData_${user}`, JSON.stringify(riwayat));
    alert("Data berhasil disimpan");

    window.location.href = "history.html";
}

/* =========================
   AMBIL DATA TIDUR
========================= */
function ambilDataTidur() {
    const user = localStorage.getItem("somnioUser");
    return JSON.parse(localStorage.getItem(`sleepData_${user}`)) || [];
}

/* =========================
   RESET DATA
========================= */
function resetDataTidur() {
    if (confirm("Hapus seluruh data tidur?")) {
        const user = localStorage.getItem("somnioUser");
        localStorage.removeItem(`sleepData_${user}`);
        alert("Data berhasil dihapus");
        location.reload();
    }
}

/* =========================
   SIMPAN PENGINGAT
========================= */
function simpanReminder(event) {
    event.preventDefault();

    const data = {
        sleepTime: document.getElementById("sleepTime").value
    };

    const user = localStorage.getItem("somnioUser");
    localStorage.setItem(`reminder_${user}`, JSON.stringify(data));
    alert("Pengingat berhasil disimpan");
    location.reload();
}

/* =========================
   TAMPILKAN PENGINGAT
========================= */
function tampilkanReminder() {
    const user = localStorage.getItem("somnioUser");
    const reminder = JSON.parse(localStorage.getItem(`reminder_${user}`));
    const target = document.getElementById("savedReminder");

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
    const [hTidur, mTidur] = jamTidur.split(':').map(Number);
    const [hBangun, mBangun] = jamBangun.split(':').map(Number);

    let menitTidur = hTidur * 60 + mTidur;
    let menitBangun = hBangun * 60 + mBangun;

    if (menitBangun < menitTidur) {
        menitBangun += 24 * 60; // Lewat tengah malam
    }

    const selisihMenit = menitBangun - menitTidur;
    const jam = Math.floor(selisihMenit / 60);
    const menit = selisihMenit % 60;

    return { jam, menit, totalMenit: selisihMenit };
}

/* =========================
   LOGIKA DINAMIS DASHBOARD & CHART
========================= */
let sleepChartInstance = null;

function renderDashboardDinamis() {
    const data = ambilDataTidur();

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

    if (data.length === 0) {
        if(elDurasi) elDurasi.innerText = "-";
        if(elKualitas) elKualitas.innerText = "-";
        if(elTepatWaktu) elTepatWaktu.innerText = "-";
        if(elProduktivitas) elProduktivitas.innerText = "-";
        
        if(subDurasi) subDurasi.innerText = "Belum ada data input";
        if(subKualitas) subKualitas.innerText = "-";
        if(subProduktivitas) subProduktivitas.innerText = "-";

        if (ctx) {
            const ctx2d = ctx.getContext('2d');
            ctx2d.clearRect(0, 0, ctx.width, ctx.height);
            ctx2d.font = "16px sans-serif";
            ctx2d.fillStyle = "#888888";
            ctx2d.textAlign = "center";
            ctx2d.fillText("Belum ada data grafik untuk ditampilkan", ctx.width / 2, ctx.height / 2);
        }
        return; 
    }

    let totalMenit = 0;
    let totalKualitas = 0;

    data.forEach(item => {
        const dur = hitungDurasi(item.jamTidur, item.jamBangun);
        totalMenit += dur.totalMenit;
        totalKualitas += Number(item.kualitas);
    });

    const rataMenit = totalMenit / data.length;
    const avgJam = Math.floor(rataMenit / 60);
    const avgMenit = Math.round(rataMenit % 60);
    const avgKualitas = Math.round(totalKualitas / data.length);

    if(elDurasi) elDurasi.innerText = `${avgJam}h ${avgMenit}m`;
    if(elKualitas) elKualitas.innerText = `${avgKualitas}%`;
    if(elTepatWaktu) elTepatWaktu.innerText = `${data.length} Hari`; 
    if(elProduktivitas) elProduktivitas.innerText = `${Math.min(avgKualitas - 5, 100)}%`; 

    if(subDurasi) subDurasi.innerText = "Rata-rata tidur";
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

    if (ctx) {
        const labelsGrafik = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        const dataKualitasGrafik = [null, null, null, null, null, null, null];

        data.forEach(item => {
            const namaHariUrutan = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const formatTanggalTepat = item.tanggal.replace(/-/g, "/");
            const d = new Date(formatTanggalTepat);
            
            if (!isNaN(d.getDay())) {
                const namaHariInput = namaHariUrutan[d.getDay()];
                const indexHari = labelsGrafik.indexOf(namaHariInput);
                if (indexHari !== -1) {
                    dataKualitasGrafik[indexHari] = Number(item.kualitas);
                }
            }
        });

        if (sleepChartInstance) {
            sleepChartInstance.destroy(); 
        }

        sleepChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelsGrafik,
                datasets: [{
                    label: 'Kualitas Tidur (%)',
                    data: dataKualitasGrafik,
                    borderWidth: 3,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true,
                    spanGaps: true 
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { min: 0, max: 100 }
                }
            }
        });
    }
}

/* =========================
   JALANKAN OTOMATIS SAAT DOM SELESAI DI-LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
    tampilkanUser();
    renderDashboardDinamis();
    tampilkanReminder();

    const formTidur = document.getElementById("sleepForm");
    if (formTidur) {
        formTidur.addEventListener("submit", simpanDataTidur);
    }

    const user = localStorage.getItem("somnioUser");
    const reminder = JSON.parse(localStorage.getItem(`reminder_${user}`));

    if (reminder) {
        const reminderElement = document.getElementById("dashboardReminderTime");
        if (reminderElement) {
            reminderElement.innerHTML = reminder.sleepTime;
        }
    }
});