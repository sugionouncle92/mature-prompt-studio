import type { GenerationInput, PromptResult } from '../types/index.ts';

export interface ModelValidationResult {
  valid: boolean;
  message: string;
  availableModels?: string[];
}

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Tests API key and Model ID against the official Gemini endpoint.
   * If the model does not exist or fails, returns descriptive error message.
   */
  public async testConnection(apiKey: string, modelId: string): Promise<ModelValidationResult> {
    const cleanedKey = apiKey.trim();
    const cleanedModel = modelId.trim();

    if (!cleanedKey) {
      return { valid: false, message: 'API Key cannot be empty.' };
    }
    if (!cleanedModel) {
      return { valid: false, message: 'Model ID cannot be empty.' };
    }

    // Sanitize model id (strip models/ prefix if entered)
    const normalizedModel = cleanedModel.startsWith('models/') 
      ? cleanedModel.replace('models/', '') 
      : cleanedModel;

    try {
      // 1. First test checking the specific model metadata
      const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(normalizedModel)}?key=${encodeURIComponent(cleanedKey)}`;
      const response = await fetch(modelUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 400 || response.status === 403) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || 'Invalid API Key or permission denied.';
          return { valid: false, message: `Authentication Error: ${errMsg}` };
        }

        if (response.status === 404) {
          // Model not found - fetch list of models to assist the user
          const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanedKey)}`;
          const listRes = await fetch(listUrl).catch(() => null);
          let recommended: string[] = [];
          if (listRes && listRes.ok) {
            const listData = await listRes.json();
            if (Array.isArray(listData.models)) {
              recommended = listData.models
                .filter((m: { supportedGenerationMethods?: string[] }) => 
                  m.supportedGenerationMethods?.includes('generateContent')
                )
                .map((m: { name: string }) => m.name.replace('models/', ''))
                .slice(0, 8);
            }
          }

          return {
            valid: false,
            message: `Model '${cleanedModel}' was not found in the Gemini API catalog (404 Not Found). Official recommended models include: ${
              recommended.length > 0 ? recommended.slice(0, 4).join(', ') : 'gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash'
            }. Please choose a valid model.`,
            availableModels: recommended,
          };
        }

        if (response.status === 429) {
          return { valid: false, message: 'API quota exceeded or rate limit reached (429).' };
        }

        return { valid: false, message: `Gemini API returned status ${response.status}: ${response.statusText}` };
      }

      const modelInfo = await response.json();
      if (modelInfo && !modelInfo.supportedGenerationMethods?.includes('generateContent')) {
        return {
          valid: false,
          message: `Model '${cleanedModel}' exists but does not support 'generateContent'. Please choose a generative model.`,
        };
      }

      return {
        valid: true,
        message: `Connection successful! Connected to '${modelInfo.displayName || normalizedModel}'.`,
      };
    } catch (err: unknown) {
      const errStr = err instanceof Error ? err.message : 'Unknown network failure';
      return {
        valid: false,
        message: `Network failure connecting to Gemini API: ${errStr}. Check your internet connection or proxy.`,
      };
    }
  }

  /**
   * Generates prompt variations using Gemini API with strict prompt engineering.
   */
  public async generatePrompts(
    apiKey: string,
    modelId: string,
    input: GenerationInput
  ): Promise<PromptResult[]> {
    const cleanedKey = apiKey.trim();
    const cleanedModel = modelId.trim();

    if (!cleanedKey) {
      throw new Error('API Key is required. Please configure your key in "API & Pengaturan".');
    }
    if (!cleanedModel) {
      throw new Error('Model ID is required.');
    }

    const normalizedModel = cleanedModel.startsWith('models/') 
      ? cleanedModel.replace('models/', '') 
      : cleanedModel;

    // Build the system prompt
    const systemInstructionText = this.buildSystemInstruction(input);
    const userPromptContent = this.buildUserPrompt(input);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(normalizedModel)}:generateContent?key=${encodeURIComponent(cleanedKey)}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPromptContent }],
        },
      ],
      generationConfig: {
        temperature: 0.75,
        topP: 0.95,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            prompts: {
              type: 'ARRAY',
              description: 'Array of complete, standalone, copy-ready English image generation prompts.',
              items: {
                type: 'STRING',
              },
            },
          },
          required: ['prompts'],
        },
      },
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network request failed';
      throw new Error(`Network failure during generation: ${msg}`);
    }

    if (!response.ok) {
      if (response.status === 400 || response.status === 403) {
        throw new Error('Invalid Gemini API Key or authentication failure (401/403). Check your key in Settings.');
      }
      if (response.status === 404) {
        throw new Error(`Model '${cleanedModel}' was not found on Gemini API. Please select a valid model in Settings.`);
      }
      if (response.status === 429) {
        throw new Error('Gemini API rate limit or quota exceeded (429). Please wait a moment or check your Google AI quota.');
      }
      const errorJson = await response.json().catch(() => null);
      const detail = errorJson?.error?.message || response.statusText;
      throw new Error(`Gemini API error (${response.status}): ${detail}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];

    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      if (candidate?.finishReason === 'SAFETY') {
        throw new Error('Generation was blocked by Gemini safety filters. Please refine scene themes to ensure consensual adult content.');
      }
      throw new Error('Received an empty response from Gemini API.');
    }

    const rawText = candidate.content.parts[0].text;
    const extractedPrompts = this.parseResponse(rawText, input.variationCount);

    if (extractedPrompts.length === 0) {
      throw new Error('Could not parse valid prompt variations from the model response.');
    }

    return extractedPrompts.map((p, idx) => ({
      id: `prompt-${Date.now()}-${idx}`,
      index: idx + 1,
      prompt: p,
    }));
  }

  private buildSystemInstruction(input: GenerationInput): string {
    const isUltra = input.photographicStyle.selected.includes('ultra-realistic') || 
                    input.photographicStyle.selected.includes('Ultra Realistic');

    return `You are an expert English-language AI image prompt engineer for external AI image generators (e.g. Midjourney, ChatGPT, Miora).
Your task is to transform user-provided sample prompts and/or keywords into coherent, detailed, standalone prompts.

RULES & BOUNDARIES:
- TEXT ONLY: You generate text only. You do not generate, edit, or return images.
- STANDALONE PROMPTS: Every variation must be a complete, self-contained prompt ready to be pasted directly into an external image generator.
- NO COMMENTARY: Return ONLY the prompt text. DO NOT include titles, numbers, markdown headings inside the prompt, commentary, notes, summaries, prompt scores, explanations, quotation marks, or preamble.
- LANGUAGE: The final prompts must ALWAYS be in natural, descriptive English, regardless of input language.

ADULT & CONSENSUAL CONTENT REQUIREMENTS:
- All depicted characters in mature, romantic, or sensual themes must be clearly established adults aged 25 or older.
- All intimate, romantic, or sensual interactions must be explicitly consensual adult interactions.
- Absolutely never sexualize minors or ambiguous-age characters. Do not portray coercion as consensual intimacy.
- Maintain respectful adult aesthetic standards without vulgar anatomical obscenity.

${isUltra ? `ULTRA REALISTIC RENDERING MANDATE:
- Prioritize authentic camera-captured appearance, anatomically plausible human proportions, and detailed natural skin microtexture with visible pores, fine lines, and subtle natural imperfections.
- Describe realistic eyes, natural moisture reflection, distinct eyelashes, individual hair strands, believable fabric fibers, and clothing folds.
- Emphasize physically plausible lighting, consistent direction of illumination, natural depth of field, and optical fidelity.
- Strictly AVOID: plastic/waxy skin, oversmoothing, artificial symmetry, exaggerated body proportions, synthetic digital grain, fake pores, and CGI/3D render appearance.
- Do NOT simply append the phrase 'ultra realistic'; substantively enrich the descriptions of skin, hair, cloth, lighting, and optical depth.` : ''}

CHARACTER LOCKS ENFORCEMENT:
Treat all active locks as hard prompt constraints:
${this.buildLocksInstruction(input.characterLocks)}

VARIATIONS DIVERSITY:
- Each variation must create meaningful differences through actions, gestures, emotional beats, character interaction, timing, environmental blocking, and composition.
- Do NOT simply swap synonyms (e.g. replacing 'beautiful' with 'attractive').
- Maintain core identity, active locks, and selected Story Style consistently across all variations.`;
  }

  private buildLocksInstruction(locks: GenerationInput['characterLocks']): string {
    const active: string[] = [];
    if (locks.facelock) active.push("- /facelock 100%: Strictly preserve the facial identity, facial bone structure, and distinctive facial features from the sample prompt.");
    if (locks.bodyshape) active.push("- /bodyshape lock: Strictly maintain the exact body shape, build, and physical proportions.");
    if (locks.outfitlock) active.push("- /outfitlock: Strictly keep the exact clothing style, fabric type, colors, and garment details.");
    if (locks.poselock) active.push("- /poselock: Strictly retain the primary body pose and physical stance without drastic alteration.");
    if (locks.agepreserve) active.push("- /agepreserve: Strictly preserve the adult age (clearly 25+ years old), maintaining authentic mature maturity.");
    if (locks.expressionlock) active.push("- /expressionlock: Strictly preserve the exact core facial expression.");
    if (locks.hairlock) active.push("- /hairlock: Strictly maintain the exact hairstyle, length, texture, and color.");

    if (active.length === 0) {
      return "No character locks active. Subtle natural variations in pose, clothing, and expression are permitted.";
    }
    return active.join('\n');
  }

  private buildUserPrompt(input: GenerationInput): string {
    const parts: string[] = [];

    parts.push(`Generate exactly ${input.variationCount} standalone, copy-ready English image prompt variation(s) based on the following instructions:`);

    if (input.samplePrompt.trim()) {
      parts.push(`\n[PROMPT SAMPLE (Source of Truth for Scene & Identity)]:\n${input.samplePrompt.trim()}`);
    }

    if (input.keywords.trim()) {
      parts.push(`\n[KEYWORDS / SCENE IDEA]:\n${input.keywords.trim()}`);
    }

    // Story Style
    const storyParts: string[] = [];
    if (input.storyStyle.primary) {
      storyParts.push(`Primary Style: "${input.storyStyle.primary}" (determines scene narrative, action, core interaction)`);
    }
    if (input.storyStyle.supporting && input.storyStyle.supporting.length > 0) {
      storyParts.push(`Supporting Styles: ${input.storyStyle.supporting.map(s => `"${s}"`).join(', ')} (enriches atmosphere)`);
    }
    if (input.storyStyle.custom.trim()) {
      storyParts.push(`Custom Story Style: "${input.storyStyle.custom.trim()}"`);
    }

    if (storyParts.length > 0) {
      parts.push(`\n[STORY STYLE DIRECTIONS]:\n${storyParts.join('\n')}`);
    } else {
      parts.push(`\n[STORY STYLE]: None selected. Do not force an artificial narrative genre.`);
    }

    // Photographic Style
    const photoParts: string[] = [];
    if (input.photographicStyle.selected.length > 0) {
      photoParts.push(`Selected Styles: ${input.photographicStyle.selected.join(', ')}`);
    }
    if (input.photographicStyle.custom.trim()) {
      photoParts.push(`Custom Photographic Style: "${input.photographicStyle.custom.trim()}"`);
    }
    if (photoParts.length > 0) {
      parts.push(`\n[PHOTOGRAPHIC RENDERING STYLES]:\n${photoParts.join('\n')}`);
    }

    // Active Locks
    const activeLockTags: string[] = [];
    if (input.characterLocks.facelock) activeLockTags.push('/facelock 100%');
    if (input.characterLocks.bodyshape) activeLockTags.push('/bodyshape lock');
    if (input.characterLocks.outfitlock) activeLockTags.push('/outfitlock');
    if (input.characterLocks.poselock) activeLockTags.push('/poselock');
    if (input.characterLocks.agepreserve) activeLockTags.push('/agepreserve');
    if (input.characterLocks.expressionlock) activeLockTags.push('/expressionlock');
    if (input.characterLocks.hairlock) activeLockTags.push('/hairlock');

    if (activeLockTags.length > 0) {
      parts.push(`\n[ACTIVE CHARACTER LOCKS - HARD CONSTRAINTS]:\n${activeLockTags.join(' ')}\nEnforce these locks strictly. Append the active lock flags to the prompt only if helpful for external generator tags, but above all integrate their hard constraints into the visual scene description.`);
    }

    parts.push(`\n[OUTPUT REQUIREMENT]:\nOutput a JSON object with a single field "prompts" containing an array of ${input.variationCount} string(s). Each string must be solely the final descriptive English prompt text, with no introductory labels, no markdown formatting inside the text, and no commentary.`);

    return parts.join('\n');
  }

  private parseResponse(raw: string, expectedCount: number): string[] {
    try {
      // 1. Try direct JSON parse
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
        return parsed.prompts.map((p: unknown) => this.cleanPromptText(String(p)));
      }
    } catch {
      // JSON parse failed; attempt markdown fence extraction
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
            return parsed.prompts.map((p: unknown) => this.cleanPromptText(String(p)));
          }
        } catch {
          // continue fallback
        }
      }
    }

    // Fallback: Split by double newlines or numbered lines if raw text was returned
    const lines = raw.split(/\n\s*\n/).map(l => this.cleanPromptText(l)).filter(l => l.length > 20);
    if (lines.length > 0) {
      return lines.slice(0, expectedCount);
    }

    return [this.cleanPromptText(raw)];
  }

  private cleanPromptText(text: string): string {
    return text
      .replace(/^Variation \d+[:\s-]*/i, '')
      .replace(/^Prompt \d+[:\s-]*/i, '')
      .replace(/^#+\s+/gm, '')
      .replace(/^"|"$/g, '')
      .trim();
  }
}
