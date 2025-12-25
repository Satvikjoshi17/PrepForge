import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const MODELS = {
    FAST: 'googleai/gemini-2.0-flash',
    ROBUST: 'googleai/gemini-pro',
};

type FallbackOptions<I extends z.ZodTypeAny, O extends z.ZodTypeAny> = {
    prompt: string;
    input: z.infer<I>;
    inputSchema?: I;
    outputSchema?: O;
    temperature?: number;
};

/**
 * Generates content using a primary model with automatic fallback to a secondary model.
 */
export async function generateWithFallback<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
    options: FallbackOptions<I, O>
): Promise<z.infer<O>> {
    const { prompt, input, inputSchema, outputSchema, temperature } = options;

    // Render the prompt manually - for simplicity in this helper, we assume the prompt string 
    // already uses handlebars syntax or similar, but since we are using 'ai.generate' raw,
    // we might need to interpolate manually if we don't use definePrompt.
    // 
    // However, Genkit's `generate` accepts a prompt string.
    // To keep it simple and compatible with existing prompt templates (handlebars):
    // We will simple assume the prompt passed in is a raw string/template.
    // BUT the existing code uses `definePrompt` which handles inputs.

    // STRATEGY: We will try to define an ad-hoc prompt or just use generate with the input.
    // Actually, passing `prompt: string` to ai.generate usually expects specific formatting or just text.
    // Let's rely on simple string interpolation for this helper for now 
    // OR better: use `ai.generate` which supports 'prompt' as string.

    // Wait, if I use `ai.definePrompt`, it registers it. I don't want to register multiple prompts dynamically.
    // I will assume `prompt` is a function that returns a string, OR simpler:
    // The caller manually interpolates the string.

    // Let's try the primary model
    try {
        // console.log(`Attempting generation with ${MODELS.FAST}...`);
        const { output } = await ai.generate({
            model: MODELS.FAST,
            prompt: options.prompt, // This assumes 'prompt' is the final string or close to it
            output: { schema: outputSchema },
            config: { temperature },
        });
        return output;
    } catch (error: any) {
        console.warn(`Primary model ${MODELS.FAST} failed: ${error.message}. Failing over to ${MODELS.ROBUST}...`);

        // Fallback to robust model
        try {
            const { output } = await ai.generate({
                model: MODELS.ROBUST,
                prompt: options.prompt,
                output: { schema: outputSchema },
                config: { temperature },
            });
            return output;
        } catch (finalError: any) {
            console.error(`All models failed. Last error: ${finalError.message}`);
            throw new Error(`AI Service Unavailable: ${finalError.message}`);
        }
    }
}
