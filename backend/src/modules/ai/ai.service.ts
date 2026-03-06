import fs from 'fs';
import path from 'path';

let cachedSystemPrompt: string | null = null;

const getSystemPrompt = (): string => {
    if (cachedSystemPrompt) return cachedSystemPrompt;

    const possiblePaths = [
        path.resolve(__dirname, '../../../../../system_prompt.md'),
        path.resolve(__dirname, '../../../../system_prompt.md'),
        path.resolve(__dirname, '../../../system_prompt.md'),
        path.resolve(process.cwd(), '../../system_prompt.md'),
        path.resolve(process.cwd(), '../system_prompt.md'),
        'c:\\Cursor\\planner\\system_prompt.md',
    ];

    for (const p of possiblePaths) {
        try {
            if (fs.existsSync(p)) {
                console.log('[AiService] Found system_prompt.md at:', p);
                cachedSystemPrompt = fs.readFileSync(p, 'utf8');
                return cachedSystemPrompt;
            }
        } catch {
            // skip
        }
    }

    console.error("[AiService] Could not find system_prompt.md. Falling back to default.");
    return "You are an expert AI architect. Generate a comprehensive architectural plan.";
};

// Models to try in order. If the primary free model is rate-limited, fall back.
const MODELS = [
    "arcee-ai/trinity-large-preview:free",
    "zh-ai/glm-4.5-air:free"
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class AiService {
    private getApiKey(): string {
        return (process.env.OPENROUTER_API_KEY || "").replace(/^"|"$/g, '').trim();
    }

    async generateArchitectureStream(
        userPrompt: string,
        onStatus?: (msg: string) => void
    ): Promise<ReadableStreamDefaultReader<Uint8Array> | null> {
        const systemPrompt = getSystemPrompt();
        const apiKey = this.getApiKey();

        if (!apiKey) {
            throw new Error("OPENROUTER_API_KEY is missing. Please set it in .env file.");
        }

        // Try each model with retry logic
        for (let modelIdx = 0; modelIdx < MODELS.length; modelIdx++) {
            const model = MODELS[modelIdx];
            const maxRetries = 2;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                const attemptLabel = `[Model: ${model}, Attempt: ${attempt + 1}/${maxRetries + 1}]`;
                console.log(`[AiService] ${attemptLabel} Sending request...`);
                onStatus?.(`Connecting to AI...`);

                try {
                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${apiKey}`,
                            "HTTP-Referer": "http://localhost:3000",
                            "X-Title": "Blueprinx",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userPrompt }
                            ],
                            stream: true
                        })
                    });

                    if (response.ok) {
                        console.log(`[AiService] ${attemptLabel} Stream started successfully.`);
                        onStatus?.(`Building the plan...`);
                        return response.body ? response.body.getReader() : null;
                    }

                    const errorBody = await response.text();
                    console.warn(`[AiService] ${attemptLabel} Error ${response.status}: ${errorBody}`);

                    // If rate limited, retry with backoff or try next model
                    if (response.status === 429) {
                        if (attempt < maxRetries) {
                            const waitMs = (attempt + 1) * 3000;
                            onStatus?.(`Waiting for capacity...`);
                            await sleep(waitMs);
                            continue;
                        }
                        // Exhausted retries for this model, try the next one
                        onStatus?.(`Trying a different path...`);
                        break;
                    }

                    // For non-429 errors, throw immediately
                    throw new Error(`OpenRouter error (${response.status}): ${errorBody}`);
                } catch (err: any) {
                    if (err.message?.includes('OpenRouter error')) throw err;
                    // Network errors — retry
                    if (attempt < maxRetries) {
                        const waitMs = (attempt + 1) * 2000;
                        onStatus?.(`Improving connection...`);
                        await sleep(waitMs);
                        continue;
                    }
                    break;
                }
            }
        }

        throw new Error("All AI models are currently rate-limited. Please try again in a few minutes.");
    }
}

export const aiService = new AiService();
