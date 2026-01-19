# deploy.ps1
$PROJECT_ID = "manifest-sum-484719-f4"
$IMAGE_NAME = "mke-scoop-frontend"
$SERVICE_NAME = "mke-custard-frontend"
$REGION = "us-central1"

# Load environment variables from .env.local if present
if (Test-Path ".env.local") {
    Write-Host "Loading build arguments from .env.local..."
    Get-Content .env.local | ForEach-Object {
        if ($_ -match "^([^#\s][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            $value = $value.Trim("'").Trim("`"")
            Set-Variable -Name "ENV_$name" -Value $value
        }
    }
}

Write-Host "Building container image for MKE Scoop..."

# Prepare substitutions string
$subs = ""
Get-Variable -Name "ENV_VITE_*" -ErrorAction SilentlyContinue | ForEach-Object {
    $argName = $_.Name.Replace("ENV_", "")
    $argValue = $_.Value
    if ($subs -ne "") { $subs += "," }
    $subs += "_$argName=$argValue"
}

# Run build using the cloudbuild.yaml
if ($subs -ne "") {
    gcloud builds submit --config cloudbuild.yaml --substitutions $subs .
} else {
    # Fallback to simple build if no env vars found (unlikely)
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$IMAGE_NAME .
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!"
    exit $LASTEXITCODE
}

Write-Host "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME `
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME `
  --region $REGION `
  --platform managed

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!"
    exit $LASTEXITCODE
}

Write-Host "Deployment complete! Your changes are live."