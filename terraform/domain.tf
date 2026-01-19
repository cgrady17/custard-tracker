
# --- 6. Custom Domain & DNS ---

# DNS Managed Zone
resource "google_dns_managed_zone" "mke_custard_zone" {
  name        = "mke-custard-zone"
  dns_name    = "${var.domain_name}."
  description = "DNS zone for ${var.domain_name}"
  
  depends_on = [google_project_service.apis]
}

# Site Verification Record
resource "google_dns_record_set" "verification" {
  name         = google_dns_managed_zone.mke_custard_zone.dns_name
  managed_zone = google_dns_managed_zone.mke_custard_zone.name
  type         = "TXT"
  ttl          = 300
  rrdatas      = [var.site_verification_token]
}

# Domain Registration (Warning: This will charge your billing account)
resource "google_clouddomains_registration" "mke_custard_domain" {
  domain_name = var.domain_name
  location    = "global"

  yearly_price {
    currency_code = "USD"
    units         = 12
  }

  contact_settings {
    privacy = "REDACTED_CONTACT_DATA"
    
    registrant_contact {
      email = var.contact_email
      phone_number = var.contact_phone
      postal_address {
        region_code         = var.contact_address.region_code
        postal_code         = var.contact_address.postal_code
        administrative_area = var.contact_address.administrative_area
        locality            = var.contact_address.locality
        address_lines       = var.contact_address.address_lines
        recipients          = var.contact_address.recipients
      }
    }
    
    admin_contact {
      email = var.contact_email
      phone_number = var.contact_phone
      postal_address {
        region_code         = var.contact_address.region_code
        postal_code         = var.contact_address.postal_code
        administrative_area = var.contact_address.administrative_area
        locality            = var.contact_address.locality
        address_lines       = var.contact_address.address_lines
        recipients          = var.contact_address.recipients
      }
    }
    
    technical_contact {
      email = var.contact_email
      phone_number = var.contact_phone
      postal_address {
        region_code         = var.contact_address.region_code
        postal_code         = var.contact_address.postal_code
        administrative_area = var.contact_address.administrative_area
        locality            = var.contact_address.locality
        address_lines       = var.contact_address.address_lines
        recipients          = var.contact_address.recipients
      }
    }
  }

  dns_settings {
    custom_dns {
      name_servers = [for ns in google_dns_managed_zone.mke_custard_zone.name_servers : trimsuffix(ns, ".")]
    }
  }

  lifecycle {
    ignore_changes = [
      dns_settings,
      contact_settings
    ]
  }

  depends_on = [google_project_service.apis]
}

# Map Domain to Cloud Run
resource "google_cloud_run_domain_mapping" "frontend_mapping" {
  location = var.region
  name     = var.domain_name

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.frontend.name
  }

  depends_on = [google_clouddomains_registration.mke_custard_domain]
}

# Automatically create DNS records from the domain mapping
resource "google_dns_record_set" "frontend_records" {
  # Group records by type (A, AAAA, etc.) since rrdatas is a list
  for_each = {
    for type in distinct([for r in google_cloud_run_domain_mapping.frontend_mapping.status[0].resource_records : r.type]) :
    type => [for r in google_cloud_run_domain_mapping.frontend_mapping.status[0].resource_records : r.rrdata if r.type == type]
  }

  name         = google_dns_managed_zone.mke_custard_zone.dns_name
  managed_zone = google_dns_managed_zone.mke_custard_zone.name
  type         = each.key
  ttl          = 300
  rrdatas      = each.value
}
