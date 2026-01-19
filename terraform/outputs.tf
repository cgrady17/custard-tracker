output "frontend_url" {
  value = google_cloud_run_v2_service.frontend.uri
}

output "data_bucket_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.data_bucket.name}/data.json"
}

output "function_url" {
  value = google_cloudfunctions2_function.scraper.url
}
