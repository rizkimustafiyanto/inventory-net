"use client"

import { useState, useRef, useCallback } from "react"
import { convertToWebP, type ProcessedImageResult, type ImageProcessorOptions } from "./image-processor"

export interface UseImageUploaderOptions extends ImageProcessorOptions {
  maxOriginalSizeBytes?: number // default: 10MB
  onSelect?: (file: File) => void
  onConvertingStart?: () => void
  onSuccess?: (result: ProcessedImageResult) => void
  onError?: (errorMessage: string) => void
}

export function useImageUploader(options: UseImageUploaderOptions = {}) {
  const {
    maxOriginalSizeBytes = 10 * 1024 * 1024, // 10 MB limit
    onSelect,
    onConvertingStart,
    onSuccess,
    onError,
    ...processorOptions
  } = options

  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ProcessedImageResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)

      if (!file.type.startsWith("image/")) {
        const msg = "Format berkas tidak didukung. Harap pilih gambar (JPG, PNG, WebP, GIF)."
        setError(msg)
        onError?.(msg)
        return
      }

      if (file.size > maxOriginalSizeBytes) {
        const msg = `Ukuran file terlalu besar. Maksimal ${Math.round(maxOriginalSizeBytes / (1024 * 1024))} MB.`
        setError(msg)
        onError?.(msg)
        return
      }

      onSelect?.(file)
      setIsProcessing(true)
      onConvertingStart?.()

      try {
        const processed = await convertToWebP(file, processorOptions)
        setResult(processed)
        setPreviewUrl(processed.dataUrl)
        setIsProcessing(false)
        onSuccess?.(processed)
      } catch (err: unknown) {
        setIsProcessing(false)
        const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengonversi gambar."
        setError(errMsg)
        onError?.(errMsg)
      }
    },
    [maxOriginalSizeBytes, onSelect, onConvertingStart, onSuccess, onError, processorOptions]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
      // Reset input value so re-selecting the same file fires onChange
      if (e.target) {
        e.target.value = ""
      }
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const triggerPicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setPreviewUrl(null)
    setError(null)
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return {
    fileInputRef,
    isProcessing,
    previewUrl,
    result,
    error,
    processFile,
    handleFileChange,
    handleDrop,
    handleDragOver,
    triggerPicker,
    reset,
    setPreviewUrl,
  }
}
