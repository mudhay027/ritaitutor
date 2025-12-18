using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinalYearAPI.Entities;

public class ChatMessage
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SessionId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "User"; // User or Assistant

    [Required]
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("SessionId")]
    public ChatSession? Session { get; set; }
}
