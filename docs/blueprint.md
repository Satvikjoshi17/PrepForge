# **App Name**: PrepForge

## Core Features:

- User Authentication: Secure sign-in and sign-up using email and password with Firebase Auth.
- Home Dashboard: Centralized dashboard providing users an overview of available quizzes, interview simulations and performance.
- Dynamic Quiz Generation: Generate quizzes based on user-selected categories with questions pulled from a central question bank.
- AI Mock Interview: Conduct mock interviews with AI interviewer which dynamically decides which questions to ask. The AI will use user's verbal answers as a tool to incorporate into its own follow-up questions.
- Results Tracking: Store and display the quiz and interview results in Firestore for future review and analysis.
- Personalized Recommendations: AI driven recommendations based on past results using user performance on past quizzes and mock interviews to identify weaker areas, suggesting quizzes, articles, and study material.  Uses a reasoning tool for determining usefulness of potential matches.
- Firestore Integration: Use Firestore collections for users, quizResponses, and mockInterviewResponses.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) for a professional and trustworthy feel.
- Background color: Light gray (#F5F5F5) for a clean and minimal aesthetic.
- Accent color: Teal (#009688) for interactive elements and key highlights.
- Body and headline font: 'Inter' sans-serif, providing a modern, machined, objective, neutral look.
- Use a consistent set of minimalistic icons from a library like Material Design Icons to represent various features and actions.
- Implement a clean, card-based layout with clear information hierarchy and ample spacing to prevent clutter.
- Use subtle transitions and animations for feedback, such as loading states and button presses, to enhance user experience.