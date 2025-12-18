using FinalYearAPI.Data;
using FinalYearAPI.Entities;
using FinalYearAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinalYearAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PdfController : ControllerBase
{
    private readonly PdfService _pdfService;
    private readonly AppDbContext _context;

    public PdfController(PdfService pdfService, AppDbContext context)
    {
        _pdfService = pdfService;
        _context = context;
    }

    [HttpGet("list")]
    [Authorize]
    public async Task<IActionResult> List()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var pdfs = await _pdfService.GetPdfsForUserAsync(user);
        return Ok(pdfs.Select(p => new { p.Filename, p.Size, p.UploadedAt, Uploader = p.UploadedBy?.Name }));
    }

    [HttpGet("{filename}/metadata")]
    public async Task<IActionResult> GetMetadata(string filename)
    {
        var pdf = await _pdfService.GetPdfByFilenameAsync(filename);
        if (pdf == null) return NotFound();
        return Ok(new { pdf.Filename, pdf.Size, pdf.UploadedAt, Uploader = pdf.UploadedBy?.Name });
    }

    [HttpGet("{filename}/download")]
    public IActionResult Download(string filename)
    {
        var path = _pdfService.GetPdfPath(filename);
        if (!System.IO.File.Exists(path)) return NotFound();
        
        var bytes = System.IO.File.ReadAllBytes(path);
        return File(bytes, "application/pdf", filename);
    }
}

[Route("api/staff")]
[ApiController]
[Authorize(Roles = "Staff,Admin")]
public class StaffController : ControllerBase
{
    private readonly PdfService _pdfService;
    private readonly AppDbContext _context;
    private readonly IndexService _indexService; // We'll implement this next

    public StaffController(PdfService pdfService, AppDbContext context, IndexService indexService)
    {
        _pdfService = pdfService;
        _context = context;
        _indexService = indexService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded");
        if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)) return BadRequest("Only PDFs allowed");

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var user = await _context.Users.FindAsync(userId);
        
        if (user == null) return Unauthorized();

        var pdf = await _pdfService.UploadPdfAsync(file, user);
        
        // Trigger background index rebuild (fire and forget or queue)
        _ = Task.Run(() => _indexService.TriggerRebuildAsync());

        return Ok(new { message = "Upload successful", filename = pdf.Filename });
    }

    [HttpDelete("delete/{filename}")]
    public async Task<IActionResult> Delete(string filename)
    {
        var success = await _pdfService.DeletePdfAsync(filename);
        if (!success) return NotFound();
        
        _ = Task.Run(() => _indexService.TriggerRebuildAsync());
        
        return Ok(new { message = "Deleted successfully" });
    }
    
    [HttpPut("rename")]
    public async Task<IActionResult> Rename([FromBody] RenameDto dto)
    {
        var success = await _pdfService.RenamePdfAsync(dto.OldName, dto.NewName);
        if (!success) return BadRequest("Rename failed (file not found or target exists)");
        
        _ = Task.Run(() => _indexService.TriggerRebuildAsync());
        
        return Ok(new { message = "Renamed successfully" });
    }
}

public class RenameDto
{
    public string OldName { get; set; } = string.Empty;
    public string NewName { get; set; } = string.Empty;
}
