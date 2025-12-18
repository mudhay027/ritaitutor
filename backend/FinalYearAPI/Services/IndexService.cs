using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FinalYearAPI.Services;

public class IndexService
{
    private readonly HttpClient _httpClient;
    private readonly string _indexerUrl;

    public IndexService(IConfiguration configuration)
    {
        _httpClient = new HttpClient();
        _indexerUrl = configuration["Indexer:BaseUrl"] ?? "http://localhost:8001";
    }

    public async Task TriggerRebuildAsync()
    {
        try
        {
            var response = await _httpClient.PostAsync($"{_indexerUrl}/rebuild", null);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error triggering rebuild: {e.Message}");
        }
    }

    public async Task<IndexStatus> GetStatusAsync()
    {
        try
        {
            var response = await _httpClient.GetStringAsync($"{_indexerUrl}/status");
            return JsonSerializer.Deserialize<IndexStatus>(response, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new IndexStatus();
        }
        catch
        {
            return new IndexStatus { IndexExists = false, ChunkCount = 0 };
        }
    }

    public async Task<List<RetrieveResult>> RetrieveAsync(string query, int topK, string? activePdf)
    {
        try
        {
            Console.WriteLine($"[IndexService] Retrieving chunks for query: {query}");
            Console.WriteLine($"[IndexService] Indexer URL: {_indexerUrl}");
            
            var request = new { query, top_k = topK, active_pdf = activePdf };
            var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PostAsync($"{_indexerUrl}/retrieve", content);
            
            Console.WriteLine($"[IndexService] Response status: {response.StatusCode}");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[IndexService] Error response: {errorBody}");
                return new List<RetrieveResult>();
            }
            
            var json = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[IndexService] Response: {json.Substring(0, Math.Min(200, json.Length))}...");
            
            var result = JsonSerializer.Deserialize<RetrieveResponse>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            Console.WriteLine($"[IndexService] Deserialized {result?.Results?.Count ?? 0} results");
            
            return result?.Results ?? new List<RetrieveResult>();
        }
        catch (HttpRequestException e)
        {
            Console.WriteLine($"[IndexService] HTTP Error: {e.Message}");
            Console.WriteLine($"[IndexService] Is indexer running on {_indexerUrl}?");
            return new List<RetrieveResult>();
        }
        catch (Exception e)
        {
            Console.WriteLine($"[IndexService] Error retrieving chunks: {e.Message}");
            Console.WriteLine($"[IndexService] Stack trace: {e.StackTrace}");
            return new List<RetrieveResult>();
        }
    }
}

public class IndexStatus
{
    public bool IndexExists { get; set; }
    public int ChunkCount { get; set; }
    public int MetadataCount { get; set; }
}

public class RetrieveResponse
{
    public List<RetrieveResult> Results { get; set; } = new();
}

public class RetrieveResult
{
    [JsonPropertyName("pdf_name")]
    public string PdfName { get; set; } = string.Empty;
    
    [JsonPropertyName("chunk_id")]
    public string ChunkId { get; set; } = string.Empty;
    
    [JsonPropertyName("score")]
    public float Score { get; set; }

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}
