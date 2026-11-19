using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "m_category",
                columns: table => new
                {
                    Id = table.Column<long>(type: "NUMBER(19)", nullable: false)
                        .Annotation("Oracle:Identity", "START WITH 1 INCREMENT BY 1"),
                    Name = table.Column<string>(type: "NVARCHAR2(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "NVARCHAR2(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_m_category", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "m_user",
                columns: table => new
                {
                    Id = table.Column<long>(type: "NUMBER(19)", nullable: false)
                        .Annotation("Oracle:Identity", "START WITH 1 INCREMENT BY 1"),
                    Username = table.Column<string>(type: "NVARCHAR2(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "NVARCHAR2(150)", maxLength: 150, nullable: false),
                    PasswordHash = table.Column<string>(type: "NVARCHAR2(500)", maxLength: 500, nullable: false),
                    FullName = table.Column<string>(type: "NVARCHAR2(200)", maxLength: 200, nullable: false),
                    Role = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    IsActive = table.Column<bool>(type: "BOOLEAN", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_m_user", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "r_stock_summary",
                columns: table => new
                {
                    Id = table.Column<long>(type: "NUMBER(19)", nullable: false)
                        .Annotation("Oracle:Identity", "START WITH 1 INCREMENT BY 1"),
                    ReportDate = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: false),
                    ProductId = table.Column<long>(type: "NUMBER(19)", nullable: false),
                    ProductSku = table.Column<string>(type: "NVARCHAR2(64)", maxLength: 64, nullable: false),
                    ProductName = table.Column<string>(type: "NVARCHAR2(255)", maxLength: 255, nullable: false),
                    CategoryName = table.Column<string>(type: "NVARCHAR2(150)", maxLength: 150, nullable: false),
                    OpeningStock = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    TotalIn = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    TotalOut = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    ClosingStock = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "DECIMAL(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalStockValue = table.Column<decimal>(type: "DECIMAL(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_r_stock_summary", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "m_product",
                columns: table => new
                {
                    Id = table.Column<long>(type: "NUMBER(19)", nullable: false)
                        .Annotation("Oracle:Identity", "START WITH 1 INCREMENT BY 1"),
                    Sku = table.Column<string>(type: "NVARCHAR2(64)", maxLength: 64, nullable: false),
                    Name = table.Column<string>(type: "NVARCHAR2(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "NVARCHAR2(1000)", maxLength: 1000, nullable: true),
                    Price = table.Column<decimal>(type: "DECIMAL(18,2)", precision: 18, scale: 2, nullable: false),
                    StockQuantity = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    MinStockLevel = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    CategoryId = table.Column<long>(type: "NUMBER(19)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_m_product", x => x.Id);
                    table.ForeignKey(
                        name: "FK_m_product_m_category_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "m_category",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "t_stock_movement",
                columns: table => new
                {
                    Id = table.Column<long>(type: "NUMBER(19)", nullable: false)
                        .Annotation("Oracle:Identity", "START WITH 1 INCREMENT BY 1"),
                    ProductId = table.Column<long>(type: "NUMBER(19)", nullable: false),
                    Type = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    Quantity = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    StockBefore = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    StockAfter = table.Column<int>(type: "NUMBER(10)", nullable: false),
                    Reason = table.Column<string>(type: "NVARCHAR2(255)", maxLength: 255, nullable: true),
                    ReferenceNumber = table.Column<string>(type: "NVARCHAR2(100)", maxLength: 100, nullable: true),
                    UserId = table.Column<long>(type: "NUMBER(19)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TIMESTAMP(7)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_t_stock_movement", x => x.Id);
                    table.ForeignKey(
                        name: "FK_t_stock_movement_m_product_ProductId",
                        column: x => x.ProductId,
                        principalTable: "m_product",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_t_stock_movement_m_user_UserId",
                        column: x => x.UserId,
                        principalTable: "m_user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_m_product_CategoryId",
                table: "m_product",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_m_product_Sku",
                table: "m_product",
                column: "Sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_m_user_Username",
                table: "m_user",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_t_stock_movement_ProductId",
                table: "t_stock_movement",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_t_stock_movement_UserId",
                table: "t_stock_movement",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "r_stock_summary");

            migrationBuilder.DropTable(
                name: "t_stock_movement");

            migrationBuilder.DropTable(
                name: "m_product");

            migrationBuilder.DropTable(
                name: "m_user");

            migrationBuilder.DropTable(
                name: "m_category");
        }
    }
}
