using FinalYearAPI.Data;
using FinalYearAPI.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinalYearAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _context;

    public ChatController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var sessions = await _context.ChatSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        return Ok(sessions);
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var session = new ChatSession
        {
            UserId = userId,
            Title = request.Title ?? "New Chat"
        };

        _context.ChatSessions.Add(session);
        await _context.SaveChangesAsync();
        return Ok(session);
    }

    [HttpPut("sessions/{id}")]
    public async Task<IActionResult> RenameSession(int id, [FromBody] RenameSessionRequest request)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var session = await _context.ChatSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        
        if (session == null) return NotFound();

        session.Title = request.Title;
        await _context.SaveChangesAsync();
        return Ok(session);
    }

    [HttpDelete("sessions/{id}")]
    public async Task<IActionResult> DeleteSession(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var session = await _context.ChatSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        
        if (session == null) return NotFound();

        _context.ChatSessions.Remove(session);
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("sessions/{id}/messages")]
    public async Task<IActionResult> GetMessages(int id)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var session = await _context.ChatSessions.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
        
        if (session == null) return NotFound();

        var messages = await _context.ChatMessages
            .Where(m => m.SessionId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
            
        return Ok(messages);
    }
}

public class CreateSessionRequest
{
    public string? Title { get; set; }
}

public class RenameSessionRequest
{
    public string Title { get; set; } = string.Empty;
}
