/**
 * Helper untuk handle path_gambar yang bisa berupa:
 * - String biasa: "achievements/foto.jpg"
 * - JSON array string: '["achievements/a.jpg","achievements/b.jpg"]'
 */

export const parseImages = (
  pathGambar: string | null | undefined,
): string[] => {
  if (!pathGambar) return [];
  const trimmed = pathGambar.trim();
  // Cek apakah JSON array
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // bukan JSON valid, treat as string biasa
    }
  }
  return [trimmed];
};

export const getFirstImage = (
  pathGambar: string | null | undefined,
): string => {
  const imgs = parseImages(pathGambar);
  return imgs[0] || "";
};
