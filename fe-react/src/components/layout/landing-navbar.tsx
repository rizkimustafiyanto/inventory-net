"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Boxes,
  ArrowRight,
  Menu,
  X,
  Layers,
  Server,
  ShieldCheck,
  Database,
  LogIn,
} from "lucide-react"
import { Button } from "@/components/ui"

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const navLinks = [
    { label: "Fitur Utama", href: "#features", icon: Layers },
    { label: "Arsitektur", href: "#architecture", icon: Server },
    { label: "Role & Hak Akses", href: "#roles", icon: ShieldCheck },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none">
            <Boxes className="size-6" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              InventoryNet
            </span>
            <span className="ml-2 hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 sm:inline dark:bg-indigo-950 dark:text-indigo-300">
              .NET 8 & Next.js
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (md and above) */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {link.label}
            </a>
          ))}
          <a
            href="http://localhost:8080/swagger"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <span>API Swagger</span>
            <span className="text-xs">↗</span>
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="hidden sm:inline-flex">
            <Button rightIcon={<ArrowRight className="size-4" />}>
              Masuk ke Sistem
            </Button>
          </Link>

          <Link href="/login" className="sm:hidden">
            <Button size="sm" rightIcon={<ArrowRight className="size-3.5" />}>
              Masuk
            </Button>
          </Link>

          {/* Mobile Hamburger Menu Toggle Button (< md) */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            title={isOpen ? "Tutup Menu" : "Buka Menu"}
            icon={isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          />
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 top-16 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="relative border-b border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-200 dark:border-slate-800 dark:bg-slate-900/95">
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Navigasi Halaman
            </div>
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                  >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Icon className="size-4" />
                    </div>
                    <span>{link.label}</span>
                  </a>
                )
              })}

              <a
                href="http://localhost:8080/swagger"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Database className="size-4" />
                  </div>
                  <span>Dokumentasi API Swagger</span>
                </div>
                <span className="text-xs text-slate-400">↗</span>
              </a>
            </nav>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button className="w-full py-2.5 text-sm font-semibold" rightIcon={<LogIn className="size-4" />}>
                  Masuk ke Dashboard Sistem
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
