using BCrypt.Net;
using FinalYearAPI.Data;
using FinalYearAPI.DTOs;
using FinalYearAPI.Entities;
using FinalYearAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinalYearAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;

    public AuthController(AppDbContext context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            return BadRequest("Email already exists");
        }

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role // In prod, validate role or force Student
        };

        if (dto.Role == "Staff")
        {
            if (string.IsNullOrWhiteSpace(dto.StaffCode) || dto.StaffCode.Length != 6)
            {
                return BadRequest("Staff must provide a valid 6-digit Staff Code.");
            }

            if (await _context.Users.AnyAsync(u => u.StaffCode == dto.StaffCode))
            {
                return BadRequest("This Staff Code is already taken.");
            }

            user.StaffCode = dto.StaffCode;
        }
        else if (dto.Role == "Student")
        {
            if (string.IsNullOrWhiteSpace(dto.StaffCode))
            {
                return BadRequest("Students must provide a Staff Code to register.");
            }

            var staff = await _context.Users.FirstOrDefaultAsync(u => u.StaffCode == dto.StaffCode && u.Role == "Staff");
            if (staff == null)
            {
                return BadRequest("Invalid Staff Code. Please check with your teacher.");
            }

            user.LinkedStaffCode = dto.StaffCode;
        }

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User registered successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid credentials");
        }

        var token = _jwtService.GenerateToken(user);
        return Ok(new { token, user = new { user.Id, user.Name, user.Email, user.Role } });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _context.Users.FindAsync(userId);
        
        if (user == null) return NotFound();
        
        return Ok(new { user.Id, user.Name, user.Email, user.Role });
    }
}
