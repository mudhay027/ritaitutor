using System.ComponentModel.DataAnnotations;

namespace FinalYearAPI.Entities;

public class User
{
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    
    [Required]
    public string Role { get; set; } = "Student"; // Student, Staff, Admin
    
    public string? StaffCode { get; set; } // For Staff: The code they share
    public string? LinkedStaffCode { get; set; } // For Students: The code they entered
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
