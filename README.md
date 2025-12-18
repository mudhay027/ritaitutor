# AI Tutor - Staff-PDF Grounded Q&A System

A production-ready web application for university settings that allows staff to upload PDFs and students to ask questions strictly grounded in those materials using Google Gemini.

## Tech Stack

- **Frontend**: React 18 (Vite), TypeScript, Tailwind CSS
- **Backend**: ASP.NET Core 8.0 Web API, EF Core, MySQL
- **Indexer**: Python FastAPI, FAISS, SentenceTransformers
- **AI**: Google Gemini API

## Prerequisites

- .NET SDK 8.0+
- Python 3.10+
- Node.js 18+
- MySQL Server 8.0+

## Setup Instructions

### 1. Database Setup
1. Ensure MySQL is running.
2. Run the initialization script:
   ```bash
   mysql -u root -p < scripts/init_db.sql
   ```
3. Update the connection string in `backend/FinalYearAPI/appsettings.json` if your MySQL credentials differ from `root` / `password`.

### 2. Environment Variables
- **Backend**: Update `appsettings.json` with your `Gemini:ApiKey`.
- **Indexer**: No specific env vars needed for local dev, uses `data/` folder by default.

### 3. Running the Application
Double-click `scripts/start-dev.bat` to start all services.

Or run manually:

**Indexer (Python)**
```bash
cd indexer
pip install -r requirements.txt
python app.py
```
Runs on: http://localhost:8001

**Backend (.NET)**
```bash
cd backend/FinalYearAPI
dotnet run --urls=http://localhost:5000
```
Runs on: http://localhost:5000 (Swagger at /swagger)

**Frontend (React)**
```bash
cd frontend
npm install
npm run dev
```
Runs on: http://localhost:5173

## Features

- **Role-Based Auth**: Student & Staff portals.
- **PDF Management**: Upload, list, delete, rename PDFs (Staff only).
- **AI Chat**: Ask questions, get answers with citations.
- **Modify Answers**: Shorten, expand, simplify, or add examples.
- **Auto-Indexing**: Automatically rebuilds vector index on PDF changes.

## Default Users
- **Admin**: `admin@aitutor.com` / `Admin123!` (Created by init script)
- Register new users via the Register page.
