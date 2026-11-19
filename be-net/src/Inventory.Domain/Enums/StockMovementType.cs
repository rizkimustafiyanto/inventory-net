namespace Inventory.Domain.Enums;

public enum StockMovementType
{
    In = 1,          // Barang Masuk (Purchase / Restock)
    Out = 2,         // Barang Keluar (Sales / Usage)
    Adjustment = 3   // Koreksi Stok (Opname / Rusak / Selisih)
}
