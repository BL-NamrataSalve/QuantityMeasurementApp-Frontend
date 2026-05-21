# QuantityMeasurement Frontend Setup Guide

This project is a Single Page Application (SPA) built using **HTML5, CSS3, and JavaScript (ES9)**, powered by a local Node.js Express server. All user authentication details, calculations, and logs are persisted on disk inside the project's `data.json` file.

---

## 🚀 How to Run the Project

### Prerequisites
Make sure you have Node.js installed on your machine.

### Installation
1. Navigate to the project directory:
   ```bash
   d:\QuantityMeasurementApp\quantity-measurement-frontend
   ```
2. Install the necessary dependencies (Express and CORS):
   ```bash
   npm install
   ```

### Start the Server
Start the local data storage and application server:
   ```bash
   npm start
   ```
   (This will execute `node server.js` and start the server at `http://localhost:3000`).

### Open the Application
Navigate to `http://localhost:3000` in your web browser. All registrations, logins, history records, and statistics will be saved directly into the local `data.json` file on disk.

