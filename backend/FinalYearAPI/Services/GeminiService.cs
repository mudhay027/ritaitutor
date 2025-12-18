using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FinalYearAPI.Services;

public class GeminiService
{
    private readonly string _apiKey;
    private readonly HttpClient _httpClient;
    private const int MaxRetries = 3;

    public GeminiService(IConfiguration configuration)
    {
        _apiKey = configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? "";
        _httpClient = new HttpClient();
    }

    public async Task<string> GenerateContentAsync(string prompt)
    {
        if (string.IsNullOrEmpty(_apiKey)) return "Error: Gemini API Key not configured.";

        // Use gemini-1.5-flash-latest with v1beta endpoint
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={_apiKey}";

        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        for (int retry = 0; retry < MaxRetries; retry++)
        {
            try
            {
                var response = await _httpClient.PostAsync(url, content);
                var json = await response.Content.ReadAsStringAsync();
                
                if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    // Rate limited - wait and retry
                    var waitTime = (retry + 1) * 10; // 10, 20, 30 seconds
                    await Task.Delay(waitTime * 1000);
                    continue;
                }
                
                if (!response.IsSuccessStatusCode)
                {
                    return $"Error from Gemini: {response.StatusCode} - {json}";
                }

                using var doc = JsonDocument.Parse(json);
                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return text ?? "No response generated.";
            }
            catch (Exception e)
            {
                if (retry == MaxRetries - 1)
                    return $"Error calling Gemini: {e.Message}";
                await Task.Delay(2000);
            }
        }
        
        return "Error: Max retries exceeded. Please try again later.";
    }
}
