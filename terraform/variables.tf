variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "manifest-sum-484719-f4"
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "bucket_name" {
  description = "The name of the GCS bucket for data"
  type        = string
  default     = "mke-custard-data-manifest-sum" # Needs to be globally unique
}
