// Naskah narasi "Dorongan Tak Terlihat" — Fisika Umum: Fluida Statis.
// Setiap adegan berisi baris narasi. Durasi baris dihitung otomatis dari jumlah
// suku kata (lihat timeline.ts) atau dari rekaman suara bila sudah ada,
// jadi cukup ubah teks di sini: visual, subtitle, dan musik ikut menyesuaikan.
//
// Aturan menulis teks narasi (dibaca mesin TTS):
//  - angka & simbol ditulis sebagai kata ("dua puluh meter per detik"),
//  - rumus ditulis sebagai kalimat; rumus rapi tampil di layar (komponen Formula).
// Angka sudah dicek di naskah/AUDIT.md (g = 10 m/s², ρ air = 1000 kg/m³, p_atm = 100 kPa seperti modul, kecuali disebut lain).
//
// hl     : kata/frasa yang disorot pada subtitle
// pause  : jeda (detik) SETELAH baris dibacakan
// lead   : jeda (detik) sebelum baris pertama adegan
// tail   : jeda (detik) setelah baris terakhir adegan
// fixed  : durasi tetap (detik) untuk adegan tanpa narasi

export type Line = {
  text: string;
  /** Teks khusus TTS (opsional). Bila kosong, dibuat otomatis oleh src/tts.ts. */
  tts?: string;
  hl?: string[];
  pause?: number;
};

export type SceneScript = {
  id: string;
  chapter: string; // nomor bab di heading, "" untuk tanpa heading
  part?: 1 | 2 | 3; // 1 konsep & cara berpikir, 2 fluida di laboratorium kimia, 3 penerapan
  title: string;
  lines: Line[];
  lead?: number;
  tail?: number;
  fixed?: number;
  mood: 'mystery' | 'title' | 'wonder' | 'build' | 'tension' | 'bright' | 'resolve' | 'outro';
};

