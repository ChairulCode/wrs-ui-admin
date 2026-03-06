import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  GraduationCap,
  BookOpen,
  Users,
  Award,
} from "lucide-react";

import mikrologo from "/assets/mikroskil.png";
import "./footer.css";

// 1. Definisikan Interface untuk Data Sosial Media
interface SocialMedia {
  social_media_id: number;
  platform: string;
  username: string;
  url: string;
  level: "SMA" | "SMP" | "SD" | "PGTK" | string;
}

const API_URL = "http://localhost:3000/api/v1/sosial";

const Footer: React.FC = () => {
  // 2. Berikan tipe data <SocialMedia[]> pada useState
  const [socialData, setSocialData] = useState<SocialMedia[]>([]);
  const schoolLocation = "Jl. Asia No No.143 Medan 20214, Sumatera Utara";

  useEffect(() => {
    /*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Fetch social media data from API and set it to state
     * @returns {Promise<void>}
     */
    /*******  90968724-2e68-4045-a529-339253aa057f  *******/
    const fetchSocials = async () => {
      try {
        const response = await axios.get(API_URL); // BERSIH: Tanpa header token
        setSocialData(response.data.data || response.data || []);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      }
    };
    fetchSocials();
  }, []);

  const handleMapClick = () => {
    // Perbaikan penulisan template literal untuk Google Maps
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      schoolLocation,
    )}`;
    window.open(mapsUrl, "_blank");
  };

  const schoolStats = [
    { icon: Users, label: "Ekstrakulikuler", value: "9" },
    { icon: BookOpen, label: "Tingkatan", value: "4" },
    { icon: Award, label: "Prestasi", value: "50+" },
  ];

  // 3. Fungsi Helper dengan Type Safety
  // 3. Fungsi Helper dengan Logika Warna & Username
  const renderSocialLinks = (level: string) => {
    const platformColors: Record<string, string> = {
      Instagram: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
      Youtube: "linear-gradient(135deg, #FF0000, #cc0000)",
      Facebook: "linear-gradient(135deg, #1877F2, #0d65d9)",
      Tiktok: "linear-gradient(135deg, #000000, #25F4EE, #FE2C55)",
    };

    const filtered = socialData.filter(
      (item) => item.level?.toLowerCase() === level.toLowerCase(),
    );

    const order = ["Instagram", "Youtube", "Facebook", "Tiktok"];
    const sorted = [...filtered].sort(
      (a, b) => order.indexOf(a.platform) - order.indexOf(b.platform),
    );

    if (sorted.length === 0)
      return (
        <p
          style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.5)",
            fontStyle: "italic",
          }}
        >
          Belum tersedia
        </p>
      );

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginTop: "12px",
          alignItems: "stretch",
        }}
      >
        {sorted.map((link) => (
          <button
            key={link.social_media_id}
            onClick={() => window.open(link.url, "_blank")}
            style={{
              background: platformColors[link.platform] || "#444",
              padding: "10px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              width: "100%", // Memenuhi kolom grid\
              height: "100%",
              minHeight: "65px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span
              style={{ fontSize: "11px", fontWeight: "bold", color: "white" }}
            >
              {link.platform}
            </span>
            <span
              style={{
                fontSize: "9px",
                color: "rgba(255,255,255,0.9)",
                fontStyle: "italic",
                marginTop: "2px",
                lineHeight: "1.2",
                display: "-webkit-box",
                WebkitLineClamp: 2, // Maksimal 2 baris teks agar tidak terlalu panjang ke bawah
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              @{link.username}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <footer className="footer">
      <div className="footer-bg-pattern"></div>
      <div className="footer-bg-element footer-bg-element--1"></div>
      <div className="footer-bg-element footer-bg-element--2"></div>
      <div className="footer-bg-element footer-bg-element--3"></div>

      <div className="footer-container">
        <div className="footer-header">
          <div className="footer-header-icon">
            <GraduationCap size={40} className="text-yellow-300" />
          </div>
          <h2 className="footer-title">Perguruan WR Supratman Medan</h2>
          <p className="footer-subtitle">
            Membangun Generasi Unggul untuk Masa Depan yang Cemerlang
          </p>
        </div>

        <div className="footer-stats">
          {schoolStats.map((stat, index) => (
            <div key={index} className="footer-stat-card">
              <div className="footer-stat-content">
                <div className="footer-stat-icon">
                  <stat.icon size={28} className="text-white" />
                </div>
                <div className="footer-stat-info">
                  <p className="footer-stat-value">{stat.value}</p>
                  <p className="footer-stat-label">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="footer-main-grid">
          <div className="footer-left-column">
            <div className="footer-section">
              <h3 className="footer-section-title">
                <MapPin className="footer-section-icon" size={28} />
                Lokasi & Kontak
              </h3>

              <div className="footer-address-card">
                <div className="footer-address-content">
                  <MapPin className="footer-address-icon" size={20} />
                  <div className="footer-address-text">
                    <h4 className="footer-address-title">Alamat Sekolah</h4>
                    <p className="footer-address-detail">
                      Jl. Asia No No.143 Medan 20214
                      <br />
                      Sumatera Utara
                    </p>
                  </div>
                </div>
              </div>

              <div className="footer-maps-container">
                <div
                  className="footer-maps-image-wrapper"
                  onClick={handleMapClick}
                >
                  <div className="footer-maps-image-container">
                    <div className="footer-maps-placeholder">
                      {/* Ganti dengan link embed asli jika tersedia */}
                      <iframe
                        title="School Map"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.02534567!2d98.6872!3d3.5894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMzUnMjEuOCJOIDk4wrA0MScxMy45IkU!5e0!3m2!1sid!2sid!4v123456789"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                      ></iframe>
                    </div>
                    <div className="footer-maps-overlay">
                      <div className="footer-maps-overlay-content">
                        <div className="footer-maps-overlay-icon">
                          <MapPin size={24} />
                        </div>
                        <div className="footer-maps-overlay-text">
                          <h4 className="footer-maps-overlay-title">
                            Klik untuk membuka di Google Maps
                          </h4>
                          <p className="footer-maps-overlay-subtitle">
                            Lihat rute dan lokasi lengkap
                          </p>
                        </div>
                        <ExternalLink
                          className="footer-maps-overlay-external"
                          size={20}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="footer-contact-grid">
                <a
                  href="mailto:wr_supratman1@yahoo.com"
                  className="footer-contact-card"
                >
                  <div className="footer-contact-content">
                    <Mail
                      className="footer-contact-icon footer-contact-icon--mail"
                      size={20}
                    />
                    <div className="footer-contact-text">
                      <p className="footer-contact-label">Email</p>
                      <p className="footer-contact-value">
                        wr_supratman1@yahoo.com
                      </p>
                    </div>
                  </div>
                </a>
                <a href="tel:+62617345093" className="footer-contact-card">
                  <div className="footer-contact-content">
                    <Phone
                      className="footer-contact-icon footer-contact-icon--phone"
                      size={20}
                    />
                    <div className="footer-contact-text">
                      <p className="footer-contact-label">Telepon</p>
                      <p className="footer-contact-value">061-7345093</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="footer-right-column">
            <div className="footer-section">
              <h3 className="footer-section-title">
                <BookOpen className="footer-section-icon" size={28} />
                Informasi Sekolah
              </h3>
              <div className="footer-info-card">
                <div className="footer-info-content">
                  <div className="footer-info-item">
                    <h4 className="footer-info-title">Visi</h4>
                    <p className="footer-info-text mb-6">
                      Menjadikan Sekolah WR Supratman 1 Medan Diakui
                      Keunggulannya...
                    </p>
                    <h4 className="footer-info-title">Misi</h4>
                    <ol className="footer-mission-list">
                      <li>Melaksanakan Pendidikan yang Bermutu...</li>
                      <li>
                        Melaksanakan Pendidikan berdasarkan budi pekerti...
                      </li>
                    </ol>
                  </div>
                  <div className="footer-info-item">
                    <h4 className="footer-info-title">Jam Operasional</h4>
                    <div className="footer-schedule">
                      <p>Senin - Sabtu: 07:00 - 15:30 WIB</p>
                      <p>Minggu: Tutup</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="footer-social-sections">
              <div className="footer-social-item">
                <h3 className="footer-section-title">
                  <ExternalLink className="footer-section-icon" size={28} />
                  Media Sosial SMA
                </h3>
                {renderSocialLinks("SMA")}
              </div>

              <div className="footer-social-item">
                <h3 className="footer-section-title">
                  <ExternalLink className="footer-section-icon" size={28} />
                  Media Sosial SMP
                </h3>
                {renderSocialLinks("SMP")}
              </div>

              <div className="footer-social-item">
                <h3 className="footer-section-title">
                  <ExternalLink className="footer-section-icon" size={28} />
                  Media Sosial SD
                </h3>
                {renderSocialLinks("SD")}
              </div>

              <div className="footer-social-item">
                <h3 className="footer-section-title">
                  <ExternalLink className="footer-section-icon" size={28} />
                  Media Sosial PG/TK
                </h3>
                {renderSocialLinks("PGTK")}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-partner">
              <div className="footer-partner-logo">
                <img
                  src={mikrologo}
                  alt="Mikroskil Logo"
                  className="footer-logo"
                />
              </div>
              <div className="footer-partner-info">
                <p className="footer-partner-title">Education Partners</p>
                <p className="footer-partner-name">Universitas Mikroskil</p>
                <p className="footer-partner-desc">Web Development & Design</p>
              </div>
            </div>
            <div className="footer-copyright">
              <p className="footer-copyright-main">
                © 2025 Perguruan WR Supratman Medan. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom-border"></div>
    </footer>
  );
};

export default Footer;
