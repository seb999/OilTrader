using Microsoft.EntityFrameworkCore;

namespace OilTrader.Model
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public virtual DbSet<Intraday> Intraday { get; set; }
    }
}