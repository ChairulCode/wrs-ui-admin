import { useParams, useNavigate } from "react-router-dom";
import "./activities.css";
import { useEffect, useState } from "react";
import { getRequest } from "@/utils/api-call";
import { formatTime } from "@/utils/time-format";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle } from "lucide-react";
import { KegiatanDetail } from "@/types/data";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const KegiatanDetailPage = () => {
	const { kegiatan_id } = useParams();
	const navigate = useNavigate();
	const [copySuccess, setCopySuccess] = useState(false);
	const [data, setData] = useState<KegiatanDetail | null>(null);

	// Get current page URL
	const currentUrl = window.location.href;

	useEffect(() => {
		const getData = async () => {
			try {
				const response = await getRequest(`kegiatan/${kegiatan_id}`);
				setData(response.data);
				console.log(response);
			} catch (error) {
				console.log(error);
			}
		};
		getData();
	}, []);

	// Share handlers
	const handleInstagramShare = () => {
		// Instagram Story sharing - akan redirect ke Instagram app
		// Format: instagram://story-camera or direct link
		const instagramUrl = `https://www.instagram.com/create/story`;

		// Untuk mobile, coba buka Instagram app
		const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

		if (isMobile) {
			// Try to open Instagram app first
			window.location.href = `instagram://story-camera`;

			// Fallback ke web setelah 1 detik jika app tidak terbuka
			setTimeout(() => {
				window.open(instagramUrl, "_blank");
			}, 1000);
		} else {
			// Desktop: buka Instagram web
			window.open(instagramUrl, "_blank");
			alert("Untuk share ke Instagram Story, silakan gunakan mobile device atau upload manual dari Instagram app Anda.");
		}
	};

	const handleWhatsAppShare = () => {
		// WhatsApp share dengan text dan link
		const text = encodeURIComponent(`🏆 *${data?.judul}*\n\n${data?.konten}\n\nLihat selengkapnya:`);
		const url = encodeURIComponent(currentUrl);
		const whatsappUrl = `https://wa.me/?text=${text}%20${url}`;

		window.open(whatsappUrl, "_blank");
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(currentUrl);
			setCopySuccess(true);

			// Reset success message after 2 seconds
			setTimeout(() => {
				setCopySuccess(false);
			}, 2000);
		} catch {
			// Fallback untuk browser yang tidak support clipboard API
			const textArea = document.createElement("textarea");
			textArea.value = currentUrl;
			textArea.style.position = "fixed";
			textArea.style.left = "-999999px";
			document.body.appendChild(textArea);
			textArea.select();

			try {
				document.execCommand("copy");
				setCopySuccess(true);
				setTimeout(() => {
					setCopySuccess(false);
				}, 2000);
			} catch {
				alert("Gagal menyalin link. Silakan copy manual.");
			}

			document.body.removeChild(textArea);
		}
	};

	if (!data) {
		return (
			<>
				<div className='kegiatan-not-found'>
					<div className='not-found-content'>
						<div className='not-found-icon'>📚</div>
						<h1>Kegiatan tidak ditemukan</h1>
						<p>Maaf, kegiatan yang Anda cari tidak tersedia</p>
						<button onClick={() => navigate("/")} className='back-home-btn'>
							<span>←</span> Kembali ke Beranda
						</button>
					</div>
				</div>
			</>
		);
	}

	return (
		<DashboardLayout>
			<div className='kegiatan-detail-wrapper'>
				<div className='mb-10'>
					<Button onClick={() => navigate(-1)}>
						<ArrowLeftCircle className='mr-2' />
						Kembali
					</Button>
				</div>
				<div className='kegiatan-detail-container'>
					{/* Main Content Card */}
					<div className='kegiatan-detail-content'>
						{/* Hero Image Section */}
						<div className='detail-image-wrapper relative flex items-center justify-center'>
							<div className='image-overlay'></div>
							<img src={`${BASE_URL}/${data.path_gambar}`} alt={data.judul} className='detail-image' />
						</div>

						{/* Content Section */}
						<div className='detail-info'>
							{/* Date Badge with Icon */}
							<div className='detail-date'>
								<svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
									<rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
									<line x1='16' y1='2' x2='16' y2='6' />
									<line x1='8' y1='2' x2='8' y2='6' />
									<line x1='3' y1='10' x2='21' y2='10' />
								</svg>
								<span>{formatTime(data.tanggal_publikasi, "DD MMMM yyyy")}</span>
							</div>

							{/* Title */}
							<h1 className='detail-title'>{data.judul}</h1>

							{/* Decorative Divider */}
							<div className='title-divider'>
								<span className='divider-line'></span>
								<span className='divider-dot'></span>
								<span className='divider-line'></span>
							</div>

							{/* Content Text */}
							<div className='detail-content'>
								<p className='detail-text'>{data.konten}</p>
							</div>

							{/* Share Section */}
							<div className='detail-share'>
								<h3 className='share-title'>Bagikan Kegiatan Ini</h3>
								<div className='share-buttons'>
									{/* Instagram Button */}
									<button className='share-btn instagram' title='Share to Instagram Story' onClick={handleInstagramShare}>
										<svg viewBox='0 0 24 24' fill='currentColor'>
											<path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
										</svg>
									</button>

									{/* WhatsApp Button */}
									<button className='share-btn whatsapp' title='Share to WhatsApp' onClick={handleWhatsAppShare}>
										<svg viewBox='0 0 24 24' fill='currentColor'>
											<path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' />
										</svg>
									</button>

									{/* Copy Link Button */}
									<button
										className={`share-btn copy ${copySuccess ? "copied" : ""}`}
										title={copySuccess ? "Link tersalin!" : "Salin Link"}
										onClick={handleCopyLink}
									>
										{copySuccess ? (
											<svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
											</svg>
										) : (
											<svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
												/>
											</svg>
										)}
									</button>
								</div>
								{copySuccess && <p className='copy-success-message'>✓ Link berhasil disalin!</p>}
							</div>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
};

export default KegiatanDetailPage;
