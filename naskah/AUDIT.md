# Audit angka & konvensi — Dorongan Tak Terlihat (Fluida Statis)

Konvensi modul: g = 10 m/s², ρ air = 1000 kg/m³, p_atm = 100 000 Pa (kecuali disebut lain). Mengubah angka = rekam ulang baris.

| Adegan | Angka di narasi | Cek |
|---|---|---|
| density | minyak goreng ≈ 920, besi ≈ 7874 ("hampir 8000"), raksa ≈ 13 534 ("≈ 13 500") kg/m³ | CRC Handbook ✓ |
| pressure | 20 N pada 1 cm² → 2×10⁵ Pa; pada 0,5 mm² → 4×10⁷ Pa (200×) | 20/1e-4, 20/5e-7 ✓ |
| hydro | akuarium 0,60 m → 6000 Pa; A = 0,20 m² → 1200 N (≈ 120 kg) | Modul Contoh 3 ✓ |
| atmosphere | p_atm ≈ 100 kPa ≈ 10 ton/m²; ban 2,2 bar ukur → ≈ 3,2 bar mutlak; tiap 10 m air +≈100 kPa | 1 bar = 100 kPa; ρgh = 1000·10·10 ✓ |
| manometer | ρ = 800, Δh = 0,25 m → 2000 Pa; minyak 20 cm vs air 16 cm → 800 kg/m³ | Modul Contoh 5 & 6 ✓ |
| pascal | A₁ = 5 cm², A₂ = 200 cm² (40×), 400 kg → F₁ = 100 N; s₂ = 2 cm → s₁ = 80 cm | Modul Contoh 7 ✓ |
| apparent | Al 1 kg, ρ = 2700 → V = 3,70×10⁻⁴ m³, F_A = 3,70 N, berat semu 6,30 N | Modul Contoh 8 ✓ |
| floating | kayu ρ = 600, H = 20 cm → 12 cm tercelup, 8 cm di atas; rakit 0,50 m³, 200 kg → muatan maks 300 kg | Modul Contoh 9 & 10 ✓ |
| surface | γ air (20–25 °C) ≈ 0,072 N/m; film dua sisi F = 2γL | CRC (72,8 mN/m pada 20 °C) ✓ |
| capillary | r = 0,5 mm, θ ≈ 0 → h = 2(0,072)/(1000·10·0,0005) ≈ 2,9 cm ("hampir 3 cm"); raksa θ > 90° turun | ✓ |
| strategy | ρ_b = 900 di antara minyak 800 & air 1000 → f = 0,50 | Modul Contoh 11 ✓ |
| submarine | 100 m air laut: ρgh ≈ 1025·9,8·100 ≈ 1,0 MPa (≈ 1 juta N/m²), mutlak ≈ 1,1 MPa ≈ 11 atm; Challenger Deep ≈ 10 900 m → ≈ 1,1×10⁸ Pa > 1000 atm | NOAA ✓ |
| blood | 760 mmHg: 13 600·9,8·0,76 ≈ 101 kPa; air → 10,3 m; 120 mmHg ≈ 16,0 kPa ≈ kolom air 1,6 m | ✓ |
| iceberg | ρ es ≈ 917, air laut ≈ 1025 → 917/1025 ≈ 0,89 (89 % tercelup, 11 % terlihat); Titanic 1912 | ✓ |

## Konvensi
- Kedalaman h selalu vertikal; tekanan ukur vs mutlak dinyatakan jelas.
- Kode warna: tekanan merah muda, gaya apung hijau mint, berat/gaya kuning, air biru, ρ ungu, γ toska.
