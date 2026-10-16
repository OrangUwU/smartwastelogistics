# 🚛 Smart Waste Logistics & DLH Dispatcher: Inovasi Logistik Sampah Adaptif Banyuwangi ♻️

Dokumentasi lengkap sistem, arsitektur, fitur teknis, serta konsep inovasi sosio-teknis **"Smart Routing & Micro-Hub"** untuk bahan *brainstorming*, penyusunan esai akademik, dan pengembangan prototipe sistem cerdas.

---

## 🌟 1. Ringkasan Konsep & Latar Belakang Masalah

* **Judul Inovasi**: *Smart Routing & Micro-Hub: Solusi Logistik Sampah Adaptif Kawasan Residensial & Wisata Banyuwangi*
* **Tagline**: *"Satu Klaster, Tiga Rumah: Pilah Bersama, Jemput Cepat Tanpa Sisa!"*
* **Target Pengguna**: Petugas & Operator Dinas Lingkungan Hidup (DLH), Warga Klaster Perumahan, dan Pelaku Usaha Wisata/Kuliner.
* **Wilayah Studi**: Kawasan Pemukiman & Sentra Wisata Kuliner Kabupaten Banyuwangi (Kampung Bethek, De Djawatan Station, Klaster Mawar, Klaster Melati).

### 🚨 Masalah Pengelolaan Sampah Konvensional (Static Scheduling Fallacy)
1. **Rute Statis yang Kaku**: Truk dinas berkeliling mengikuti jadwal tetap (misal: 2-3 hari sekali) tanpa mengetahui volume nyata tempat sampah.
2. **Pemborosan Biaya Operasional (BBM & Jam Kerja)**: Truk mendatangi titik yang masih kosong (*empty trip*), menghamburkan bahan bakar dan emisi karbon sia-sia.
3. **Keterlambatan Penjemputan di Titik Wisata**: Terjadi lonjakan timbulan sampah ekstrem pada akhir pekan (*weekend tourism peak*), menyebabkan kontainer meluap, bau busuk, dan mencoreng estetika kota.
4. **Kendala Aksesibilitas**: Truk besar tidak dapat bermanuver di gang sempit pemukiman dan kawasan wisata.

---

## 💡 2. Kebaruan & Inovasi Sosio-Teknis (Novelty)

1. **Human-as-a-Sensor (Biaya Hardware Rp 0)**:
   * Mengeliminasi sensor IoT fisik (ultrasonik/beban) yang mahal, butuh ganti baterai, dan rentan vandalisme.
   * Warga atau pemilik warung kuliner bertindak sebagai "sensor manusia" yang mengirim sinyal status kepenuhan hanya dengan pesan teks singkat via **WhatsApp Bot** (contoh: `"PENUH 1"`).
2. **Strategi Micro-Hub & Konsolidasi "Satu Klaster, Tiga Rumah"**:
   * Titik penjemputan dikonsolidasi: tiga rumah tetangga menggunakan satu tempat sampah komunal terpilah (Organik & Anorganik) berstiker QR Code di jalan utama klaster.
   * Truk DLH hanya berhenti di titik *Micro-Hub*, menghemat waktu manuver hingga 40%.
3. **Dynamic Fleet Routing (Mapbox GL Engine)**:
   * Peta komando DLH hanya memetakan rute penjemputan untuk titik yang berstatus **PENUH (Lampu Merah Berkedip)**. Titik yang masih aman (Hijau) dilewati (*skip*).
4. **Gamifikasi Diskon Retribusi Sampah**:
   * Setiap pelaporan valid dan pemilahan yang konsisten memberikan **+10 Poin Reward**.
   * Poin diakumulasi di akhir bulan untuk **potongan langsung iuran retribusi sampah warga**, menciptakan model insentif gotong royong yang berkelanjutan.

---

## 🏗️ 3. Arsitektur & Teknologi yang Digunakan

* **Backend & API Engine**: Node.js & Express.js.
* **Basis Data Relasional**: SQLite3 (`waste_logistics.db`) mencatat data geolokasi, status kontainer (`FULL` / `EMPTY`), dan akumulasi poin retribusi.
* **Komunikasi Asinkron Real-Time**: Socket.io (WebSocket) mentransmisikan perubahan status dalam hitungan milidetik (< 100 ms) tanpa reload browser.
* **Geospasial & Pemetaan Visual**: Mapbox GL JS v3 (Dark Vector Mode, Top-Down 2D Projection, Dynamic GeoJSON Route Lines, Animated Pulse Beacons).
* **Integrasi Gateway Pesan**: RESTful Webhook Receiver (`POST /webhook/whatsapp`) yang kompatibel dengan format pesan teks langsung, Twilio WhatsApp API, maupun Meta WhatsApp Cloud API.
* **Design Intelligence (UI/UX)**: Mengadopsi prinsip `ui-ux-pro-max` (Bento Grid Metrics, Dark Glassmorphism, Monospace Telemetry, Accessible Color Codes).

---

## 🚀 4. Alur Kerja Sistem (End-to-End Workflow)

