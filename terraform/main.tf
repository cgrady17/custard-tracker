terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# --- 1. Enable APIs ---
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "storage.googleapis.com",
    "cloudscheduler.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "dns.googleapis.com",
    "domains.googleapis.com"
  ])
  service = each.key
  disable_on_destroy = false
}

# --- 2. Storage Bucket for Data ---
resource "google_storage_bucket" "data_bucket" {
  name     = var.bucket_name
  location = var.region
  force_destroy = true

  cors {
    origin          = ["*"] # Adjust to specific domain later
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  uniform_bucket_level_access = true
  depends_on = [google_project_service.apis]
}

# Make objects in the bucket publicly readable
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.data_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# --- 3. Scraper (Cloud Function) ---

# ZIP the worker code
data "archive_file" "worker_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../worker"
  output_path = "${path.module}/worker.zip"
  excludes    = [
    "node_modules",
    "package-lock.json",
    "*.log",
    "debug-*.js",
    "process-locations.js",
    "culvers_locations.json",
    "culvers-147101.json"
  ]
}

# Source code bucket for Cloud Functions
resource "google_storage_bucket" "source_bucket" {
  name     = "${var.project_id}-source"
  location = var.region
  uniform_bucket_level_access = true
}

resource "google_storage_bucket_object" "worker_source" {
  name   = "worker-${data.archive_file.worker_zip.output_md5}.zip"
  bucket = google_storage_bucket.source_bucket.name
  source = data.archive_file.worker_zip.output_path
}

# Service Account for the Function
resource "google_service_account" "scraper_sa" {
  account_id   = "custard-scraper-sa"
  display_name = "Custard Scraper Service Account"
}

# Give permission to write to data bucket
resource "google_storage_bucket_iam_member" "scraper_write" {
  bucket = google_storage_bucket.data_bucket.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.scraper_sa.email}"
}

resource "google_cloudfunctions2_function" "scraper" {
  name        = "scrape-custard"
  location    = var.region
  description = "Scrapes custard flavors daily"

  build_config {
    runtime     = "nodejs20"
    entry_point = "scrapeCustard"
    source {
      storage_source {
        bucket = google_storage_bucket.source_bucket.name
        object = google_storage_bucket_object.worker_source.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256Mi"
    timeout_seconds    = 60
    service_account_email = google_service_account.scraper_sa.email
    environment_variables = {
      GCP_BUCKET_NAME = google_storage_bucket.data_bucket.name
      GCP_PROJECT     = var.project_id
    }
  }

  depends_on = [google_project_service.apis]
}

# --- 4. Automation (Cloud Scheduler) ---
resource "google_cloud_scheduler_job" "daily_refresh" {
  name             = "refresh-custard-flavors"
  description      = "Trigger scraper twice daily (4 AM and 4 PM)"
  schedule         = "0 4,16 * * *"
  time_zone        = "America/Chicago"
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions2_function.scraper.url
    oidc_token {
      service_account_email = google_service_account.scraper_sa.email
    }
  }
}

# Allow Scheduler to trigger the function
resource "google_cloud_run_service_iam_member" "invoker" {
  location = google_cloudfunctions2_function.scraper.location
  service  = google_cloudfunctions2_function.scraper.service_config[0].service
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scraper_sa.email}"
}

# --- 5. Frontend (Cloud Run) ---
# Note: For initial Terraform, we point to a placeholder. 
# You will need to build/push the actual image using gcloud or Cloud Build.
resource "google_cloud_run_v2_service" "frontend" {
  name     = "mke-custard-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    max_instance_request_concurrency = 80
    scaling {
      max_instance_count = 10
    }
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder
      ports {
        container_port = 8080
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on = [google_project_service.apis]
}

# Allow public access to frontend
resource "google_cloud_run_v2_service_iam_member" "public_frontend" {
  name     = google_cloud_run_v2_service.frontend.name
  location = google_cloud_run_v2_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# --- 6. Monitoring & Alerting ---

# Email notification channel
resource "google_monitoring_notification_channel" "email" {
  display_name = "Developer Email"
  type         = "email"
  labels = {
    email_address = "cgrad17@gmail.com"
  }
}

# Alert policy for scraper failures
resource "google_monitoring_alert_policy" "scraper_failure" {
  display_name = "MKE Scoop Scraper Failure"
  combiner     = "OR"
  conditions {
    display_name = "Scraper Error Log"
    condition_matched_log {
      filter = "resource.type=\"cloud_run_revision\" textPayload:(\"[SCRAPER_ERROR]\" OR \"[SCRAPER_CRITICAL]\")"
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]

  alert_strategy {
    notification_rate_limit {
      period = "3600s" # Don't spam more than once an hour
    }
  }
}
