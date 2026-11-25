import Link from "next/link"
import {
  ArrowRight,
  Layers,
  BarChart3,
  Server,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import { Button, Card } from "@/components/ui"
import { LandingNavbar } from "@/components/layout"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Responsive Navbar with Mobile Drawer */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            Production Ready Fullstack Architecture • Oracle Database
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl dark:text-white">
            Kelola Stok Gudang & Nilai Aset Secara{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
              Presisi & Real-Time
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Sistem manajemen inventaris enterprise dengan pemisahan tegas tanggung jawab:{" "}
            <strong>Clean Architecture .NET 8</strong> di backend, <strong>Oracle Database</strong>{" "}
            berbasis konvensi tabel <code>m_</code>, <code>t_</code>, <code>r_</code>, serta frontend modular{" "}
            <strong>Next.js 16 (App Router)</strong>.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                rightIcon={<ArrowRight className="size-5" />}
                className="h-12 px-6 text-base font-semibold shadow-lg shadow-indigo-500/20"
              >
                Coba Aplikasi Sekarang
              </Button>
            </Link>
            <a href="http://localhost:8080/swagger" target="_blank" rel="noreferrer">
              <Button
                size="lg"
                variant="outline"
                leftIcon={<Server className="size-5 text-indigo-600 dark:text-indigo-400" />}
                className="h-12 px-6 text-base font-semibold"
              >
                Dokumentasi Swagger API
              </Button>
            </a>
          </div>

          {/* Live Service Status Indicator */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3.5 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Backend: .NET 8 (Port 8080)</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3.5 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Database: Oracle Free (Port 1521)</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3.5 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Frontend: Next.js 16 (Port 3000)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="border-t border-slate-200 bg-white px-4 py-20 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Kapabilitas Sistem
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-950 sm:text-4xl dark:text-white">
              Struktur Database Teratur Sesuai Konvensi
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
              Setiap tabel dikelompokkan secara ketat menggunakan awalan <code>m_</code> (Master), <code>t_</code> (Transaction), dan <code>r_</code> (Report).
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Master */}
            <Card className="rounded-3xl border-slate-200 p-8 shadow-xs dark:border-slate-800">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Layers className="size-6" />
              </div>
              <div className="mt-6">
                <span className="rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  m_ Master Tables
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">
                  Katalog, Kategori & Akun
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Pengelolaan terpusat tabel <code>m_product</code>, <code>m_category</code>, dan <code>m_user</code> dengan SKU unik, batas minimum stok, dan validasi data.
                </p>
              </div>
            </Card>

            {/* Card 2: Transaction */}
            <Card className="rounded-3xl border-slate-200 p-8 shadow-xs dark:border-slate-800">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <TrendingUp className="size-6" />
              </div>
              <div className="mt-6">
                <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-mono font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  t_ Transaction Tables
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">
                  Mutasi Stok & Audit Trail
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Tabel <code>t_stock_movement</code> mencatat setiap perubahan stok fisik (Masuk, Keluar, Koreksi Opname) lengkap dengan saldo sebelum, sesudah, dan identitas petugas.
                </p>
              </div>
            </Card>

            {/* Card 3: Report */}
            <Card className="rounded-3xl border-slate-200 p-8 shadow-xs dark:border-slate-800">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <BarChart3 className="size-6" />
              </div>
              <div className="mt-6">
                <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  r_ Report Tables
                </span>
                <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">
                  Valuasi Aset & Export CSV
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Tabel <code>r_stock_summary</code> menyimpan agregasi nilai aset dalam Rupiah, saldo awal vs akhir, dan siap diekspor instan ke file CSV / Cetak PDF.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Architecture Showcase */}
      <section id="architecture" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Prinsip Desain
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-950 sm:text-4xl dark:text-white">
              Clean Architecture yang Modular & Scalable
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
              Pemisahan tanggung jawab (*Separation of Concerns*) memastikan logika bisnis tidak bergantung pada framework atau database.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Inventory.Domain (Core Kernel)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Berisi entitas murni C# (Product, Category, StockMovement, User, StockReport) dan kontrak interface repository (IRepository, IUnitOfWork). Zero external dependency.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 font-bold text-sky-600">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Inventory.Application (Business Logic)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tempat beradanya kalkulasi stok, validasi pencegahan stok minus, aturan otentikasi, DTOs, dan metadata pagination (has previous, has next, total pages).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 font-bold text-purple-600">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Inventory.Infrastructure (Data & Security)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Implementasi EF Core dengan provider resmi <code>Oracle.EntityFrameworkCore</code>, Generic Repository, UnitOfWork, generator JWT token, dan seeder data awal.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-600">
                4
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Inventory.Api (Presentation / Web)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Thin REST Controllers, JWT Authentication Middleware, Global Exception Handling, CORS policy, dan dokumentasi interaktif Swagger OpenAPI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role & Access Section */}
      <section id="roles" className="border-t border-slate-200 bg-white px-4 py-20 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Multi-User & Hak Akses (RBAC)
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-950 sm:text-4xl dark:text-white">
              Tiga Tingkat Peran Pengguna
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <Card className="rounded-3xl border-slate-200 p-6 shadow-xs dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                  Super Admin
                </span>
              </div>
              <h4 className="mt-4 font-bold text-slate-900 dark:text-white">Administrator</h4>
              <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Akses penuh seluruh modul</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Manajemen akun pengguna (m_user)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Hapus data master (Katalog/Kategori)</span>
                </li>
              </ul>
              <div className="mt-6 rounded-xl bg-slate-50 p-2.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                admin / admin123
              </div>
            </Card>

            <Card className="rounded-3xl border-slate-200 p-6 shadow-xs dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                  Operator Gudang
                </span>
              </div>
              <h4 className="mt-4 font-bold text-slate-900 dark:text-white">Staff Gudang</h4>
              <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Melihat katalog produk & kategori</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Input mutasi Barang Masuk (+)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Input mutasi Barang Keluar & Opname</span>
                </li>
              </ul>
              <div className="mt-6 rounded-xl bg-slate-50 p-2.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                staff / staff123
              </div>
            </Card>

            <Card className="rounded-3xl border-slate-200 p-6 shadow-xs dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                  Supervisor / Auditor
                </span>
              </div>
              <h4 className="mt-4 font-bold text-slate-900 dark:text-white">Manager</h4>
              <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Monitoring ringkasan KPI gudang</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Akses laporan valuasi aset stok</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Export rekapan ke CSV / Cetak</span>
                </li>
              </ul>
              <div className="mt-6 rounded-xl bg-slate-50 p-2.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                manager / manager123
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© 2026 InventoryNet. Fullstack .NET 8 Clean Architecture & Next.js 16 with Oracle Database.</p>
          <div className="mt-3 flex justify-center gap-6">
            <Link href="/login" className="hover:underline">
              Halaman Masuk
            </Link>
            <a href="http://localhost:8080/swagger" target="_blank" rel="noreferrer" className="hover:underline">
              Swagger API
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
