# 🚆 RailSmart — Enhanced Train Tracker

RailSmart is a cutting-edge train tracking and analytics dashboard designed for Indian Railways. Built with a modular JavaScript architecture and Leaflet.js, it offers real-time journey insights, live status updates, and interactive map-based tracking — all wrapped in a premium dark-themed interface.

---

## 🌟 What It Does

RailSmart transforms complex railway data into an intuitive, visually stunning experience. It provides commuters with precise, easy-to-access information for smarter travel planning and journey management through four core modules:

- **🔍 Search** — Quickly find trains by name or number with smart real-time filtering.
- **📍 Live Status** — Monitor live running status, current position, and delay information for any train.
- **🗺️ MAP-TRACK** — Visualize train routes and live positions on an interactive geospatial map with custom animated train markers.
- **📊 Analytics** — Dive into delay patterns and performance data through a structured analytics engine.

---

## ⚙️ How It Works

RailSmart uses a clean, layered architecture where each layer has a distinct responsibility:

```
Data Layer → Utility Layer → Page Modules → App Controller
```

| Layer | Files | Purpose |
|-------|-------|---------|
| **Data** | `stations.js`, `trains.js`, `delays.js`, `trackWaypoints.js` | Structured datasets for stations, trains, delays & GPS waypoints |
| **Utils** | `dom.js`, `time.js`, `storage.js` | DOM helpers, time formatting, and local storage management |
| **Pages** | `search.js`, `status.js`, `map.js`, `analytics.js` | Individual page logic and rendering |
| **Controller** | `app.js` | Hash-based routing, page lifecycle management |

### Key Technical Highlights

- **Hash-Based Routing** — Seamless navigation between pages (`#search`, `#status`, `#map`, `#analytics`) without full page reloads.
- **Leaflet.js Integration** — Interactive maps with custom animated train markers (pulse ring effect), route polylines, and dark-themed popups.
- **Modular JS Architecture** — Scripts are loaded in dependency order, keeping logic clean, testable, and scalable.
- **Real-Time Delay Engine** — A dedicated `delays.js` data module powers the analytics and live status views.
- **Premium UI** — Built with CSS custom properties, smooth animations (`animations.css`), JetBrains Mono & Inter fonts, and a deep dark color theme (`#0a0e1a`).

---

## 🚀 How to Run Locally

### 1. Get the Files

- Click the green **"Code"** button on GitHub and select **"Download ZIP"**.
- Extract the ZIP to a folder of your choice.

### 2. Launch the App

- Open the extracted folder.
- Find `index.html`, **right-click** it, and select **"Open with"** → your preferred browser (Chrome, Edge, or Firefox recommended).

> That's it! No build tools, no npm install required — just open and go.

---

## 🛠️ Tech Stack

| Technology | Role |
|------------|------|
| HTML5 + Vanilla CSS | Structure & styling |
| Vanilla JavaScript (ES6) | App logic & routing |
| [Leaflet.js](https://leafletjs.com/) | Interactive maps |
| Google Fonts (Inter, JetBrains Mono) | Typography |
| CSS Custom Properties | Design token system |

---

## 📁 Project Structure

```
railsmart/
├── index.html              # Entry point & navigation shell
├── css/
│   ├── variables.css       # Design tokens & color palette
│   ├── base.css            # Reset & global styles
│   ├── animations.css      # Keyframe animations
│   ├── components.css      # Reusable UI components
│   └── pages.css           # Page-specific styles
└── js/
    ├── data/
    │   ├── stations.js     # Station dataset
    │   ├── trains.js       # Train dataset
    │   ├── delays.js       # Delay simulation data
    │   └── trackWaypoints.js # GPS route waypoints
    ├── utils/
    │   ├── dom.js          # DOM utility helpers
    │   ├── time.js         # Time formatting utilities
    │   └── storage.js      # Local storage helpers
    ├── pages/
    │   ├── search.js       # Search page module
    │   ├── status.js       # Live status page module
    │   ├── map.js          # Map-Track page module
    │   └── analytics.js    # Analytics page module
    └── app.js              # App controller & router
```

---

## 📱 Responsive Design

RailSmart works beautifully across desktops and tablets, with a responsive layout that adapts to different screen sizes while maintaining the premium look and feel.

---

## 👨‍💻 Developed By

**Arijit Pal** — [GitHub: ARIJIT-off](https://github.com/ARIJIT-off)
