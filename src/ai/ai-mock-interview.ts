'use server';

/**
 * @fileOverview AI Mock Interview flow that dynamically adjusts questions based on the user's responses.
 *
 * - conductMockInterview - A function that initiates and manages the mock interview process.
 * - MockInterviewInput - The input type for the conductMockInterview function.
 * - MockInterviewOutput - The return type for the conductMockInterview function.
 */

import { generateWithFallback } from '@/ai/ai-helper';
import { z } from 'genkit';

const MockInterviewInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job role (e.g., "React Developer", "Data Scientist").'),
  jobDescription: z.string().describe('The job description for the target role.'),
  userResponse: z.string().describe('The user response to the current question.'),
  previousQuestions: z.array(z.string()).optional().describe('The list of all previous questions asked.'),
  previousResponses: z.array(z.string()).optional().describe('The list of all previous responses given.'),
  interviewMode: z.enum(['friendly', 'professional', 'technical', 'behavioral', 'stress']).optional().describe('The tone and style of the interview.'),
  experienceLevel: z.enum(['junior', 'mid', 'senior']).optional().describe('The experience level of the candidate.'),
});
export type MockInterviewInput = z.infer<typeof MockInterviewInputSchema>;

const MockInterviewOutputSchema = z.object({
  question: z.string().describe('The next interview question to ask the candidate.'),
});
export type MockInterviewOutput = z.infer<typeof MockInterviewOutputSchema>;

function generatePrompt(input: MockInterviewInput): string {
  return `You are an expert technical interviewer conducting a mock interview for the role of '${input.jobTitle}'.

Job Description: ${input.jobDescription}

Configuration:
- Mode: ${input.interviewMode || 'professional'}
- Level: ${input.experienceLevel || 'mid'}

Context:
- This is a professional interview simulation.
- Your goal is to assess the candidate's depth of knowledge, problem-solving abilities, and communication skills relevant to '${input.jobTitle}'.
- Match the tone to the requested '${input.interviewMode || 'professional'}' mode.
- Tailor the complexity of questions to the '${input.experienceLevel || 'mid'}' level.
- Avoid generic "tell me about yourself" questions after the first turn. Dive deep into technical concepts, scenarios, and behavioral aspects specific to the role.

History:
Previous Questions:
${input.previousQuestions?.map(q => `- ${q}`).join('\n') || 'None'}

Previous Responses:
${input.previousResponses?.map(r => `- ${r}`).join('\n') || 'None'}

Current Interaction:
Candidate's Latest Response: "${input.userResponse}"

Instructions:
1. Analyze the candidate's latest response.
2. If the response is brief or superficial, ask a follow-up digging deeper into the specific concept mentioned.
3. If the response is good, move to the next relevant topic based on the Job Description and '${input.jobTitle}'.
4. Ensure the question is open-ended and challenging enough for the specfied role and level.
5. Do NOT repeat questions asked previously.
6. Keep the tone consistent with '${input.interviewMode || 'professional'}'.
   - friendly: Encouraging, helpful, lower pressure.
   - professional: Standard corporate tone, neutral.
   - stress: Challenging, skeptical, pushing for edge cases, high pressure.
   - technical: Deep dive into implementation details.
   - behavioral: Focus on STAR method and soft skills.

Next Question: `;
}

export async function conductMockInterview(input: MockInterviewInput): Promise<MockInterviewOutput> {
  try {
    const promptText = generatePrompt(input);
    const response = await generateWithFallback({
      prompt: promptText,
      input,
      outputSchema: MockInterviewOutputSchema,
      temperature: 0.7
    });

    if (!response) {
      throw new Error('No question generated. The model response was empty or blocked.');
    }
    return response;
  } catch (error) {
    console.error('Error in conductMockInterview:', error);
    throw error;
  }
}