```
[ Warga / Pemilik Warung ] 
            │
            │ Ketik pesan: "PENUH 1" via WhatsApp
            ▼
[ WhatsApp Webhook Receiver ] ──> POST /webhook/whatsapp
            │
            ▼
[ Node.js Backend Server ]
    ├── 1. Regex Matcher: Mendeteksi ID Klaster (Hub ID)
    ├── 2. SQLite Ledger: Update status -> 'FULL' & Tambah +10 Reward Poin
    └── 3. Socket.io Event: Broadcast event 'route_update'
            │
            ▼ (Push Real-Time < 100ms)
[ DLH Command Center Dashboard ]
    ├── Marker node di peta Mapbox berubah MERAH BERKEDIP (Pulsing Beacon)
    ├── Garis rute dinamis biru cyan otomatis mengaitkan node penuh
    ├── Metrik operasional Bento Grid ter-update seketika
    └── Kamera peta fokus mengarahkan operator armada
            │
            ▼
[ Truk DLH Diberangkatkan ]
    Petugas hanya melayani titik merah, kemudian klik "Selesai Jemput" (Status -> EMPTY).
```

---

## 📡 5. Spesifikasi API & Webhook Endpoints

### 1. Ambil Semua Data Hub Logistik
* **Endpoint**: `GET /api/hubs`
* **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "Klaster 1 - Mawar (3 Rumah Komunal)",
        "latitude": -8.2165,
        "longitude": 114.3645,
        "status": "FULL",
        "points": 50
      }
    ]
  }
  ```

### 2. Webhook Penerima Pesan WhatsApp
* **Endpoint**: `POST /webhook/whatsapp`
* **Headers**: `Content-Type: application/json`
* **Payload yang Didukung**:
  * Format Teks Langsung: `{"message": "PENUH 1"}`
  * Format Twilio WhatsApp: `{"Body": "PENUH 1"}`
  * Format Meta Cloud API: `{"entry":[{"changes":[{"value":{"messages":[{"text":{"body":"PENUH 1"}}]}}]}]}`
* **Perintah Cepat**:
  * `"PENUH <ID>"` $\rightarrow$ Mengubah status menjadi `FULL` dan menambah `+10 poin`.
  * `"KOSONG <ID>"` $\rightarrow$ Mereset status kembali ke `EMPTY`.

### 3. Endpoint Konfirmasi Selesai Jemput
* **Endpoint**: `POST /api/hubs/:id/reset`
* **Fungsi**: Digunakan oleh petugas DLH di dashboard untuk mengosongkan kontainer setelah armada selesai melakukan pengangkutan.

---

## 🎨 6. Daftar Aset Visual & Materi Infografis (Folder `poster_assets/`)

Seluruh aset gambar beresolusi tinggi tersimpan di direktori `poster_assets/` dan siap dipindahkan ke Canva/Photoshop:

1. **`iso_elem1_siswa_revised.jpg`**: Karakter 3D Siswa SMA Indonesia dengan seragam OSIS memegang ponsel pintar berhologram WhatsApp: *"PENUH 1 - Klaster Mawar siap dijemput!"*.
2. **`iso_elem2_klaster_revised.jpg`**: Pulau tanah melayang dengan 3 rumah perumahan tropis dan tempat sampah terpilah komunal (Hijau & Kuning berstiker QR Code) tepat di tengah.
3. **`iso_map_routing_standalone.jpg`**: Peta ubin isometrik bersih bergaya Google Maps dengan hologram status `PENUH !` (Merah) dan `EMPTY ✔` (Hijau).
4. **`iso_truk_sampah_standalone.jpg`**: Truk sampah ramah lingkungan DLH modern terpisah (*pure white background*).
5. **`iso_elem4_biocomposter.jpg`**: Kotak bio-komposter Maggot BSF modern yang memancarkan partikel energi hijau dan tunas daun.
6. **`iso_elem5_koin_digital.jpg`**: Koin emas digital dan token hijau lambang poin retribusi warga.
7. **`iso_elem6_dashboard_floating.jpg`**: Mockup 3D antarmuka dashboard glassmorphism melayang untuk presentasi poster.
8. **`clean_poster_illustration.jpg`**: Background ilustrasi utuh bersih dengan ruang kosong (*negative space*) untuk teks poster A4.

---

## 🏃 7. Cara Menjalankan Aplikasi Secara Lokal

1. **Instalasi Dependensi**:
   ```bash
   npm install
   ```
2. **Jalankan Server**:
   ```bash
   npm start
   ```
3. **Akses Dashboard**:
   Buka peramban di **[http://localhost:3000](http://localhost:3000)**.
   * Gunakan panel samping (*sidebar*) untuk mensimulasikan pesan WhatsApp atau memantau rute dinamis secara langsung.

---

## 📈 8. Dampak Terukur untuk Analisis Esai (Triple Bottom Line)

* **🌱 Lingkungan (*Environmental*)**: Mengeliminasi kebocoran sampah ke ekosistem (*zero waste leakage*) dan memangkas jejak karbon armada DLH hingga 30%.
* **💰 Ekonomi (*Economic*)**: Meringankan biaya retribusi bulanan warga melalui skema poin dan menghemat anggaran belanja BBM dinas kebersihan.
* **⚙️ Operasional (*Logistics Engineering*)**: Mengeliminasi *empty trip*, mengoptimalkan rute penjemputan armada, dan meningkatkan rasio tonase sampah per kilometer tempuh.
