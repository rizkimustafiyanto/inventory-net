namespace Inventory.Domain.Enums;

public enum UserRole
{
    Admin = 1,    // Super Admin (Full access: Master data, Transactions, Reports, User management)
    Staff = 2,    // Staff Gudang / Operator (Operational: Catalog read, Record stock in/out/adjustment)
    Manager = 3   // Manager / Supervisor / Auditor (Analytical: Catalog read, Stock movements read, Reports & valuations)
}
