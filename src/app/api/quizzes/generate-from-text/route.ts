
import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schema for the expected AI response
const QuestionSchema = z.object({
    id: z.string(),
    text: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.string(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
    topic: z.string().describe("A specific sub-topic or concept tag for this question (e.g., 'Thermodynamics')"),
    explanation: z.string().describe("A clear, concise explanation of why the correct answer is right and why others are wrong."),
});

const QuizSchema = z.object({
    title: z.string(),
    category: z.string(),
    description: z.string(),
    questions: z.array(QuestionSchema),
});

export async function POST(req: NextRequest) {
    try {
        const { text, topic, difficulty, count } = await req.json();

        if (!text || text.trim().length < 50) {
            return NextResponse.json({ error: 'Text content is too short to generate a quiz.' }, { status: 400 });
        }

        const prompt = `
      You are an expert educational content creator. 
      Create a comprehensive quiz based on the provided text.
      
      Text Content:
      "${text}"
      
      Requirements:
      1. Generate ${count || "20-30"} multiple choice questions.
      2. Difficulty Level: ${difficulty || 'Medium'}.
      3. Topic focus: ${topic || 'General'}.
      4. For EACH question, providing a specific 'topic' or 'concept' tag is MANDATORY.
      5. For EACH question, providing an 'explanation' is MANDATORY. It should explain the correct answer to help a student learn.
      6. Use the exact JSON format provided below.
      7. Ensure 'id's are unique strings.

      Output JSON Format:
      {
        "title": "Quiz Title",
        "category": "Subject Category",
        "description": "Short description of what this quiz covers.",
        "questions": [
          {
            "id": "q1",
            "text": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option B",
            "difficulty": "Medium",
            "topic": "Specific Concept Name",
            "explanation": "Option B is correct because..."
          }
        ]
      }
    `;

        const response = await ai.generate({
            prompt: prompt,
            output: { schema: QuizSchema },
        });

        const quizData = response.output;

        if (!quizData) {
            throw new Error("Failed to generate quiz data");
        }

        // Check for the error signal from AI
        if (quizData.title.includes('ERROR:')) {
            return NextResponse.json({ error: 'The provided text did not contain enough academic material to generate a quiz.' }, { status: 400 });
        }

        const finalQuiz = {
            id: `generated-${Date.now()}`,
            ...quizData,
            image: 'https://picsum.photos/seed/generated/600/400',
            imageHint: 'educational abstract',
            questions: quizData.questions.map((q: any) => ({
                ...q,
                difficulty: q.difficulty || 'Medium'
            }))
        };

        return NextResponse.json(finalQuiz);

    } catch (error) {
        console.error('Error generating quiz from text:', error);
        return NextResponse.json(
            { error: 'Failed to process text and generate quiz.' },
            { status: 500 }
        );
    }
}
