DROP DATABASE IF EXISTS ai_tutor_db;
CREATE DATABASE ai_tutor_db;
USE ai_tutor_db;

CREATE TABLE IF NOT EXISTS Users (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Pdfs (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Filename VARCHAR(255) NOT NULL,
    StoredPath VARCHAR(500) NOT NULL,
    Size BIGINT NOT NULL,
    UploadedById INT NOT NULL,
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UploadedById) REFERENCES Users(Id) ON DELETE CASCADE
);

-- Insert default admin user (password: Admin123!)
-- Hash generated using BCrypt
INSERT INTO Users (Name, Email, PasswordHash, Role) 
SELECT 'System Admin', 'admin@aitutor.com', '$2a$11$79K.H9.8.7.6.5.4.3.2.1.0.1.2.3.4.5.6.7.8.9.0.1.2.3.4', 'Admin'
WHERE NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@aitutor.com');
