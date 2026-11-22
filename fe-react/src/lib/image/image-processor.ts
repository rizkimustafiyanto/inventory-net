/**
 * Utility for client-side image processing & conversion to WebP format.
 * Provides high-performance, event-ready compression using HTML5 Canvas API.
 * Drastically reduces file sizes (up to 70-95% smaller) while preserving clarity.
 */

export interface ImageProcessorOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0.1 to 1.0 (default: 0.8)
  mimeType?: "image/webp" | "image/jpeg" | "image/png"
}

export interface ProcessedImageResult {
  file: File
  dataUrl: string
  originalSize: number
  compressedSize: number
  originalFormattedSize: string
  compressedFormattedSize: string
  savingsPercent: number
  width: number
  height: number
  mimeType: string
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Converts any image file to a compressed WebP File & base64 preview.
 */
export async function convertToWebP(
  file: File,
  options: ImageProcessorOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.82,
    mimeType = "image/webp",
  } = options

  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return reject(new Error("File yang dipilih bukan merupakan berkas gambar."))
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Calculate scaled dimensions while preserving aspect ratio
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Draw onto offscreen canvas
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        return reject(new Error("Gagal menginisialisasi Canvas 2D context."))
      }

      // High quality image smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, width, height)

      // Convert canvas to WebP blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error("Konversi gambar ke WebP gagal."))
          }

          // Generate file name with .webp extension
          const originalName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
          const webpFileName = `${originalName}.webp`
          const webpFile = new File([blob], webpFileName, { type: mimeType })

          const dataUrl = canvas.toDataURL(mimeType, quality)
          const originalSize = file.size
          const compressedSize = blob.size
          const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))

          resolve({
            file: webpFile,
            dataUrl,
            originalSize,
            compressedSize,
            originalFormattedSize: formatBytes(originalSize),
            compressedFormattedSize: formatBytes(compressedSize),
            savingsPercent: savings,
            width,
            height,
            mimeType,
          })
        },
        mimeType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Gagal membaca berkas gambar. Pastikan format gambar valid."))
    }

    img.src = objectUrl
  })
}
