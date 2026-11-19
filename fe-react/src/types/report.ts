export interface StockReport {
  id: number
  reportDate: string
  productId: number
  productSku: string
  productName: string
  categoryName: string
  openingStock: number
  totalIn: number
  totalOut: number
  closingStock: number
  unitPrice: number
  totalStockValue: number
  createdAt: string
}
