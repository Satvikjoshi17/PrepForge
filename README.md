# 🚀 PrepForge

<div align="center">

  <h3 align="center">Master Your Technical Interview Journey</h3>

  <p align="center">
    An AI-powered preparation platform that adapts to your learning pace.
    <br />
    <a href="#-features"><strong>Explore the features »</strong></a>
    <br />
    <br />
  </p>
</div>

---

## 💡 Inspiration

Breaking into the tech industry is hard. Students often feel lost in the sea of tutorials or intimidated by traditional mock interviews. **PrepForge** was built to solve this by acting as a personalized, judgment-free AI mentor that is available 24/7.

## ✨ Features

### 🤖 AI Mock Interviews
Simulate real-world technical interviews with our Gemini-powered AI interviewer.
- **Adaptive Questioning**: The AI adjusts difficulty based on your responses.
- **Real-time Feedback**: Get instant, actionable advice on your answers.
- **Custom Personas**: Choose your interviewer style (Friendly, Strict, or Technical).

### 📚 Intelligent Quiz Generation
Turn any study material into an interactive quiz instantly.
- **Text-to-Quiz**: Paste notes or documentation to generate custom questions.
- **PDF-to-Quiz**: Upload your syllabus or textbooks (PDF) and let the AI extract key concepts.
- **Difficulty Control**: Choose from Easy, Medium, Hard, or Mixed modes.

### 📊 Smart Analytics Dashboard
Visualize your growth with comprehensive data.
- **Skill Radar**: See your strengths and weaknesses at a glance with interactive charts.
- **detailed Insights**: View granular performance data (e.g., "Python: Loops" vs "Python: Classes").
- **Activity Tracking**: Monitor your consistency with history logs and success rates.

### 🎯 Personalized Recommendations
Stop guessing what to study next.
- The system analyzes your weak spots and automatically suggests **curated resources** and **targeted quizzes** to bridge the gap.

## 🛠️ Tech Stack

**Core**
*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Library**: [React 19](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)

**Frontend & UI**
*   **Styling**: [TailwindCSS](https://tailwindcss.com/)
*   **Components**: [Shadcn/UI](https://ui.shadcn.com/) (Radix Primitives)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Charts**: [Recharts](https://recharts.org/) (Data Visualization)

**Forms & Validation**
*   **Form Handling**: [React Hook Form](https://react-hook-form.com/)
*   **Schema Validation**: [Zod](https://zod.dev/)

**Backend & AI**
*   **Database**: [Firebase Firestore](https://firebase.google.com/)
*   **Auth**: [Firebase Authentication](https://firebase.google.com/docs/auth)
*   **AI Engine**: [Google Gemini Pro](https://deepmind.google/technologies/gemini/) (via Genkit)
*   **PDF Processing**: [PDF2JSON](https://www.npmjs.com/package/pdf2json)

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

*   Node.js 18+
*   npm or yarn

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/yourusername/PrepForge.git
    cd PrepForge
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env.local` file in the root directory and add your Firebase and Genkit credentials:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    # ... other firebase config
    ```

4.  **Run the development server**
    ```sh
    npm run dev
    ```



## 🔮 Future Roadmap

*   [ ] Multiplayer Coding Battles
*   [ ] Resume Parser & Optimizer
*   [ ] Voice-enabled Interviews with TTS/STT


