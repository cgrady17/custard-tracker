# MKE Scoop 🍦

**MKE Scoop** is a modern Progressive Web Application (PWA) that aggregates and displays the "Flavor of the Day" from famous frozen custard shops in Milwaukee, Wisconsin (including Kopp's, Culver's, Gilles, Leon's, and Oscar's).

## Features

- **Live Flavor Tracking**: Real-time "Flavor of the Day" for all locations.
- **Push Notifications**: Subscribe to your favorite flavors and get alerted when they are churning!
- **Interactive Map**: View all custard stands on a map with distance-based sorting.
- **Open Now Filter**: Instantly see which stands are currently serving.
- **Search & Filter**: Search by stand name or specific flavor.
- **PWA Support**: Install on your phone for a native app experience.
- **High Performance**: Parallelized scraping for near-instant updates.

## Architecture

*   **Data Source**: Static JSON data manifest updated periodically.
*   **Worker (Scraper)**: Node.js-based worker running as a Google Cloud Function. Parallelized scraping for high performance.
*   **Frontend**: React (Vite) application styled with Tailwind CSS v4. Containerized with Docker and served via Nginx on Cloud Run.
*   **Database**: Firestore used for anonymous push notification subscriptions.
*   **Infrastructure**: Managed via Terraform (GCP).

## Live Site

Visit the live app at: [mkescoop.com](https://mkescoop.com)

## Local Development

### 1. Prerequisites
*   Node.js (v18+)
*   GCP CLI (`gcloud`)
*   Terraform

### 2. Scraper (Worker)
To update the local flavor data and metadata:
```bash
cd worker
npm install
npm test
```

### 3. Frontend
To run the React application:
```bash
npm install
npm run dev
```

## Deployment

### Infrastructure
Resources are managed via Terraform in the `terraform/` directory.
```bash
cd terraform
terraform init
terraform apply
```

### Frontend Deployment
A custom script handles building the container with secure environment injection and deploying to Cloud Run.
```bash
npm run deploy
```

## Performance Optimizations
*   **Parallel Scraping**: Fetches data from all chains simultaneously (~2s execution).
*   **Network-First PWA**: Service Worker ensures data is always fresh while providing offline support.
*   **Instant-Render**: Hydrates from local cache for immediate visibility while fresh data syncs.

## License
MIT
