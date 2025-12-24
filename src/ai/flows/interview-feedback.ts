'use server';

import { generateWithFallback } from '@/ai/ai-helper';
import { z } from 'genkit';

// Define the schema for a single turn in the conversation
const ConversationTurnSchema = z.object({
  speaker: z.enum(['ai', 'user']),
  text: z.string(),
});

// Define the input schema for the interview feedback flow
const InterviewFeedbackInputSchema = z.object({
  jobDescription: z.string().describe('The job description for the target role.'),
  conversation: z.array(ConversationTurnSchema).describe('The full conversation history of the interview.'),
});
export type InterviewFeedbackInput = z.infer<typeof InterviewFeedbackInputSchema>;

// Define the output schema for the interview feedback flow
const InterviewFeedbackOutputSchema = z.object({
  score: z.number().describe('A score from 0 to 100 representing the candidate\'s performance.'),
  summary: z.string().describe('A detailed summary of the candidate\'s performance.'),
  strengths: z.array(z.string()).describe('List of specific strengths demonstrated by the candidate.'),
  weaknesses: z.array(z.string()).describe('List of areas for improvement (weaknesses) demonstrated.'),
});
export type InterviewFeedbackOutput = z.infer<typeof InterviewFeedbackOutputSchema>;

function generateFeedbackPrompt(input: InterviewFeedbackInput): string {
  return `You are an AI hiring manager providing feedback on a mock interview.

Job Description:
${input.jobDescription}

Interview Transcript:
${input.conversation.map(turn => `**${turn.speaker}**: ${turn.text}`).join('\n')}

Based on the transcript and the job description, please provide a score from 0 to 100 and a detailed feedback summary. The summary should include:
- An overall assessment of the candidate's performance.
- Actionable advice for future interviews.

Also provide two specific lists:
1. Strengths: What did the candidate do well?
2. Weaknesses: Where can the candidate improve?

Provide the score, summary, and these two lists in the requested JSON format.`;
}

// Export the function to be used in server actions
export async function generateInterviewFeedback(input: InterviewFeedbackInput): Promise<InterviewFeedbackOutput> {
  try {
    const promptText = generateFeedbackPrompt(input);
    const response = await generateWithFallback({
      prompt: promptText,
      input,
      outputSchema: InterviewFeedbackOutputSchema,
      temperature: 0.5
    });

    if (!response) {
      throw new Error('No feedback generated. The model response was empty or blocked.');
    }
    return response;
  } catch (error) {
    console.error('Error in generateInterviewFeedback:', error);
    throw error;
  }
}
