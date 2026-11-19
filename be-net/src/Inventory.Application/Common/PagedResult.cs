namespace Inventory.Application.Common;

public class PaginationMeta
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = new List<T>();
    public PaginationMeta Meta { get; set; } = new();

    // Direct accessors for backward-compatibility and convenience
    public int TotalCount => Meta.TotalCount;
    public int PageNumber => Meta.PageNumber;
    public int PageSize => Meta.PageSize;
    public int TotalPages => Meta.TotalPages;
    public bool HasPreviousPage => Meta.HasPreviousPage;
    public bool HasNextPage => Meta.HasNextPage;

    public PagedResult() { }

    public PagedResult(IReadOnlyList<T> items, int totalCount, int pageNumber, int pageSize)
    {
        Items = items;
        int totalPages = (int)Math.Ceiling((double)totalCount / (pageSize > 0 ? pageSize : 10));
        Meta = new PaginationMeta
        {
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }
}
