'use server';

import {
  conductMockInterview,
  MockInterviewInput,
} from '@/ai/ai-mock-interview';
import {
  generatePersonalizedRecommendations,
  PersonalizedRecommendationsInput,
} from '@/ai/flows/personalized-recommendations';
import { generateInterviewFeedback, InterviewFeedbackInput } from '@/ai/flows/interview-feedback';

export async function getRecommendationsAction(
  input: PersonalizedRecommendationsInput
) {
  try {
    console.log("Server Action: Generating recommendations for user:", input.userId);
    const recommendations = await generatePersonalizedRecommendations(input);
    console.log("Server Action: Successfully generated recommendations.");
    return recommendations;
  } catch (error) {
    console.error('Server Action Error generating recommendations:', error);
    return { recommendations: [] };
  }
}

export async function conductMockInterviewAction(input: MockInterviewInput) {
  try {
    // console.log("Conducting mock interview step for:", input.jobTitle);
    const response = await conductMockInterview(input);
    return response;
  } catch (error: any) {
    console.error('Error in mock interview action Full Details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(error.message || 'Failed to generate response');
  }
}

export async function getInterviewFeedbackAction(input: InterviewFeedbackInput) {
  try {
    const feedback = await generateInterviewFeedback(input);
    return feedback;
  } catch (error: any) {
    console.error('Error generating interview feedback Full Details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw new Error(error.message || 'Failed to generate feedback');
  }
}
