import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Footer from "../components/footer/index";
import "./css/pengumuman-kelulusan.css";

const API_BASE = `${(import.meta.env.VITE_BASE_URL || "http://localhost:3000").replace(/\/$/, "")}/api/v1`;
const TAHUN_AJARAN = "2024/2025";

// ─── Types ───────────────────────────────────────────────────
interface GradConfig {
  config_id: string;
  kelas: "XII_MIPA" | "XII_IPS";
  tanggal_akses: string;
  pesan_banner: string | null;
  tahun_ajaran: string;
}

interface HasilKelulusan {
  nama_siswa: string;
  nomor_siswa: string;
  kelas: "XII_MIPA" | "XII_IPS";
  status_lulus: boolean;
  keterangan: string | null;
  tahun_ajaran: string;
  jenjang: { nama_jenjang: string };
}

// ─── Helpers ─────────────────────────────────────────────────
const KELAS_LABEL: Record<string, string> = {
  XII_MIPA: "XII IPA",
  XII_IPS: "XII IPS",
};

const formatTanggalAkses = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }) + " WIB";

// ─── Component ───────────────────────────────────────────────
const PengumumanKelulusanSMA = () => {
  const navigate = useNavigate();

  const [configs, setConfigs] = useState<GradConfig[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [nomorInduk, setNomorInduk] = useState("");
  const [tglLahir, setTglLahir] = useState("");
  const [hasil, setHasil] = useState<HasilKelulusan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Ambil konfigurasi tanggal akses
  useEffect(() => {
    axios
      .get(`${API_BASE}/grad-config/publik`, {
        params: { tahun_ajaran: TAHUN_AJARAN },
      })
      .then((res) => setConfigs(res.data.data || []))
      .catch(() => setConfigs([]))
      .finally(() => setConfigLoading(false));
  }, []);

  // Apakah minimal 1 kelas sudah bisa diakses
  const adaYangBisaDiakses =
    configs.length === 0 || // tidak ada config → tidak dibatasi
    configs.some((c) => new Date() >= new Date(c.tanggal_akses));

  // Config dengan tanggal akses paling awal yang belum tiba (untuk info)
  const configBelumAkses = [...configs]
    .filter((c) => new Date() < new Date(c.tanggal_akses))
    .sort(
      (a, b) =>
        new Date(a.tanggal_akses).getTime() -
        new Date(b.tanggal_akses).getTime(),
    )[0];

  // ── Submit ─────────────────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setHasil(null);

    // Validasi nomor induk
    if (nomorInduk.trim().length < 5) {
      setError("Nomor Induk minimal 5 karakter.");
      return;
    }

    // Validasi tanggal lahir: tepat 8 digit angka
    if (!/^\d{8}$/.test(tglLahir)) {
      setError(
        "Format tanggal lahir tidak valid. Gunakan YYYYMMDD — contoh: 20050817.",
      );
      return;
    }

    // Validasi logis
    const y = parseInt(tglLahir.substring(0, 4));
    const m = parseInt(tglLahir.substring(4, 6));
    const d = parseInt(tglLahir.substring(6, 8));
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2015) {
      setError("Tanggal lahir tidak valid. Periksa kembali inputan Anda.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${API_BASE}/graduation/cek-siswa`, {
        nomor_siswa: nomorInduk.trim(),
        tanggal_lahir: tglLahir,
        tahun_ajaran: TAHUN_AJARAN,
      });
      if (res.data.success) setHasil(res.data.data);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 404) {
        setError(
          "Data tidak ditemukan. Pastikan Nomor Induk dan tanggal lahir sudah benar.",
        );
      } else if (status === 403) {
        setError(msg || "Pengumuman kelulusan belum dapat diakses.");
      } else {
        setError("Gagal terhubung ke server. Pastikan koneksi internet aktif.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setHasil(null);
    setError("");
    setNomorInduk("");
    setTglLahir("");
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <div className="page-layout">
        <div className="pk-page">
          {/* Breadcrumb */}
          <div className="pk-breadcrumb">
            <button
              className="pk-breadcrumb-link"
              onClick={() => navigate("/kelulusan")}
            >
              Kelulusan
            </button>
            <span className="pk-breadcrumb-separator">/</span>
            <span className="pk-breadcrumb-current">SMA</span>
          </div>

          <div className="pk-wrapper pk-wrapper--sma">
            <h1 className="pk-title">Pengumuman Kelulusan SMA</h1>
            <p className="pk-subtitle">Tahun Ajaran {TAHUN_AJARAN}</p>

            {/* ── Banner tanggal akses ── */}
            {!configLoading && configs.length > 0 && (
              <div className="pk-banner-group">
                {configs.map((cfg) => {
                  const bisa = new Date() >= new Date(cfg.tanggal_akses);
                  return (
                    <div
                      key={cfg.config_id}
                      className={`pk-banner ${bisa ? "pk-banner--open" : "pk-banner--locked"}`}
                    >
                      <span className="pk-banner-icon">
                        {bisa ? "🟢" : "🔒"}
                      </span>
                      <div className="pk-banner-text">
                        <strong>
                          Kelas {KELAS_LABEL[cfg.kelas]} —{" "}
                          {bisa
                            ? "Pengumuman sudah dapat diakses"
                            : `Pengumuman ini mulai dapat diakses: ${formatTanggalAkses(cfg.tanggal_akses)}`}
                        </strong>
                        {cfg.pesan_banner && (
                          <p className="pk-banner-pesan">{cfg.pesan_banner}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Panduan ── */}
            <div className="pk-panduan">
              <p className="pk-panduan-title">📋 Panduan</p>
              <ol className="pk-panduan-list">
                <li>
                  Masukkan <strong>Nomor Induk Siswa (NISN)</strong>
                </li>
                <li>
                  Masukkan <strong>Tanggal Lahir</strong> dengan format{" "}
                  <strong>YYYYMMDD</strong> (Tahun-Bulan-Tanggal, tanpa spasi)
                  <br />
                  <span className="pk-panduan-contoh">
                    Contoh: 17 Agustus 2005 → <strong>20050817</strong>
                  </span>
                </li>
                <li>
                  Klik <strong>"Tampilkan Hasil Kelulusan"</strong>
                </li>
              </ol>
            </div>

            {/* ── Form ── */}
            {!hasil && (
              <form className="pk-form" onSubmit={handleSearch}>
                {/* Nomor Induk */}
                <div className="pk-form-group">
                  <label className="pk-label">Nomor Induk Siswa (NISN)</label>
                  <input
                    type="text"
                    className="pk-input"
                    placeholder="Contoh: 0012345678"
                    value={nomorInduk}
                    onChange={(e) =>
                      setNomorInduk(e.target.value.replace(/\s/g, ""))
                    }
                    maxLength={20}
                  />
                </div>

                {/* Tanggal Lahir */}
                <div className="pk-form-group">
                  <label className="pk-label">Tanggal Lahir</label>
                  <input
                    type="text"
                    className="pk-input"
                    placeholder="Format: YYYYMMDD (contoh: 20050817)"
                    value={tglLahir}
                    onChange={(e) =>
                      setTglLahir(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    maxLength={8}
                    inputMode="numeric"
                  />
                  <small className="pk-hint">
                    Contoh: 17 Agustus 2005 → <strong>20050817</strong>
                  </small>
                </div>

                {/* Error */}
                {error && <div className="pk-error">⚠️ {error}</div>}

                {/* Submit */}
                <button
                  type="submit"
                  className="pk-btn-submit"
                  disabled={isLoading || !adaYangBisaDiakses}
                >
                  {isLoading
                    ? "⏳ Mencari Data..."
                    : !adaYangBisaDiakses
                      ? "🔒 Belum Dapat Diakses"
                      : "🎓 Tampilkan Hasil Kelulusan"}
                </button>

                {/* Info waktu akses jika belum bisa */}
                {!adaYangBisaDiakses && configBelumAkses && (
                  <p className="pk-akses-info">
                    Pengumuman dapat diakses mulai{" "}
                    <strong>
                      {formatTanggalAkses(configBelumAkses.tanggal_akses)}
                    </strong>
                  </p>
                )}
              </form>
            )}

            {/* ── Hasil kelulusan ── */}
            {hasil && (
              <div className="pk-hasil">
                <div
                  className={`pk-hasil-card ${
                    hasil.status_lulus
                      ? "pk-hasil--lulus"
                      : "pk-hasil--tidak-lulus"
                  }`}
                >
                  <div className="pk-hasil-icon">
                    {hasil.status_lulus ? "🎉" : "😔"}
                  </div>
                  <h2 className="pk-hasil-status">
                    {hasil.status_lulus
                      ? "DINYATAKAN LULUS"
                      : "BELUM DINYATAKAN LULUS"}
                  </h2>

                  <div className="pk-hasil-info">
                    {(
                      [
                        ["Nama", hasil.nama_siswa],
                        ["Nomor Induk", hasil.nomor_siswa],
                        ["Kelas", KELAS_LABEL[hasil.kelas] || hasil.kelas],
                        ["Tahun Ajaran", hasil.tahun_ajaran],
                        ...(hasil.keterangan
                          ? [["Keterangan", hasil.keterangan]]
                          : []),
                      ] as [string, string][]
                    ).map(([label, value]) => (
                      <div className="pk-hasil-row" key={label}>
                        <span className="pk-hasil-label">{label}</span>
                        <span className="pk-hasil-value">{value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="pk-hasil-footer">
                    Data ini bersifat resmi. Harap dijaga kerahasiaannya.
                  </p>
                </div>

                <button className="pk-btn-reset" onClick={handleReset}>
                  ← Cek Siswa Lain
                </button>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PengumumanKelulusanSMA;
