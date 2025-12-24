// src/ai/flows/personalized-recommendations.ts
'use server';
/**
 * @fileOverview Personalized recommendation flow for quizzes, articles, and study materials based on past performance.
 *
 * - generatePersonalizedRecommendations - A function that generates personalized recommendations based on user performance data.
 * - PersonalizedRecommendationsInput - The input type for the generatePersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the generatePersonalizedRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the user to generate recommendations for.'),
  quizResponses: z.array(
    z.object({
      quizId: z.string(),
      score: z.number(),
      category: z.string(),
    })
  ).describe('Array of quiz responses for the user.'),
  mockInterviewResponses: z.array(
    z.object({
      interviewId: z.string(),
      score: z.number(),
      category: z.string(),
      feedback: z.string(),
    })
  ).describe('Array of mock interview responses for the user.'),
  availableResources: z.array(
    z.object({
      resourceId: z.string(),
      title: z.string(),
      category: z.string(),
      type: z.enum(['quiz', 'article', 'studyMaterial']),
      url: z.string(),
      description: z.string(),
    })
  ).describe('Array of available learning resources.'),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      resourceId: z.string(),
      title: z.string(),
      category: z.string(),
      type: z.enum(['quiz', 'article', 'studyMaterial']),
      url: z.string(),
      reason: z.string().describe('The reason why this resource is recommended.'),
    })
  ).describe('Array of personalized learning resource recommendations.'),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function generatePersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  console.log("Generating recommendations flow for user:", input.userId);
  try {
    const response = await prompt(input);
    if (!response || !response.output) {
      throw new Error('No recommendations generated. The model response was empty or blocked.');
    }
    return response.output;
  } catch (error) {
    console.error('Error in personalizedRecommendationsFlow:', error);
    throw error;
  }
}

const resourceUsefulnessTool = ai.defineTool({
  name: 'isResourceUseful',
  description: 'Determine whether a learning resource is useful for a user based on their past performance and the resource content.',
  inputSchema: z.object({
    userPerformanceSummary: z.string().describe('Summary of the user past performance in quizzes and mock interviews, including weaker areas.'),
    resourceDescription: z.string().describe('Description of the learning resource.'),
  }),
  outputSchema: z.object({ isUseful: z.boolean() }),
}, async (input) => {
  // Placeholder implementation: in a real app, this would use more sophisticated logic.
  // We're making it permissive for now to ensure the flow works.
  return { isUseful: true };
});


const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  tools: [resourceUsefulnessTool],
  input: { schema: PersonalizedRecommendationsInputSchema },
  output: { schema: PersonalizedRecommendationsOutputSchema },
  prompt: `You are an AI learning assistant that provides personalized recommendations for quizzes, articles, and study materials based on a user's past performance.

  Here's the user's performance data:
  Quiz Responses: {{#each quizResponses}}- Quiz ID: {{this.quizId}}, Score: {{this.score}}, Category: {{this.category}}{{/each}}
  Mock Interview Responses: {{#each mockInterviewResponses}}- Interview ID: {{this.interviewId}}, Score: {{this.score}}, Category: {{this.category}}, Feedback: {{this.feedback}}{{/each}}

  Available Resources: {{#each availableResources}}- Resource ID: {{this.resourceId}}, Title: {{this.title}}, Category: {{this.category}}, Type: {{this.type}}, URL: {{this.url}}, Description: {{this.description}}{{/each}}

  First, summarize the user's weaker areas based on their quiz and mock interview performance. Then, for each available resource, determine if it could be useful for the user.
  
  CRITICAL: If the user has very little performance data, provide general high-quality recommendations from the availableResources that are suitable for a beginner. 
  
  Use the isResourceUseful tool to validate each recommendation. Aim to provide 3-5 recommendations whenever possible. Even if the user is performing well, suggest advanced materials to keep them challenged.
  
  Output the results in the specified schema.
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});
