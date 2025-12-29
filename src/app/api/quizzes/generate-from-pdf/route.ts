
import { NextRequest, NextResponse } from 'next/server';
import PDFParser from 'pdf2json';
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
        // ... (existing code omitted for brevity matches exactly until prompt definition)
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            console.error('API Error: No file provided');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log('File received:', file.name, 'Type:', file.type, 'Size:', file.size);

        if (file.type !== 'application/pdf') {
            console.error('API Error: Invalid file type', file.type);
            return NextResponse.json({ error: 'Invalid file type. Please upload a PDF.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text using pdf2json
        const textContent = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, 1 as any); // 1 = raw text

            pdfParser.on("pdfParser_dataError", (errData: any) => {
                console.error('pdf2json error:', errData.parserError);
                reject(errData.parserError);
            });

            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                const rawText = pdfParser.getRawTextContent();
                console.log('pdf2json extraction complete. Raw text length:', rawText?.length);
                resolve(rawText);
            });

            pdfParser.parseBuffer(buffer);
        });

        // Stricter check: less than 100 characters is likely garbage or empty
        if (!textContent || textContent.trim().length < 100) {
            console.error('API Error: Extracted text is too short');
            return NextResponse.json({ error: 'The PDF content is too short or unreadable. Please upload a substantial document.' }, { status: 400 });
        }

        const truncatedText = textContent.slice(0, 100000);

        const difficulty = formData.get('difficulty') as string || 'Medium';

        const prompt = `
      You are an expert educational content creator. 
      Analyze the following text extracted from a syllabus or educational document. 
      Create a comprehensive quiz based strictly on the ACADEMIC CONTENT.
      
      Requirements:
      1. IGNORE administrative details, program outcomes, university missions, grading policies, and course logistics. Focus ONLY on the subject matter, concepts, and theories.
      2. If the text does NOT contain enough academic content for at least 5 meaningful questions, you must set the title to 'ERROR: INSUFFICIENT_CONTENT' and return a single dummy question.
      3. Otherwise, generate 20-30 multiple choice questions.
      4. For EACH question, providing a specific 'topic' or 'concept' tag is MANDATORY.
      5. For EACH question, providing an 'explanation' is MANDATORY. It should explain the correct answer to help a student learn.
      6. Use the exact JSON format provided below.
      7. Ensure 'id's are unique strings (e.g., 'q1', 'q2').
      8. Difficulty Level: ${difficulty}.
      
      Source Text:
      "${truncatedText}"
      
      Output JSON Format:
      {
        "title": "Quiz Title",
        "category": "Subject Category",
        "description": "Short description of what this quiz covers.",
        "questions": [
          {
            "id": "unique_id_1",
            "text": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option B",
            "difficulty": "${difficulty}",
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
            return NextResponse.json({ error: 'The PDF content did not contain enough academic material to generate a quiz.' }, { status: 400 });
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
        console.error('Error generating quiz:', error);
        return NextResponse.json(
            { error: 'Failed to process PDF and generate quiz.' },
            { status: 500 }
        );
    }
}
