"use client"

import * as React from "react"
import { Camera, Upload, Trash2, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui"
import { useImageUploader, type ProcessedImageResult } from "@/lib/image"
import { cn } from "@/lib/utils"

export interface ImageUploaderProps {
  currentImageUrl?: string | null
  onImageUploaded?: (result: ProcessedImageResult) => void
  onImageRemoved?: () => void
  variant?: "avatar" | "box"
  size?: "sm" | "md" | "lg"
  fallbackName?: string
  className?: string
  disabled?: boolean
}

export function ImageUploader({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  variant = "avatar",
  size = "md",
  fallbackName = "User",
  className,
  disabled = false,
}: ImageUploaderProps) {
  const {
    fileInputRef,
    isProcessing,
    previewUrl,
    result,
    handleFileChange,
    handleDrop,
    handleDragOver,
    triggerPicker,
    reset,
    setPreviewUrl,
  } = useImageUploader({
    maxWidth: variant === "avatar" ? 384 : 800,
    maxHeight: variant === "avatar" ? 384 : 800,
    quality: 0.82,
    onSuccess: (res) => {
      onImageUploaded?.(res)
    },
  })

  // Synchronize initial external image URL
  React.useEffect(() => {
    if (currentImageUrl) {
      setPreviewUrl(currentImageUrl)
    }
  }, [currentImageUrl, setPreviewUrl])

  const activeImage = previewUrl || currentImageUrl

  const sizeClasses = {
    avatar: {
      sm: "size-16 text-lg",
      md: "size-24 text-2xl",
      lg: "size-32 text-4xl",
    },
    box: {
      sm: "h-24 w-32",
      md: "h-36 w-48",
      lg: "h-48 w-full",
    },
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    reset()
    onImageRemoved?.()
  }

  const initials = fallbackName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Zone */}
      <div
        onClick={() => !disabled && !isProcessing && triggerPicker()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "group relative flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-primary hover:bg-slate-100/80 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary dark:hover:bg-slate-800",
          variant === "avatar" ? "rounded-full" : "rounded-2xl",
          sizeClasses[variant][size],
          disabled && "cursor-not-allowed opacity-60 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage}
            alt="Preview"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            {variant === "avatar" ? (
              <span className="font-bold text-slate-400 dark:text-slate-500">
                {initials || <Camera className="size-8" />}
              </span>
            ) : (
              <div className="flex flex-col items-center gap-1 p-4 text-center">
                <Upload className="size-6 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">Pilih atau Seret Foto</span>
              </div>
            )}
          </div>
        )}

        {/* Hover Overlay */}
        {!disabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {isProcessing ? (
              <RefreshCw className="size-6 animate-spin text-white" />
            ) : (
              <>
                <Camera className="size-6 text-white" />
                <span className="mt-1 text-[10px] font-semibold text-white">Ganti Foto</span>
              </>
            )}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-1 text-white">
              <RefreshCw className="size-6 animate-spin" />
              <span className="text-[10px] font-medium">Mengonversi WebP...</span>
            </div>
          </div>
        )}
      </div>

      {/* Conversion stats badge */}
      {result && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 shadow-2xs dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-400 animate-in fade-in">
          <Check className="size-3" />
          <span>
            WebP: {result.compressedFormattedSize}{" "}
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">
              ({result.savingsPercent}% lebih hemat)
            </span>
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => triggerPicker()}
          disabled={disabled || isProcessing}
          leftIcon={<Upload className="size-3.5" />}
        >
          {activeImage ? "Ganti Foto" : "Unggah Foto"}
        </Button>

        {activeImage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isProcessing}
            leftIcon={<Trash2 className="size-3.5" />}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            Hapus
          </Button>
        )}
      </div>
    </div>
  )
}
