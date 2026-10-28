# Konteks repo (untuk asisten AI)

- Video **"Dorongan Tak Terlihat" — Fluida Statis** (Fisika Umum, S1 Kimia UNESA) milik **Yayan** (Septian Anugrah Dwi Putra), seri Fisika Umum #2. Seri #1 = repo `video-fisika-energi` (mesin, komponen, dan alur kerja disalin dari sana). Aturan umum & pelajaran teknis: repo `septiananugrah-ship-it/science-intro` → `CLAUDE.md`.
- Seri berikutnya (repo terpisah): **Fluida Dinamis**, **Momentum**. Modul PDF ada di unggahan pengguna; angka yang dipakai dicek di `naskah/AUDIT.md`.
- Branding: **tanpa intro SCIENTIAN terpisah** (pengguna: cukup di judul pembuka) — judul menampilkan kapsul logo S + "Explore Science with Yayan"; outro SCIENTIAN + "Disusun oleh Septian Anugrah Dwi Putra" + "Berikutnya: Fluida Dinamis".
- Gaya seri **"Lab"** (malam biru tinta + kisi cetak biru, Space Grotesk/Inter/JetBrains Mono/Source Serif 4) dengan nuansa air: latar bergelembung, rumus fluida melayang. **Kode warna fluida**: air = `C.water`, tekanan p = merah muda `C.press`, gaya apung = hijau mint `C.buoy`, berat/gaya = kuning `C.force`, massa jenis ρ = ungu `C.spr`, tegangan permukaan γ = toska `C.cyan`; warna energi seri #1 (K jingga, Ug biru, panas merah, usaha hijau `C.work`) tetap berlaku bila energi dibahas.
- Komponen: `src/components/fluid.tsx` (Water bergelombang + kaustik, Tank, Bubbles, PressureArrow, WaterMolecule, DepthRuler), `physics.tsx` (Crate, Spring, EnergyBars, Plot, …), `primitives.tsx` (Stream, Ripple, Motes, Twinkles, Spark trail, Glow bernapas, Arrow berdenyut, Card berkilau, Formula).
- **Semua adegan harus terus bergerak** — panduan lengkap `naskah/POLISH.md`.
- **Claude tidak menjalankan workflow GitHub Actions.** Setelah merge ke `main`, berhenti dan minta pengguna menekan *Run workflow* sendiri; beri link & isian.
- Narasi: menyusul (ElevenLabs suara klon, atau Edge TTS gratis lewat input `mesin`). Selalu sediakan versi tanpa narasi.

## Aturan konten & tata letak

- Rumus utama ≥ 56 px (`Formula`), satu kartu per momen; zona subtitle (bawah 180 px) selalu bebas; margin ≥ 80 px. Komponen HTML di luar `<Stage>`.
- g = 10 m/s², ρ air = 1000 kg/m³, p_atm = 100 kPa seperti modul (kecuali disebut lain). "≈" untuk perkiraan. Koma desimal.
- Teks TTS terpisah dari subtitle (`src/tts.ts`, `tts:` per baris di `src/script.ts`).
- Kemulusan: `EASE` lembut, fade keluar `EASE_IN_OUT`; tanpa ganti berdasarkan ambang (silang-pudar); tanpa CSS blur; tanpa filter pada garis lurus.

## QA

- `CHROME_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell node scripts/qa-moments.mjs out/x adegan:baris:offset ...` lalu `python3 scripts/contact.py out/x out/x-sheets 6`.
- `scripts/qa-lines.mjs` = still di akhir setiap baris narasi (audit menyeluruh).
