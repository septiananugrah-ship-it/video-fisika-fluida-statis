# Dorongan Tak Terlihat — Fluida Statis (Fisika Umum)

Video edukasi **≈ 21 menit** (2K, 30 FPS) · **SCIENTIAN — Explore Science with Yayan** · disusun oleh **Septian Anugrah Dwi Putra**. Seri Fisika Umum #2 (sebelumnya: Usaha & Energi; berikutnya: Fluida Dinamis, Momentum). Dibuat dengan [Remotion](https://remotion.dev).

Gaya visual seri **"Lab"** bernuansa air: latar biru tinta bergelembung, air bergelombang dengan pantulan cahaya, dan kode warna tetap (tekanan merah muda · gaya apung hijau mint · berat kuning · air biru · ρ ungu · γ toska). Tanpa intro terpisah: judul pembuka memuat logo S + "Explore Science with Yayan".

## Isi

| Bagian | Bab |
|---|---|
| Pembuka | Kapal baja mengapung, baut baja tenggelam · judul · peta video |
| 1 · Konsep & cara berpikir | 01 Massa jenis · 02 Tekanan (paku) · 03 Hidrostatika p = p₀ + ρgh · 04 Lautan udara, tekanan mutlak & ukur · 05 Bejana berhubungan & manometer · 06 Hukum Pascal · 07 Archimedes · 08 Berat semu · 09 Terapung, melayang, tenggelam · 10 Tegangan permukaan · 11 Kapilaritas · 12 Cara berpikir soal fluida |
| 2 · Fluida di laboratorium kimia | 13 Hidrometer & corong pisah · 14 Sabun & ikatan hidrogen · 15 Kapilaritas dalam kromatografi |
| 3 · Penerapan | 16 Kapal selam & laut dalam · 17 Tekanan darah & barometer · 18 Gunung es |
| Penutup | 19 Rangkuman · rujukan |

Daftar bab bertimecode ada di `naskah/BAB_YOUTUBE.txt`, naskah teleprompter di `naskah/NASKAH_VOICEOVER.md` (cocok juga untuk merekam suara sendiri), audit angka di `naskah/AUDIT.md`.

## Render (tombol ditekan sendiri, tab **Actions**)

- **Belum ada suara?** Jalankan **Render Fluida Statis 2K 30FPS → Run workflow** dengan isian bawaan → versi musik + subtitle (`fluida-statis-tanpa-narasi-2k-30fps`).
- **Dengan narasi:** **Buat voice-over + render 2K → Run workflow**, pilih `mesin`:
  - `elevenlabs` — suara klon. Isi secret `ELEVENLABS_API_KEY` dan `ELEVENLABS_VOICE_ID` (Settings → Secrets and variables → Actions), atau isi voice ID di form. ±19 ribu karakter untuk seluruh naskah (muat dalam kuota Starter 30 ribu/bulan).
  - `edge` — gratis, tanpa kunci (suara Microsoft `id-ID-ArdiNeural` laki-laki / `id-ID-GadisNeural` perempuan).
  Workflow membuat suara per baris, menyesuaikan timeline/subtitle/musik dengan durasi suara asli, menyimpannya ke repo, lalu merender versi **dengan narasi** dan **tanpa narasi**.
- Setelah suara jadi, disarankan **Cek pengucapan narasi (Whisper)**.
- Unduh artefak di halaman run (iPad: tekan lama nama artefak → *Unduh Tautan Tertaut*).

Baris yang teksnya diubah: hapus `public/voiceover/<kode>.mp3` agar dibuat ulang (workflow hanya membuat baris yang belum ada). Rekaman suara sendiri: simpan per baris dengan kode di `naskah/NASKAH_VOICEOVER.md`, lalu `npm run voiceover -- --measure`.

## Menjalankan sendiri

```bash
npm ci
npm run dev                # Remotion Studio: "FluidaStatis", "FluidaStatis2K", atau folder "Adegan"
npm run timeline           # perbarui naskah VO, SRT, BAB_YOUTUBE, peta musik
npm run music              # sintesis ulang musik (python3 + numpy + ffmpeg)
npm run lint               # cek tipe TypeScript
```

## Struktur

```
src/script.ts           naskah per adegan (teks, kata kunci, jeda, ejaan TTS opsional)
src/tts.ts              teks ramah-TTS (ejaan huruf & simbol)
src/timeline.ts         waktu baris & kata (estimasi suku kata, atau durasi rekaman asli)
src/components/         latar cetak biru, subtitle, heading bab, primitif rumus, komponen fisika (batang energi, pegas, balok, grafik) + fluida (air bergelombang, tangki, panah tekanan, gelembung)
src/scenes/             23 adegan
scripts/                voice-over (ElevenLabs/Edge), musik orisinal (numpy), cek pengucapan, render potongan & gabung, QA still
```
