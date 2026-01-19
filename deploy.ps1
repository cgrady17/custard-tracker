# deploy.ps1
$PROJECT_ID = "manifest-sum-484719-f4"
$IMAGE_NAME = "mke-scoop-frontend"
$SERVICE_NAME = "mke-custard-frontend"
$REGION = "us-central1"

Write-Host "🚀 Building container image for MKE Scoop..." -ForegroundColor Cyan
gcloud builds submit --tag gcr.io/$PROJECT_ID/$IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "☁️ Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME `
  --region $REGION `
  --platform managed

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "✅ Deployment complete! Your changes are live." -ForegroundColor Green
