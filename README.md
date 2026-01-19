# MKE Scoop 🍦

MKE Scoop is a modern Progressive Web Application (PWA) for Milwaukee custard enthusiasts. It tracks the "Flavor of the Day" for all major custard stands in the Milwaukee area, including Kopp's, Culver's, Gilles, Leon's, and Oscar's.

![MKE Scoop Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Features

- **Live Flavor Tracking**: Real-time "Flavor of the Day" for all locations.
- **Interactive Map**: View all custard stands on a map with distance-based sorting.
- **Open Now Filter**: Instantly see which stands are currently serving.
- **PWA Support**: Install on your phone for a native app experience.
- **High Performance**: Scraper runs in parallel on GCP Cloud Functions.

## Live Site

Visit the live app at: [mkescoop.com](https://mkescoop.com)

## Local Development

### Scraper (Worker)
To update the local flavor data:
```bash
cd worker
npm install
npm test
```

### Frontend
To run the React application:
```bash
npm install
npm run dev
```

## Deployment

Infrastructure is managed with **Terraform**. The frontend is hosted on **Google Cloud Run** and the scraper on **Google Cloud Functions**.

To deploy the frontend:
```bash
npm run deploy
```

## License
MIT