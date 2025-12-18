using FinalYearAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using FinalYearAPI.Data;
using Microsoft.EntityFrameworkCore;

using FinalYearAPI.Entities;

namespace FinalYearAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IndexService _indexService;
    private readonly GeminiService _geminiService;
    private readonly PdfService _pdfService;

    public AiController(IndexService indexService, GeminiService geminiService, PdfService pdfService, AppDbContext context)
    {
        _indexService = indexService;
        _geminiService = geminiService;
        _pdfService = pdfService;
        _context = context;
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] AskRequest request)
    {
        try
        {
            // Parse marks from question if present (e.g., "for 10 marks")
            int marks = 5; // Default
            var marksMatch = Regex.Match(request.Question, @"(\d+)\s*marks?", RegexOptions.IgnoreCase);
            if (marksMatch.Success)
            {
                int.TryParse(marksMatch.Groups[1].Value, out marks);
            }

            Console.WriteLine($"[DEBUG] Received question: {request.Question}");
            Console.WriteLine($"[DEBUG] Active PDF: {request.ActivePdf}");
            Console.WriteLine($"[DEBUG] Parsed Marks: {marks}");
            
            // 1. Retrieve relevant chunks
            var chunks = await _indexService.RetrieveAsync(request.Question, 10, request.ActivePdf);
            
            if (chunks.Count == 0)
            {
                var noContentAnswer = "No relevant content found in the selected PDF(s). Try selecting 'All PDFs' or rephrasing.";
                
                // Save to Database if SessionId is provided
                if (request.SessionId.HasValue)
                {
                    var userMsg = new ChatMessage { SessionId = request.SessionId.Value, Role = "User", Content = request.Question };
                    var botMsg = new ChatMessage { SessionId = request.SessionId.Value, Role = "Assistant", Content = noContentAnswer };
                    
                    _context.ChatMessages.AddRange(userMsg, botMsg);
                    await _context.SaveChangesAsync();
                }

                return Ok(new 
                { 
                    answer = noContentAnswer,
                    source = new List<string>(),
                    used_chunks = new List<object>()
                });
            }

            // 2. Build Context
            var contextBuilder = new System.Text.StringBuilder();
            var sourcePdfs = new HashSet<string>();
            
            foreach (var chunk in chunks)
            {
                var text = chunk.Text;
                if (string.IsNullOrEmpty(text)) text = "[Content missing]";
                
                contextBuilder.AppendLine($"--- Source: {chunk.PdfName} ---");
                contextBuilder.AppendLine(text);
                contextBuilder.AppendLine();
                sourcePdfs.Add(chunk.PdfName);
            }

            var context = contextBuilder.ToString();
            if (context.Length > 20000) context = context.Substring(0, 20000); // Increased limit

            // 3. Fetch History
            var historyBuilder = new System.Text.StringBuilder();
            if (request.SessionId.HasValue)
            {
                var lastMessages = await _context.ChatMessages
                    .Where(m => m.SessionId == request.SessionId.Value)
                    .OrderByDescending(m => m.CreatedAt)
                    .Take(6)
                    .OrderBy(m => m.CreatedAt)
                    .ToListAsync();

                foreach (var msg in lastMessages)
                {
                    historyBuilder.AppendLine($"{msg.Role}: {msg.Content}");
                }
            }

            // 4. Construct Prompt
            var prompt = $@"
You are a strict AI tutor. You must answer the question ONLY using the provided context (staff-provided notes). 

Rules:
1. STRICTLY use the provided context. Do NOT use outside knowledge.
2. If the answer is not in the context, explicitly say: ""I am sorry, but the provided context does not contain information about [topic]. Therefore, I cannot explain it.""
3. Do not make up information.
4. If the user asks for 'important questions' or a list, generate them based ONLY on the key concepts in the context.
5. Target length: {marks} marks (approx {marks * 20} words).

Context:
{context}

Conversation History:
{historyBuilder}

Current Question: {request.Question}

Answer:
";

            // 4. Generate Answer
            var answer = await _geminiService.GenerateContentAsync(prompt);

            // 5. Save to Database if SessionId is provided
            if (request.SessionId.HasValue)
            {
                var userMsg = new ChatMessage { SessionId = request.SessionId.Value, Role = "User", Content = request.Question };
                var botMsg = new ChatMessage { SessionId = request.SessionId.Value, Role = "Assistant", Content = answer };
                
                _context.ChatMessages.AddRange(userMsg, botMsg);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                answer,
                source = sourcePdfs.OrderBy(x => x).ToList(),
                used_chunks = chunks
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Exception in Ask endpoint: {ex.Message}");
            return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
        }
    }

    [HttpPost("modify")]
    public async Task<IActionResult> Modify([FromBody] ModifyRequest request)
    {
        var prompt = $@"
You are an AI tutor. You must follow the user’s editing request
but strictly use the original staff-provided answer context if needed.

Original Answer:
{request.PreviousAnswer}

User Request: {request.Request} (e.g. shorten, simplify, add example)

Revised Answer:
";
        var answer = await _geminiService.GenerateContentAsync(prompt);
        return Ok(new { answer });
    }
}

public class AskRequest
{
    public string Question { get; set; } = string.Empty;
    public string? ActivePdf { get; set; }
    public int? SessionId { get; set; }
}

public class ModifyRequest
{
    public string Request { get; set; } = string.Empty;
    public string PreviousAnswer { get; set; } = string.Empty;
}
