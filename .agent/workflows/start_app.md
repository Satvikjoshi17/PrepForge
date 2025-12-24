---
description: Start the PrepForge application
---

## Prerequisites
- Ensure **Node.js (v18 or later)** and **npm** are installed and available in your PATH.
- The project dependencies must be installed.

## Steps to start the application (development mode)
1. Open a terminal and navigate to the project root:
   ```
   cd "C:\Users\ayush\OneDrive\Desktop\PROJECT FILES (SCHOOL)\PrepForge"
   ```
2. Install project dependencies (run once or after pulling new changes):
   ```
   npm install
   ```
3. Start the development server using Turbopack on port **9002**:
   ```
   npm run dev
   ```
   The server will be accessible at `http://localhost:9002`.

## Steps to start the application (production mode)
1. Build the production bundle:
   ```
   npm run build
   ```
2. Start the production server:
   ```
   npm start
   ```
   The app will run on the default Next.js port (3000) unless configured otherwise.

## Additional notes
- If you encounter permission issues on Windows, run the terminal as **Administrator** or ensure your user has write access to the project folder.
- To stop the server, press `Ctrl + C` in the terminal.
- For custom environment variables, create a `.env.local` file at the project root and add variables as needed (e.g., `NEXT_PUBLIC_API_URL=...`).
