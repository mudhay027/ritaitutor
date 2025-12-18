# Troubleshooting: Can't Get Output from Uploaded PDFs

## Quick Diagnostic

Run the diagnostic script:
```bash
cd ai-tutor\scripts
diagnose.bat
```

## Common Issues & Solutions

### 1. **Indexer Not Running**
**Symptoms**: "Sorry, I encountered an error" message when asking questions.

**Solution**:
- Open a new terminal/command prompt
- Navigate to the indexer folder:
  ```bash
  cd d:\Data science\Ai Teacher\ritaitutor\ai-tutor\indexer
  ```
- Install dependencies (first time only):
  ```bash
  pip install -r requirements.txt
  ```
- Start the indexer:
  ```bash
  python app.py
  ```
- You should see: `Uvicorn running on http://0.0.0.0:8001`

### 2. **FAISS Index Not Built**
**Symptoms**: "No relevant content found" even though PDFs are uploaded.

**Solution**:
- Run the rebuild script:
  ```bash
  cd ai-tutor\scripts
  rebuild-index.bat
  ```
- OR manually:
  ```bash
  cd ai-tutor\indexer
  python build_index.py
  ```
- Check that `data/config/pdf_index.faiss` file is created

### 3. **PDFs Not in Correct Folder**
**Symptoms**: Index builds but finds 0 chunks.

**Solution**:
- Check that PDFs are in: `ai-tutor\indexer\data\staff_pdfs\`
- If you uploaded via the web interface, the backend might be using a different path
- Check `backend\FinalYearAPI\appsettings.json` for the correct path

### 4. **Port Conflicts**
**Symptoms**: Indexer won't start, says "Address already in use".

**Solution**:
- Check if something else is using port 8001:
  ```bash
  netstat -ano | findstr :8001
  ```
- Kill the process or change the port in `appsettings.json`

### 5. **Gemini API Error**
**Symptoms**: Error messages about Gemini API.

**Solution**:
- Check that your API key is correct in `backend\FinalYearAPI\appsettings.json`
- Test the API key at: https://aistudio.google.com/

## Step-by-Step Debugging

1. **Check Indexer Status** (http://localhost:8001/status)
   - If unreachable: Indexer not running → Start it
   - If returns 0 chunks: Index not built → Run `rebuild-index.bat`

2. **Check Backend Logs**
   - Look for `[DEBUG]` and `[ERROR]` messages in the terminal running the backend
   - Common errors:
     - `HTTP Error`: Indexer not reachable
     - `No chunks found`: Index is empty

3. **Test Manually**
   - Visit: http://localhost:8001/docs
   - Test the `/retrieve` endpoint with a sample query
   - If it returns empty results, the index is not populated

4. **Rebuild Everything**
   ```bash
   # 1. Stop all services (Ctrl+C in each terminal)
   
   # 2. Rebuild index
   cd ai-tutor\indexer
   python build_index.py
   
   # 3. Start indexer
   python app.py
   
   # 4. In another terminal, start backend
   cd ai-tutor\backend\FinalYearAPI
   dotnet run
   
   # 5. In another terminal, start frontend
   cd ai-tutor\frontend
   npm run dev
   ```

## Still Not Working?

Check the backend terminal for detailed debug logs. You should see:
- `[DEBUG] Received question: ...`
- `[IndexService] Retrieving chunks for query: ...`
- `[IndexService] Retrieved X chunks`
- `[DEBUG] Calling Gemini...`

If you see `[IndexService] HTTP Error`, the indexer is not reachable.
If you see `Retrieved 0 chunks`, the index is empty or the query doesn't match.
