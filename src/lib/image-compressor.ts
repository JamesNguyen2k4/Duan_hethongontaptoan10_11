/**
 * Nén ảnh bài làm trực tiếp trên trình duyệt của học sinh trước khi gửi lên máy chủ:
 * - Thu nhỏ kích thước tối đa 1400px (đảm bảo từng nét chữ và công thức viết tay vẫn cực kỳ sắc nét)
 * - Nén định dạng image/webp (hoặc jpeg) với chất lượng 0.82
 * - Giảm dung lượng từ 5MB - 10MB (ảnh chụp điện thoại) xuống còn ~100KB - 250KB
 */
export async function nenAnhClient(
  file: File | Blob,
  maxDimension = 1400,
  quality = 0.82
): Promise<{
  base64: string;
  mimeType: string;
  dungLuong: number;
  previewUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Không thể khởi tạo Canvas Context"));
          return;
        }

        // Làm mịn ảnh khi resize
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Thử xuất webp, nếu trình duyệt không hỗ trợ sẽ tự fallback
        let mimeType = "image/webp";
        let base64 = canvas.toDataURL(mimeType, quality);

        if (!base64.startsWith("data:image/webp")) {
          mimeType = "image/jpeg";
          base64 = canvas.toDataURL(mimeType, quality);
        }

        // Tính dung lượng xấp xỉ
        const head = `data:${mimeType};base64,`;
        const strLen = base64.length - head.length;
        const dungLuong = Math.round((strLen * 3) / 4);

        resolve({
          base64,
          mimeType,
          dungLuong,
          previewUrl: base64,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

