#!/usr/bin/env pwsh
# Production Database Setup Script
# This script helps you create all tables in the production database

$productionDbUrl = "postgresql://admin:1103@yug@3.7.64.213:5432/ironclad"
$schemaPath = "prisma/schema.production.prisma"

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Ironclad Production Database Setup                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Node/npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "Database URL: $productionDbUrl" -ForegroundColor Yellow
Write-Host "Schema File: $schemaPath" -ForegroundColor Yellow
Write-Host ""

# Menu
Write-Host "Select an option:" -ForegroundColor Green
Write-Host "1. Push schema directly (recommended for fresh database)" -ForegroundColor Gray
Write-Host "2. Create and deploy migration" -ForegroundColor Gray
Write-Host "3. Generate Prisma client only" -ForegroundColor Gray
Write-Host "4. Verify tables exist (Prisma Studio)" -ForegroundColor Gray
Write-Host "5. Exit" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "📊 Pushing schema to production database..." -ForegroundColor Cyan
    Write-Host "This will create all tables directly." -ForegroundColor Gray
    Write-Host ""
    
    npx prisma db push --schema $schemaPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Schema pushed successfully!" -ForegroundColor Green
        Write-Host "All tables have been created in the production database." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Schema push failed!" -ForegroundColor Red
    }
}
elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "🔄 Creating migration..." -ForegroundColor Cyan
    Write-Host ""
    
    $migrationName = Read-Host "Enter migration name (e.g., 'init_production')"
    
    npx prisma migrate dev --schema $schemaPath --name $migrationName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration created and deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed!" -ForegroundColor Red
    }
}
elseif ($choice -eq "3") {
    Write-Host ""
    Write-Host "🔨 Generating Prisma client..." -ForegroundColor Cyan
    Write-Host ""
    
    npx prisma generate --schema $schemaPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Prisma client generated successfully!" -ForegroundColor Green
        Write-Host "Output location: generated/prisma-prod" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "❌ Client generation failed!" -ForegroundColor Red
    }
}
elseif ($choice -eq "4") {
    Write-Host ""
    Write-Host "🔍 Opening Prisma Studio..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This will open your browser to view the database tables." -ForegroundColor Gray
    Write-Host "(Studio will open on http://localhost:5555)" -ForegroundColor Gray
    Write-Host ""
    
    npx prisma studio --schema $schemaPath
}
elseif ($choice -eq "5") {
    Write-Host "Exiting..." -ForegroundColor Yellow
    exit 0
}
else {
    Write-Host "Invalid choice!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done! Check the output above for any errors." -ForegroundColor Cyan
