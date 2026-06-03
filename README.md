# Star Robot Companion - Animated AI Companion

Star is a sleek, premium, and highly intelligent robot companion featuring responsive SVG tracking, ambient lighting variations, and synthesized chimes sweeps. It runs in two modes:
1. **Local Node.js Mode**: Runs on a local Express server proxying API calls to the Gemini API using a local `.env` key.
2. **Static GitHub Pages Mode**: Runs directly inside your browser as a static web application, utilizing user-supplied API keys saved securely inside `localStorage`.

---

## 🚀 Run Locally

### Prerequisites
- Node.js (v18+)

### Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root folder and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Boot the local server:
   ```bash
   npm run dev
   ```
4. Access the companion at: `http://localhost:3000`

---

## 🌐 Deploy to GitHub Pages

GitHub Pages hosts static assets directly from your branch. Since the backend server will not run on GitHub Pages, users config their own API keys in the app interface.

### Deployment Steps

1. **Create a Repository on GitHub**:
   - Go to GitHub and create a new repository (e.g., `star-companion`).
   - Do **NOT** initialize it with a README, .gitignore, or license.

2. **Commit and Push Your Code**:
   Open a terminal in this folder and run:
   ```bash
   git add .
   git commit -m "Convert to Vanilla HTML/CSS/JS with local & Pages support"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```
   *(Replace `YOUR_USERNAME` and `YOUR_REPOSITORY` with your actual GitHub details).*

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click the **Settings** tab.
   - Click **Pages** in the left sidebar (under "Code and automation").
   - Under **Build and deployment** -> **Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and `/ (root)` folder.
   - Click **Save**.

4. **Access Your Live Companion**:
   GitHub will build and deploy your site. After 1-2 minutes, you will find your live link at the top of the Pages settings page (typically `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`).

5. **API Key Setup**:
   Once live, click the **Key** button in the top navigation header and enter your Gemini API Key. The key is saved securely inside your browser's local storage.