export const SCRIPT: SceneScript[] = [
  {
    "id": "hook",
    "chapter": "",
    "title": "Kapal baja dan baut baja",
    "mood": "mystery",
    "lead": 1.6,
    "tail": 1.2,
    "lines": [
      {
        "text": "Sebuah kapal kargo dari baja, beratnya puluhan ribu ton, mengapung dengan tenang di laut.",
        "hl": [
          "kapal kargo"
        ],
        "pause": 0.7
      },
      {
        "text": "Di sampingnya, sebuah baut baja kecil dijatuhkan ke air. Baut itu langsung tenggelam.",
        "hl": [
          "langsung tenggelam"
        ],
        "pause": 0.8
      },
      {
        "text": "Bahannya sama-sama baja. Lalu mengapa yang raksasa justru mengapung?",
        "hl": [
          "mengapung"
        ],
        "pause": 0.9
      },
      {
        "text": "Ada teka-teki lain: dinding bendungan selalu dibuat jauh lebih tebal di bagian bawah.",
        "hl": [
          "lebih tebal di bagian bawah"
        ],
        "pause": 0.7
      },
      {
        "text": "Dan seorang penyelam yang turun sepuluh meter saja sudah merasakan telinganya tertekan.",
        "hl": [
          "sepuluh meter"
        ],
        "pause": 0.8
      },
      {
        "text": "Ketiganya dijawab oleh satu hal yang tidak terlihat, tetapi terus mendorong dari segala arah: tekanan fluida.",
        "hl": [
          "tekanan fluida"
        ],
        "pause": 0.9
      },
      {
        "text": "Di video ini, kita akan belajar membaca dorongan tak terlihat itu, dari secangkir air sampai dasar samudra.",
        "hl": [
          "dorongan tak terlihat"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "title",
    "chapter": "",
    "title": "Dorongan Tak Terlihat",
    "mood": "title",
    "fixed": 8,
    "lines": []
  },
  {
    "id": "roadmap",
    "chapter": "",
    "title": "Peta video",
    "mood": "wonder",
    "lead": 0.8,
    "tail": 1.4,
    "lines": [
      {
        "text": "Video ini membahas fluida statis, yaitu zat cair dan gas yang sedang diam, dalam tiga bagian.",
        "hl": [
          "fluida statis"
        ],
        "pause": 0.6
      },
      {
        "text": "Bagian pertama, konsep dan cara berpikirnya: massa jenis, tekanan, hidrostatika, Pascal, Archimedes, tegangan permukaan, dan kapilaritas.",
        "hl": [
          "konsep dan cara berpikirnya"
        ],
        "pause": 0.5
      },
      {
        "text": "Bagian kedua, fluida statis di laboratorium kimia: hidrometer, sabun, dan kromatografi.",
        "hl": [
          "laboratorium kimia"
        ],
        "pause": 0.5
      },
      {
        "text": "Bagian ketiga, penerapannya: kapal selam, tekanan darah, dan gunung es.",
        "hl": [
          "penerapannya"
        ],
        "pause": 0.7
      }
    ]
  },
  {
    "id": "density",
    "chapter": "01",
    "title": "Massa jenis: seberapa padat",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Mari mulai dari pertanyaan sederhana: mana yang lebih berat, satu kilogram besi atau satu kilogram kapas?",
        "hl": [
          "satu kilogram besi atau satu kilogram kapas"
        ],
        "pause": 0.8
      },
      {
        "text": "Tentu sama beratnya. Bedanya ada pada seberapa padat massa itu dikemas.",
        "hl": [
          "seberapa padat"
        ],
        "pause": 0.6
      },
      {
        "text": "Besaran ini disebut massa jenis, rho: massa dibagi volume.",
        "hl": [
          "massa jenis"
        ],
        "pause": 0.6
      },
      {
        "text": "Air bermassa jenis seribu kilogram per meter kubik. Artinya, satu liter air bermassa satu kilogram.",
        "hl": [
          "seribu kilogram per meter kubik"
        ],
        "pause": 0.6
      },
      {
        "text": "Minyak goreng sekitar sembilan ratus dua puluh, besi hampir delapan ribu, dan raksa sekitar tiga belas ribu lima ratus.",
        "hl": [
          "raksa"
        ],
        "pause": 0.6
      },
      {
        "text": "Tuang beberapa cairan ke dalam satu gelas, dan mereka menyusun diri: yang massa jenisnya paling kecil berada paling atas.",
        "hl": [
          "menyusun diri"
        ],
        "pause": 0.7
      },
      {
        "text": "Massa jenis inilah kunci pertama untuk menjawab teka-teki kapal tadi.",
        "hl": [
          "kunci pertama"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "pressure",
    "chapter": "02",
    "title": "Tekanan: gaya dibagi luas",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Tekan sebuah paku dengan jempol. Ujung paku yang runcing menancap ke kayu, tetapi kepala paku tidak melukai jempolmu.",
        "hl": [
          "ujung paku"
        ],
        "pause": 0.7
      },
      {
        "text": "Gayanya sama besar di kedua ujung. Yang berbeda adalah luas tempat gaya itu tersebar.",
        "hl": [
          "luas"
        ],
        "pause": 0.6
      },
      {
        "text": "Inilah tekanan: gaya tegak lurus dibagi luas. Satuannya pascal, yaitu newton per meter persegi.",
        "hl": [
          "gaya tegak lurus dibagi luas"
        ],
        "pause": 0.7
      },
      {
        "text": "Dengan gaya dua puluh newton, kepala paku seluas satu sentimeter persegi menerima dua ratus ribu pascal.",
        "hl": [
          "dua ratus ribu pascal"
        ],
        "pause": 0.6
      },
      {
        "text": "Ujung paku seluas setengah milimeter persegi menerima empat puluh juta pascal, dua ratus kali lebih besar.",
        "hl": [
          "empat puluh juta pascal"
        ],
        "pause": 0.7
      },
      {
        "text": "Di dalam fluida, tekanan punya sifat istimewa: ia mendorong ke segala arah, dan selalu tegak lurus permukaan yang disentuhnya.",
        "hl": [
          "ke segala arah"
        ],
        "pause": 0.7
      },
      {
        "text": "Bayangkan triliunan molekul yang terus menabrak dinding. Setiap tabrakan adalah dorongan kecil, dan jumlah seluruh dorongan per satuan luas itulah tekanan.",
        "hl": [
          "tabrakan"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "hydro",
    "chapter": "03",
    "title": "Hidrostatika: makin dalam, makin menekan",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sekarang ambil sebuah kolom air setinggi h di dalam kolam yang tenang.",
        "hl": [
          "kolom air"
        ],
        "pause": 0.5
      },
      {
        "text": "Kolom ini diam, jadi gaya-gayanya seimbang: tekanan dari bawah harus menahan tekanan dari atas, ditambah berat air di dalam kolom.",
        "hl": [
          "seimbang"
        ],
        "pause": 0.7
      },
      {
        "text": "Berat air itu sama dengan rho kali luas kali h kali g. Bagi dengan luas, dan kita dapat rumus terpenting fluida statis.",
        "hl": [
          "rumus terpenting"
        ],
        "pause": 0.6
      },
      {
        "text": "Tekanan di kedalaman h sama dengan tekanan di permukaan, ditambah rho g h.",
        "hl": [
          "rho g h"
        ],
        "pause": 0.8
      },
      {
        "text": "Makin dalam, makin banyak air di atas kita yang harus ditopang. Itulah sebabnya dinding bendungan dibuat lebih tebal di bagian bawah.",
        "hl": [
          "lebih tebal di bagian bawah"
        ],
        "pause": 0.7
      },
      {
        "text": "Contoh: akuarium sedalam enam puluh sentimeter. Tekanan air di dasarnya enam ribu pascal di atas tekanan udara.",
        "hl": [
          "enam ribu pascal"
        ],
        "pause": 0.6
      },
      {
        "text": "Dengan luas dasar nol koma dua meter persegi, air menekan dasar dengan gaya seribu dua ratus newton, setara beban seratus dua puluh kilogram.",
        "hl": [
          "seribu dua ratus newton"
        ],
        "pause": 0.7
      },
      {
        "text": "Yang mengejutkan: bentuk wadah tidak berpengaruh. Pada kedalaman yang sama, tekanan di dasar gelas ramping sama dengan di dasar baskom lebar.",
        "hl": [
          "bentuk wadah tidak berpengaruh"
        ],
        "pause": 0.7
      },
      {
        "text": "Yang menentukan hanya kedalaman vertikal dan jenis cairannya.",
        "hl": [
          "kedalaman vertikal"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "atmosphere",
    "chapter": "04",
    "title": "Hidup di dasar lautan udara",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kita sendiri hidup di dasar sebuah lautan, yaitu lautan udara setebal puluhan kilometer.",
        "hl": [
          "lautan udara"
        ],
        "pause": 0.6
      },
      {
        "text": "Berat udara di atas kepala kita menghasilkan tekanan atmosfer, sekitar seratus ribu pascal.",
        "hl": [
          "tekanan atmosfer"
        ],
        "pause": 0.6
      },
      {
        "text": "Itu setara dengan beban sepuluh ton di atas setiap meter persegi. Kita tidak gepeng karena tekanan di dalam tubuh mendorong balik sama besar.",
        "hl": [
          "mendorong balik"
        ],
        "pause": 0.7
      },
      {
        "text": "Karena itu ada dua cara mengukur tekanan. Tekanan mutlak diukur dari ruang hampa. Tekanan ukur diukur dari tekanan udara sekitar.",
        "hl": [
          "Tekanan mutlak",
          "Tekanan ukur"
        ],
        "pause": 0.7
      },
      {
        "text": "Ban mobil yang terbaca dua koma dua bar pada alat ukur sebenarnya bertekanan mutlak sekitar tiga koma dua bar.",
        "hl": [
          "tiga koma dua bar"
        ],
        "pause": 0.6
      },
      {
        "text": "Di bawah air, setiap sepuluh meter kedalaman menambah sekitar seratus ribu pascal, kira-kira satu atmosfer lagi.",
        "hl": [
          "setiap sepuluh meter"
        ],
        "pause": 0.6
      },
      {
        "text": "Penyelam di kedalaman sepuluh meter merasakan tekanan dua kali lipat tekanan di permukaan. Itulah yang menekan gendang telinganya.",
        "hl": [
          "dua kali lipat"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "manometer",
    "chapter": "05",
    "title": "Bejana berhubungan & manometer",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Isi pipa berbentuk U dengan air. Kedua permukaannya akan setinggi sama.",
        "hl": [
          "setinggi sama"
        ],
        "pause": 0.5
      },
      {
        "text": "Alasannya: titik-titik yang setinggi, di dalam cairan diam yang sama dan saling terhubung, pasti bertekanan sama.",
        "hl": [
          "bertekanan sama"
        ],
        "pause": 0.6
      },
      {
        "text": "Aturan ini menjadi alat berpikir yang ampuh: telusuri jalur di dalam cairan, tambahkan rho g h saat turun, kurangi saat naik.",
        "hl": [
          "tambahkan rho g h saat turun"
        ],
        "pause": 0.7
      },
      {
        "text": "Hubungkan satu ujung pipa ke tabung gas. Gas mendorong cairan sehingga sisi gas turun dan sisi terbuka naik.",
        "hl": [
          "tabung gas"
        ],
        "pause": 0.6
      },
      {
        "text": "Jika cairannya bermassa jenis delapan ratus dan beda tingginya dua puluh lima sentimeter, tekanan ukur gas sama dengan dua ribu pascal.",
        "hl": [
          "dua ribu pascal"
        ],
        "pause": 0.7
      },
      {
        "text": "Alat ini disebut manometer. Ia mengubah tekanan yang tak terlihat menjadi beda tinggi yang bisa dibaca dengan penggaris.",
        "hl": [
          "manometer"
        ],
        "pause": 0.6
      },
      {
        "text": "Sekarang isi pipa U dengan minyak di satu sisi dan air di sisi lain. Kolom minyak dua puluh sentimeter diimbangi kolom air enam belas sentimeter.",
        "hl": [
          "dua puluh sentimeter"
        ],
        "pause": 0.6
      },
      {
        "text": "Dari situ massa jenis minyak dapat dihitung: delapan ratus kilogram per meter kubik.",
        "hl": [
          "delapan ratus kilogram per meter kubik"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "pascal",
    "chapter": "06",
    "title": "Hukum Pascal: gaya kecil, beban besar",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Tekan fluida di dalam wadah tertutup, dan tambahan tekanan itu diteruskan ke seluruh bagian fluida. Inilah hukum Pascal.",
        "hl": [
          "hukum Pascal"
        ],
        "pause": 0.7
      },
      {
        "text": "Sekarang buat dua piston: satu kecil, satu besar, terhubung oleh cairan yang sama.",
        "hl": [
          "dua piston"
        ],
        "pause": 0.5
      },
      {
        "text": "Tekanan di bawah keduanya sama, jadi F satu per A satu sama dengan F dua per A dua.",
        "hl": [
          "F satu per A satu sama dengan F dua per A dua"
        ],
        "pause": 0.7
      },
      {
        "text": "Piston kecil lima sentimeter persegi, piston besar dua ratus sentimeter persegi. Luasnya empat puluh kali lipat.",
        "hl": [
          "empat puluh kali lipat"
        ],
        "pause": 0.6
      },
      {
        "text": "Gaya seratus newton pada piston kecil cukup untuk menahan beban empat ratus kilogram di piston besar.",
        "hl": [
          "seratus newton"
        ],
        "pause": 0.7
      },
      {
        "text": "Tetapi tidak ada keuntungan gratis. Volume cairan tetap, jadi untuk mengangkat beban dua sentimeter, piston kecil harus turun delapan puluh sentimeter.",
        "hl": [
          "delapan puluh sentimeter"
        ],
        "pause": 0.7
      },
      {
        "text": "Gaya diperbesar empat puluh kali, jarak diperkecil empat puluh kali. Usaha yang masuk sama dengan usaha yang keluar.",
        "hl": [
          "Usaha yang masuk sama dengan usaha yang keluar"
        ],
        "pause": 0.7
      },
      {
        "text": "Ingat video sebelumnya: energi tidak bisa diciptakan. Mesin hidraulik hanya menukar gaya dengan jarak.",
        "hl": [
          "menukar gaya dengan jarak"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "archimedes",
    "chapter": "07",
    "title": "Archimedes: dari mana gaya apung?",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Konon, Archimedes berteriak eureka di bak mandi ketika menyadari tubuhnya memindahkan air.",
        "hl": [
          "eureka"
        ],
        "pause": 0.6
      },
      {
        "text": "Tetapi dari mana sebenarnya gaya yang mendorong benda ke atas? Jawabannya ada pada hidrostatika.",
        "hl": [
          "hidrostatika"
        ],
        "pause": 0.6
      },
      {
        "text": "Letakkan sebuah balok di dalam air. Permukaan bawahnya lebih dalam daripada permukaan atasnya.",
        "hl": [
          "lebih dalam"
        ],
        "pause": 0.5
      },
      {
        "text": "Jadi tekanan dari bawah lebih besar daripada tekanan dari atas. Dorongan di sisi kiri dan kanan saling meniadakan.",
        "hl": [
          "tekanan dari bawah lebih besar"
        ],
        "pause": 0.7
      },
      {
        "text": "Selisihnya adalah gaya apung: rho fluida, kali g, kali volume yang tercelup.",
        "hl": [
          "gaya apung"
        ],
        "pause": 0.7
      },
      {
        "text": "Dan rho g V tidak lain adalah berat fluida yang dipindahkan. Inilah hukum Archimedes.",
        "hl": [
          "berat fluida yang dipindahkan"
        ],
        "pause": 0.7
      },
      {
        "text": "Perhatikan: yang dipakai adalah massa jenis fluidanya, bukan massa jenis bendanya.",
        "hl": [
          "massa jenis fluidanya"
        ],
        "pause": 0.6
      },
      {
        "text": "Karena tekanan atas dan bawah naik bersama, gaya apung tidak bertambah walaupun benda diturunkan lebih dalam.",
        "hl": [
          "tidak bertambah"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "apparent",
    "chapter": "08",
    "title": "Berat semu",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Gantung sebongkah aluminium satu kilogram pada neraca pegas. Di udara, neraca menunjukkan sepuluh newton.",
        "hl": [
          "sepuluh newton"
        ],
        "pause": 0.6
      },
      {
        "text": "Celupkan seluruhnya ke dalam air, dan angkanya turun.",
        "hl": [
          "angkanya turun"
        ],
        "pause": 0.6
      },
      {
        "text": "Volume aluminium itu satu per dua ribu tujuh ratus meter kubik, sehingga air yang dipindahkan menghasilkan gaya apung tiga koma tujuh newton.",
        "hl": [
          "tiga koma tujuh newton"
        ],
        "pause": 0.6
      },
      {
        "text": "Neraca kini hanya membaca enam koma tiga newton. Inilah berat semu.",
        "hl": [
          "berat semu"
        ],
        "pause": 0.7
      },
      {
        "text": "Massanya tidak berkurang sedikit pun. Yang berubah hanyalah gaya yang dibutuhkan untuk menahannya, karena air ikut membantu menopang.",
        "hl": [
          "Massanya tidak berkurang"
        ],
        "pause": 0.6
      },
      {
        "text": "Trik ini dipakai untuk mengukur massa jenis benda berbentuk rumit: timbang di udara, timbang di air, dan selisihnya memberi volumenya.",
        "hl": [
          "selisihnya memberi volumenya"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "floating",
    "chapter": "09",
    "title": "Terapung, melayang, tenggelam",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kapan benda terapung? Bandingkan saja massa jenis benda dengan massa jenis fluida.",
        "hl": [
          "Bandingkan"
        ],
        "pause": 0.5
      },
      {
        "text": "Jika lebih kecil, benda terapung. Jika sama, benda melayang. Jika lebih besar, benda tenggelam.",
        "hl": [
          "terapung",
          "melayang",
          "tenggelam"
        ],
        "pause": 0.7
      },
      {
        "text": "Benda yang terapung tercelup sebagian saja, sampai berat air yang dipindahkan tepat sama dengan beratnya.",
        "hl": [
          "tepat sama dengan beratnya"
        ],
        "pause": 0.6
      },
      {
        "text": "Fraksi yang tercelup sama dengan perbandingan massa jenis benda terhadap massa jenis fluida.",
        "hl": [
          "perbandingan massa jenis"
        ],
        "pause": 0.6
      },
      {
        "text": "Balok kayu setinggi dua puluh sentimeter dengan massa jenis enam ratus tercelup dua belas sentimeter. Delapan sentimeter sisanya menyembul di atas air.",
        "hl": [
          "dua belas sentimeter"
        ],
        "pause": 0.7
      },
      {
        "text": "Sekarang kembali ke kapal baja. Baja memang tenggelam, tetapi lambung kapal berisi udara.",
        "hl": [
          "lambung kapal berisi udara"
        ],
        "pause": 0.6
      },
      {
        "text": "Yang menentukan adalah massa total kapal dibagi volume luarnya, dan rata-rata itu lebih kecil daripada massa jenis air.",
        "hl": [
          "massa total kapal dibagi volume luarnya"
        ],
        "pause": 0.7
      },
      {
        "text": "Baut kecil tidak punya rongga udara, jadi massa jenis rata-ratanya tetap massa jenis baja. Ia tenggelam.",
        "hl": [
          "tidak punya rongga udara"
        ],
        "pause": 0.6
      },
      {
        "text": "Ada batasnya: rakit bervolume nol koma lima meter kubik dan bermassa dua ratus kilogram hanya mampu membawa muatan tiga ratus kilogram sebelum tenggelam seluruhnya.",
        "hl": [
          "tiga ratus kilogram"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "surface",
    "chapter": "10",
    "title": "Tegangan permukaan: kulit air",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Serangga anggang-anggang bisa berjalan di atas air, dan sebatang jarum baja yang diletakkan hati-hati bisa mengapung.",
        "hl": [
          "anggang-anggang"
        ],
        "pause": 0.6
      },
      {
        "text": "Ini bukan gaya apung. Ini tegangan permukaan.",
        "hl": [
          "tegangan permukaan"
        ],
        "pause": 0.6
      },
      {
        "text": "Di dalam air, setiap molekul ditarik tetangganya ke segala arah secara seimbang.",
        "hl": [
          "ditarik tetangganya"
        ],
        "pause": 0.5
      },
      {
        "text": "Molekul di permukaan hanya punya tetangga di bawah dan di samping, sehingga tertarik ke dalam. Permukaan air pun berperilaku seperti kulit yang tegang.",
        "hl": [
          "seperti kulit yang tegang"
        ],
        "pause": 0.7
      },
      {
        "text": "Tegangan permukaan, gamma, adalah gaya per satuan panjang. Untuk air pada suhu kamar, nilainya sekitar nol koma nol tujuh dua newton per meter.",
        "hl": [
          "nol koma nol tujuh dua newton per meter"
        ],
        "pause": 0.6
      },
      {
        "text": "Memperluas permukaan membutuhkan usaha. Karena itulah tetesan air dan gelembung sabun cenderung bulat, bentuk dengan luas permukaan terkecil.",
        "hl": [
          "cenderung bulat"
        ],
        "pause": 0.6
      },
      {
        "text": "Lapisan sabun yang dibentangkan pada bingkai kawat punya dua permukaan, depan dan belakang, sehingga gayanya dua gamma kali L.",
        "hl": [
          "dua gamma kali L"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "capillary",
    "chapter": "11",
    "title": "Kapilaritas: air yang memanjat",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Celupkan pipa kaca yang sangat sempit ke dalam air. Air naik dengan sendirinya, melawan gravitasi.",
        "hl": [
          "melawan gravitasi"
        ],
        "pause": 0.6
      },
      {
        "text": "Molekul air lebih tertarik pada kaca daripada pada sesamanya, sehingga air membasahi dinding dan permukaannya melengkung naik.",
        "hl": [
          "lebih tertarik pada kaca"
        ],
        "pause": 0.6
      },
      {
        "text": "Sudut antara permukaan cairan dan dinding disebut sudut kontak, theta.",
        "hl": [
          "sudut kontak"
        ],
        "pause": 0.5
      },
      {
        "text": "Tegangan permukaan menarik sepanjang keliling pipa, dua pi r. Komponen ke atasnya menahan berat kolom air yang naik.",
        "hl": [
          "dua pi r"
        ],
        "pause": 0.6
      },
      {
        "text": "Dari keseimbangan itu, tinggi kenaikan sama dengan dua gamma kosinus theta, dibagi rho g r.",
        "hl": [
          "dua gamma kosinus theta, dibagi rho g r"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada pipa berjari-jari setengah milimeter, air naik hampir tiga sentimeter. Makin sempit pipa, makin tinggi air memanjat.",
        "hl": [
          "hampir tiga sentimeter"
        ],
        "pause": 0.6
      },
      {
        "text": "Raksa berbeda: ia lebih tertarik pada sesamanya, sudut kontaknya lebih dari sembilan puluh derajat, sehingga permukaannya justru turun di dalam pipa.",
        "hl": [
          "justru turun"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "strategy",
    "chapter": "12",
    "title": "Cara berpikir: soal fluida statis",
    "mood": "resolve",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Bagaimana menaklukkan soal fluida statis? Gunakan urutan berpikir ini.",
        "hl": [
          "urutan berpikir"
        ],
        "pause": 0.6
      },
      {
        "text": "Satu: gambar wadah, cairan, dan titik-titik yang ditanyakan. Tandai kedalaman secara vertikal.",
        "hl": [
          "secara vertikal"
        ],
        "pause": 0.5
      },
      {
        "text": "Dua: tentukan apakah yang diminta tekanan mutlak atau tekanan ukur.",
        "hl": [
          "tekanan mutlak atau tekanan ukur"
        ],
        "pause": 0.5
      },
      {
        "text": "Tiga: untuk tekanan, telusuri jalur di dalam cairan yang terhubung, tambah rho g h saat turun, kurangi saat naik.",
        "hl": [
          "telusuri jalur"
        ],
        "pause": 0.5
      },
      {
        "text": "Empat: untuk benda di dalam fluida, gambar diagram gaya: berat, gaya apung, dan gaya tali atau penopang.",
        "hl": [
          "diagram gaya"
        ],
        "pause": 0.5
      },
      {
        "text": "Lima: periksa satuan. Sentimeter persegi harus diubah ke meter persegi dengan faktor sepuluh pangkat minus empat.",
        "hl": [
          "sepuluh pangkat minus empat"
        ],
        "pause": 0.7
      },
      {
        "text": "Coba soal ini: benda bermassa jenis sembilan ratus melayang di antara lapisan minyak delapan ratus dan air seribu. Berapa bagian volumenya yang berada di air?",
        "hl": [
          "Berapa bagian volumenya"
        ],
        "pause": 0.8
      },
      {
        "text": "Gaya apung total adalah jumlah dari kedua cairan: delapan ratus kali satu minus f, ditambah seribu kali f, sama dengan sembilan ratus.",
        "hl": [
          "jumlah dari kedua cairan"
        ],
        "pause": 0.7
      },
      {
        "text": "Hasilnya f sama dengan setengah. Masuk akal, karena sembilan ratus tepat di tengah antara delapan ratus dan seribu.",
        "hl": [
          "setengah"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "hydrometer",
    "chapter": "13",
    "title": "Massa jenis di laboratorium",
    "mood": "wonder",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Di laboratorium kimia, massa jenis adalah sidik jari sederhana sebuah larutan.",
        "hl": [
          "sidik jari sederhana"
        ],
        "pause": 0.6
      },
      {
        "text": "Hidrometer adalah pelampung kaca berskala. Ia tenggelam lebih dalam pada cairan yang kurang rapat, dan menyembul lebih tinggi pada cairan yang lebih rapat.",
        "hl": [
          "Hidrometer"
        ],
        "pause": 0.7
      },
      {
        "text": "Prinsipnya murni Archimedes: pelampung tercelup sampai berat cairan yang dipindahkan sama dengan beratnya.",
        "hl": [
          "murni Archimedes"
        ],
        "pause": 0.6
      },
      {
        "text": "Dengan cara ini, kadar gula dalam nira, kadar alkohol hasil fermentasi, atau kepekatan asam di aki dapat diperkirakan tanpa reaksi kimia apa pun.",
        "hl": [
          "tanpa reaksi kimia"
        ],
        "pause": 0.7
      },
      {
        "text": "Larutan gula yang lebih pekat lebih rapat, sehingga hidrometer menyembul lebih tinggi.",
        "hl": [
          "lebih pekat lebih rapat"
        ],
        "pause": 0.6
      },
      {
        "text": "Cairan yang tidak bercampur pun dapat dipisahkan dengan corong pisah: lapisan yang lebih rapat selalu berada di bawah.",
        "hl": [
          "corong pisah"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "soap",
    "chapter": "14",
    "title": "Sabun & ikatan hidrogen",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Mengapa tegangan permukaan air begitu besar dibanding cairan lain? Jawabannya ikatan hidrogen.",
        "hl": [
          "ikatan hidrogen"
        ],
        "pause": 0.6
      },
      {
        "text": "Setiap molekul air dapat membentuk ikatan hidrogen dengan tetangganya. Jaringan tarik-menarik inilah yang membuat kulit air kuat.",
        "hl": [
          "Jaringan tarik-menarik"
        ],
        "pause": 0.6
      },
      {
        "text": "Sabun dan deterjen adalah surfaktan. Molekulnya punya kepala yang suka air dan ekor yang menghindari air.",
        "hl": [
          "surfaktan"
        ],
        "pause": 0.6
      },
      {
        "text": "Molekul surfaktan berkumpul di permukaan dan menyisip di antara molekul air, memutus sebagian tarikan itu. Tegangan permukaan pun turun.",
        "hl": [
          "Tegangan permukaan pun turun"
        ],
        "pause": 0.7
      },
      {
        "text": "Teteskan sabun di dekat jarum yang mengapung, dan jarum itu segera tenggelam.",
        "hl": [
          "segera tenggelam"
        ],
        "pause": 0.6
      },
      {
        "text": "Dengan tegangan permukaan yang lebih rendah, air lebih mudah membasahi kain dan menyusup ke celah kotoran. Itulah mengapa sabun membantu mencuci.",
        "hl": [
          "lebih mudah membasahi"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "chroma",
    "chapter": "15",
    "title": "Kapilaritas dalam kromatografi",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kapilaritas bekerja setiap hari di laboratorium kimia, misalnya pada kromatografi kertas dan kromatografi lapis tipis.",
        "hl": [
          "kromatografi"
        ],
        "pause": 0.6
      },
      {
        "text": "Ujung kertas dicelupkan ke dalam pelarut. Pelarut merambat naik melalui celah-celah sempit di antara serat kertas.",
        "hl": [
          "merambat naik"
        ],
        "pause": 0.6
      },
      {
        "text": "Ini kapilaritas yang sama: pori-pori kecil berperan sebagai jutaan pipa kapiler.",
        "hl": [
          "jutaan pipa kapiler"
        ],
        "pause": 0.6
      },
      {
        "text": "Saat pelarut naik, ia membawa campuran zat. Zat yang lebih tertarik pada pelarut ikut terbawa jauh, zat yang lebih tertarik pada kertas tertinggal.",
        "hl": [
          "ikut terbawa jauh"
        ],
        "pause": 0.7
      },
      {
        "text": "Campuran tinta pun terpisah menjadi pita-pita warna.",
        "hl": [
          "pita-pita warna"
        ],
        "pause": 0.6
      },
      {
        "text": "Perbandingan jarak tempuh zat terhadap jarak tempuh pelarut disebut nilai R f, yang khas untuk setiap zat pada kondisi tertentu.",
        "tts": "Perbandingan jarak tempuh zat terhadap jarak tempuh pelarut disebut nilai er ef, yang khas untuk setiap zat pada kondisi tertentu.",
        "hl": [
          "nilai R f"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "submarine",
    "chapter": "16",
    "title": "Kapal selam & laut dalam",
    "mood": "tension",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kapal selam mengendalikan naik turunnya dengan tangki pemberat.",
        "hl": [
          "tangki pemberat"
        ],
        "pause": 0.5
      },
      {
        "text": "Untuk menyelam, tangki diisi air laut. Massa total bertambah, massa jenis rata-ratanya melebihi air laut, dan kapal turun.",
        "hl": [
          "diisi air laut"
        ],
        "pause": 0.6
      },
      {
        "text": "Untuk naik, udara bertekanan mendorong air keluar dari tangki. Kapal menjadi lebih ringan dan naik.",
        "hl": [
          "udara bertekanan"
        ],
        "pause": 0.6
      },
      {
        "text": "Di kedalaman seratus meter, tekanan air sekitar sebelas kali tekanan atmosfer. Lambung kapal harus menahan dorongan sekitar satu juta newton di setiap meter persegi.",
        "hl": [
          "satu juta newton"
        ],
        "pause": 0.7
      },
      {
        "text": "Di palung terdalam, sekitar sebelas kilometer di bawah permukaan, tekanannya lebih dari seribu kali tekanan atmosfer.",
        "hl": [
          "lebih dari seribu kali"
        ],
        "pause": 0.7
      },
      {
        "text": "Ikan-ikan laut dalam bertahan karena tubuhnya hampir tanpa rongga udara. Tekanan di dalam dan di luar tubuhnya seimbang.",
        "hl": [
          "hampir tanpa rongga udara"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "blood",
    "chapter": "17",
    "title": "Tekanan darah & barometer",
    "mood": "build",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Saat dokter mengukur tekanan darah, angkanya ditulis dalam milimeter raksa, misalnya seratus dua puluh per delapan puluh.",
        "hl": [
          "milimeter raksa"
        ],
        "pause": 0.6
      },
      {
        "text": "Satuan ini berasal dari barometer Torricelli: tabung kaca berisi raksa yang dibalik ke dalam wadah raksa.",
        "hl": [
          "barometer Torricelli"
        ],
        "pause": 0.6
      },
      {
        "text": "Raksa turun sampai tingginya sekitar tujuh ratus enam puluh milimeter. Di atasnya hampir hampa, dan berat kolom raksa itu diimbangi tekanan atmosfer.",
        "hl": [
          "tujuh ratus enam puluh milimeter"
        ],
        "pause": 0.7
      },
      {
        "text": "Raksa dipilih karena sangat rapat. Jika memakai air, tabungnya harus setinggi lebih dari sepuluh meter.",
        "hl": [
          "lebih dari sepuluh meter"
        ],
        "pause": 0.6
      },
      {
        "text": "Tekanan darah seratus dua puluh milimeter raksa berarti tekanan ukur sekitar enam belas ribu pascal, cukup untuk mendorong kolom air setinggi sekitar satu koma enam meter.",
        "hl": [
          "enam belas ribu pascal"
        ],
        "pause": 0.7
      },
      {
        "text": "Itu sebabnya tekanan darah diukur setinggi jantung. Jika lengan diangkat ke atas kepala, tekanan di lengan berkurang menurut rho g h.",
        "hl": [
          "setinggi jantung"
        ],
        "pause": 0.6
      },
      {
        "text": "Infus pun memanfaatkan hidrostatika: kantong cairan digantung tinggi agar tekanannya mampu mengalahkan tekanan darah di pembuluh vena.",
        "hl": [
          "Infus"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "iceberg",
    "chapter": "18",
    "title": "Gunung es: puncak yang menipu",
    "mood": "wonder",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Ungkapan puncak gunung es punya dasar fisika.",
        "hl": [
          "puncak gunung es"
        ],
        "pause": 0.5
      },
      {
        "text": "Es bermassa jenis sekitar sembilan ratus tujuh belas kilogram per meter kubik, lebih kecil daripada air. Inilah keanehan air: wujud padatnya lebih ringan daripada wujud cairnya.",
        "hl": [
          "wujud padatnya lebih ringan"
        ],
        "pause": 0.7
      },
      {
        "text": "Penyebabnya lagi-lagi ikatan hidrogen, yang menata molekul es dalam kisi heksagonal yang lapang.",
        "hl": [
          "kisi heksagonal yang lapang"
        ],
        "pause": 0.6
      },
      {
        "text": "Di air laut yang bermassa jenis sekitar seribu dua puluh lima, fraksi yang tercelup sama dengan sembilan ratus tujuh belas dibagi seribu dua puluh lima, sekitar delapan puluh sembilan persen.",
        "hl": [
          "delapan puluh sembilan persen"
        ],
        "pause": 0.7
      },
      {
        "text": "Hanya sekitar sebelas persen yang terlihat. Sisanya tersembunyi di bawah air, dan bagian tak terlihat seperti itulah yang merobek lambung Titanic pada tahun seribu sembilan ratus dua belas.",
        "hl": [
          "sebelas persen"
        ],
        "pause": 0.7
      },
      {
        "text": "Karena es mengapung, danau membeku dari atas. Lapisan es melindungi air di bawahnya, sehingga ikan tetap hidup sepanjang musim dingin.",
        "hl": [
          "danau membeku dari atas"
        ],
        "pause": 0.6
      }
    ]
  },
  {
    "id": "recap",
    "chapter": "19",
    "title": "Rangkuman",
    "mood": "resolve",
    "lead": 1.0,
    "tail": 1.6,
    "lines": [
      {
        "text": "Mari rangkum.",
        "pause": 0.5
      },
      {
        "text": "Massa jenis adalah massa per volume, dan menentukan siapa yang mengapung.",
        "hl": [
          "Massa jenis"
        ],
        "pause": 0.5
      },
      {
        "text": "Tekanan adalah gaya per luas, mendorong ke segala arah, dan bertambah rho g h setiap kita turun sedalam h.",
        "hl": [
          "rho g h"
        ],
        "pause": 0.5
      },
      {
        "text": "Hukum Pascal meneruskan tekanan ke seluruh fluida tertutup, sehingga gaya kecil dapat menahan beban besar dengan menukar jarak.",
        "hl": [
          "Hukum Pascal"
        ],
        "pause": 0.5
      },
      {
        "text": "Gaya apung sama dengan berat fluida yang dipindahkan, lahir dari selisih tekanan atas dan bawah.",
        "hl": [
          "berat fluida yang dipindahkan"
        ],
        "pause": 0.5
      },
      {
        "text": "Tegangan permukaan dan kapilaritas muncul dari tarik-menarik antarmolekul.",
        "hl": [
          "tarik-menarik antarmolekul"
        ],
        "pause": 0.7
      },
      {
        "text": "Jadi, setiap kali melihat sesuatu mengapung, tertekan, atau memanjat, tanyakan: di mana tekanannya lebih besar, dan ke mana dorongannya?",
        "hl": [
          "ke mana dorongannya"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "outro",
    "chapter": "",
    "title": "Penutup",
    "mood": "outro",
    "fixed": 16,
    "lines": []
  }
];
