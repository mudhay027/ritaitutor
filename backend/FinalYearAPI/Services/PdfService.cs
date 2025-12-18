using FinalYearAPI.Data;
using FinalYearAPI.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinalYearAPI.Services;

public class PdfService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly string _pdfStoragePath;

    public PdfService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
        
        var dataDir = Environment.GetEnvironmentVariable("INDEXER_DATA_DIR");
        
        if (string.IsNullOrEmpty(dataDir))
        {
            // Try to find the indexer/data folder relative to the backend
            // We are in backend/FinalYearAPI, we want ../../indexer/data
            var current = Directory.GetCurrentDirectory();
            var relativePath = Path.Combine(current, "..", "..", "indexer", "data");
            var absolutePath = Path.GetFullPath(relativePath);
            
            if (Directory.Exists(absolutePath))
            {
                dataDir = absolutePath;
            }
            else
            {
                dataDir = "data"; // Fallback
            }
        }

        _pdfStoragePath = Path.Combine(dataDir, "staff_pdfs");
        
        if (!Directory.Exists(_pdfStoragePath))
        {
            Directory.CreateDirectory(_pdfStoragePath);
        }
        
        Console.WriteLine($"[PdfService] Storing PDFs in: {_pdfStoragePath}");
    }

    public async Task<List<Pdf>> GetAllPdfsAsync()
    {
        return await _context.Pdfs.Include(p => p.UploadedBy).ToListAsync();
    }

    public async Task<List<Pdf>> GetPdfsForUserAsync(User user)
    {
        if (user.Role == "Staff")
        {
            return await _context.Pdfs
                .Include(p => p.UploadedBy)
                .Where(p => p.UploadedById == user.Id)
                .ToListAsync();
        }
        else if (user.Role == "Student")
        {
            if (string.IsNullOrEmpty(user.LinkedStaffCode)) return new List<Pdf>();

            var staff = await _context.Users.FirstOrDefaultAsync(u => u.StaffCode == user.LinkedStaffCode && u.Role == "Staff");
            if (staff == null) return new List<Pdf>();

            return await _context.Pdfs
                .Include(p => p.UploadedBy)
                .Where(p => p.UploadedById == staff.Id)
                .ToListAsync();
        }
        
        return new List<Pdf>();
    }

    public async Task<Pdf?> GetPdfAsync(int id)
    {
        return await _context.Pdfs.FindAsync(id);
    }
    
    public async Task<Pdf?> GetPdfByFilenameAsync(string filename)
    {
        return await _context.Pdfs.FirstOrDefaultAsync(p => p.Filename == filename);
    }

    public async Task<Pdf> UploadPdfAsync(IFormFile file, User uploader)
    {
        var filename = Path.GetFileName(file.FileName);
        var filePath = Path.Combine(_pdfStoragePath, filename);

        // Ensure unique filename if needed, but for now overwrite or error
        if (File.Exists(filePath))
        {
            // Simple overwrite logic as per requirements (or maybe we should error)
            // Requirement says "Allow staff to upload, rename, delete". 
            // Let's overwrite file but update DB record
        }

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var pdf = await _context.Pdfs.FirstOrDefaultAsync(p => p.Filename == filename);
        if (pdf == null)
        {
            pdf = new Pdf
            {
                Filename = filename,
                StoredPath = filePath,
                Size = file.Length,
                UploadedById = uploader.Id,
                UploadedAt = DateTime.UtcNow
            };
            _context.Pdfs.Add(pdf);
        }
        else
        {
            pdf.Size = file.Length;
            pdf.UploadedAt = DateTime.UtcNow;
            pdf.UploadedById = uploader.Id;
            _context.Pdfs.Update(pdf);
        }

        await _context.SaveChangesAsync();
        return pdf;
    }

    public async Task<bool> DeletePdfAsync(string filename)
    {
        var pdf = await _context.Pdfs.FirstOrDefaultAsync(p => p.Filename == filename);
        if (pdf == null) return false;

        var filePath = Path.Combine(_pdfStoragePath, filename);
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }

        _context.Pdfs.Remove(pdf);
        await _context.SaveChangesAsync();
        return true;
    }
    
    public async Task<bool> RenamePdfAsync(string oldName, string newName)
    {
        var pdf = await _context.Pdfs.FirstOrDefaultAsync(p => p.Filename == oldName);
        if (pdf == null) return false;
        
        var oldPath = Path.Combine(_pdfStoragePath, oldName);
        var newPath = Path.Combine(_pdfStoragePath, newName);
        
        if (File.Exists(newPath)) return false; // Target exists
        
        if (File.Exists(oldPath))
        {
            File.Move(oldPath, newPath);
        }
        
        pdf.Filename = newName;
        pdf.StoredPath = newPath;
        await _context.SaveChangesAsync();
        return true;
    }
    
    public string GetPdfPath(string filename)
    {
        return Path.Combine(_pdfStoragePath, filename);
    }
}
