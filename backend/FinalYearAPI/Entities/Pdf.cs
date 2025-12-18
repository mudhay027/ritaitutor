using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinalYearAPI.Entities;

public class Pdf
{
    public int Id { get; set; }
    
    [Required]
    public string Filename { get; set; } = string.Empty;
    
    [Required]
    public string StoredPath { get; set; } = string.Empty;
    
    public long Size { get; set; }
    
    public int UploadedById { get; set; }
    
    [ForeignKey("UploadedById")]
    public User? UploadedBy { get; set; }
    
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
