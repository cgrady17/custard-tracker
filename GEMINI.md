# MKE Scoop

## Project Overview

**MKE Scoop** is a Progressive Web Application (PWA) that aggregates and displays the "Flavor of the Day" from famous frozen custard shops in Milwaukee, Wisconsin (including Kopp's, Culver's, Gilles, Leon's, and Oscar's).

The project consists of two main parts:
1.  **Frontend**: A React application (powered by Vite) that displays the flavors in a list or map view.
2.  **Worker**: A Node.js-based scraper (Google Cloud Function) that periodically fetches flavor data from restaurant websites and updates a JSON data file in Google Cloud Storage.

## Architecture

*   **Data Source**: The application relies on a static JSON file (`data.json`) containing the latest flavor data.
*   **Scraper (Worker)**:
    *   Located in the `worker/` directory.
    *   Runs as a 2nd Gen Google Cloud Function.
    *   Parallelized scraping for high performance.
    *   **Output**: Uploads `data.json` to a Google Cloud Storage bucket (`mke-custard-data-manifest-sum`) in production.
*   **Frontend**:
    *   Located in the root directory.
    *   Built with React, TypeScript, and Vite.
    *   Containerized using Docker and served via Nginx on **Cloud Run**.
    *   Integrated Service Worker for offline support and "Network First" data fetching.
    *   Custom Domain: `mkescoop.com`

## Directory Structure

*   `App.tsx`: Main React application component.
*   `types.ts`: TypeScript definitions for `CustardShop`, `FlavorStatus`, etc.
*   `components/`: UI components (e.g., `ShopCard`, `MapView`).
*   `public/data.json`: The generated data file used by the frontend (local dev).
*   `worker/`: Contains the backend scraping logic.
    *   `index.js`: Entry point for the Cloud Function (`scrapeCustard`).
    *   `scrapers/`: Individual logic for scraping specific chains.
*   `terraform/`: Infrastructure as Code for GCP resources.

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   GCP CLI (`gcloud`)
*   Terraform

### 1. Local Development
The frontend displays the data. To run it, you need a valid `public/data.json` file.

```bash
# Generate local data
cd worker
npm install
npm test

# Run the frontend
cd ..
npm install
npm run dev
```

### 2. Infrastructure Deployment
Resources are managed via Terraform in the `terraform/` directory.

```bash
cd terraform
terraform init
terraform apply
```

### 3. Frontend Deployment
A custom PowerShell script `deploy.ps1` handles building the container, pushing to Artifact Registry, and deploying to Cloud Run.

```bash
npm run deploy
```

## Key Commands

| Command | Directory | Description |
| :--- | :--- | :--- |
| `npm run dev` | Root | Starts the React dev server (Vite). |
| `npm run build` | Root | Builds the React app. |
| `npm run deploy`| Root | Builds container and deploys to Cloud Run (GCP). |
| `npm test` | `worker/` | Runs the scraper locally and saves to `public/data.json`. |

## Performance Optimizations
*   **Parallel Scraping**: The worker uses `Promise.all` to fetch data from all chains simultaneously, reducing execution time from ~10s to ~2s.
*   **Network First PWA**: The Service Worker ensures `data.json` is always fresh by trying the network first before falling back to cache.
*   **Conditional Styles**: Shop statuses (Open/Closed) are computed in real-time based on local time.