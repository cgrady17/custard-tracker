variable "domain_name" {
  description = "The custom domain name"
  type        = string
  default     = "mkescoop.com"
}

variable "contact_email" {
  description = "The contact email for domain registration"
  type        = string
}

variable "contact_phone" {
  description = "The contact phone for domain registration (+1.5555555555)"
  type        = string
}

variable "contact_address" {
  description = "The contact address for domain registration"
  type = object({
    region_code         = string
    postal_code         = string
    administrative_area = string
    locality            = string
    address_lines       = list(string)
    recipients          = list(string)
  })
}

variable "site_verification_token" {
  description = "The Google Site Verification token"
  type        = string
  default     = "google-site-verification=-jFwW_wEX-Sb6P_dtsSoC4YE-FJt0cX7LREn6VSIGy0"
}
