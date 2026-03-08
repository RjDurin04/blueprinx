import { logger, task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

// We strictly instantiate a specialized admin client for backend tasks
// using the service role key to bypass RLS during background generation
const getSupabase = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

const MODELS = [
    'arcee-ai/trinity-large-preview:free',
    'zh-ai/glm-4.5-air:free',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Payload = {
    prompt: string;
    planId: string;
    userId: string;
};

export const generatePlanTask = task({
    id: "generate-plan",
    maxDuration: 1800, // 30 minutes max execution time (to handle full 6000+ tokens)
    run: async (payload: Payload) => {
        logger.info("Starting plan generation", { payload });

        const { prompt, planId, userId } = payload;
        const supabase = getSupabase();

        try {
            // 1. Ensure status is 'generating' immediately
            await supabase
                .from("plans")
                .update({ status: "generating" })
                .eq("id", planId)
                .eq("user_id", userId);

            const apiKey = (process.env.OPENROUTER_API_KEY || "").replace(/^"|"$/g, "").trim();
            if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

            let finalContent = "";
            let isStreamSuccessful = false;
            let selectedModel = "";

            // 2. Fallback loop for robust model selection
            for (const model of MODELS) {
                const maxRetries = 2;
                for (let attempt = 0; attempt <= maxRetries; attempt++) {
                    logger.info(`Connecting to model: ${model}, attempt: ${attempt + 1}/${maxRetries + 1}`);

                    try {
                        const finalSystemPrompt = SYSTEM_PROMPT
                            .replace('[INSERT USER SYSTEM CONCEPT / RAW NOTES HERE]', prompt)
                            .replace(
                                '[INSERT ADAPTIVE DEPTH: LIGHT (CRUD) / STANDARD (Integrations) / EXHAUSTIVE (Multi-tenant, max compliance)]',
                                'EXHAUSTIVE (Complete 25-component specification)'
                            );

                        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${apiKey}`,
                                "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
                                "X-Title": "Blueprinx Background Worker",
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                model,
                                messages: [
                                    { role: "system", content: finalSystemPrompt },
                                    { role: "user", content: "Generate the complete architectural document now." },
                                ],
                                temperature: 0.1,    // More deterministic for code structure
                                max_tokens: 10000,   // Do not truncate the large output
                                stream: false,
                            }),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.choices?.[0]?.message?.content) {
                                finalContent = data.choices[0].message.content;
                                isStreamSuccessful = true;
                                selectedModel = model;
                                break;
                            } else {
                                logger.error("OpenRouter response missing content", { data });
                                throw new Error("API returned success but no content");
                            }
                        }

                        if (response.status === 429) {
                            // Rate limit wait
                            await sleep((attempt + 1) * 3000);
                            continue;
                        }

                        const errText = await response.text();
                        logger.warn(`OpenRouter error (${model}): ${response.status} ${errText}`);

                        if (attempt < maxRetries) {
                            await sleep((attempt + 1) * 2000);
                            continue;
                        }
                        break;
                    } catch (err: unknown) {
                        logger.error(`Error fetching from OpenRouter:`, { err });
                        if (attempt < maxRetries) {
                            await sleep((attempt + 1) * 2000);
                            continue;
                        }
                        break;
                    }
                }
                if (isStreamSuccessful) break;
            }

            if (!isStreamSuccessful) {
                // Status update handled by finally if we throw here
                throw new Error("All AI models failed to provide a valid response.");
            }

            logger.info(`Generation completed successfully using ${selectedModel}`);

            // 4. Final DB save and status update
            if (isStreamSuccessful) {
                let autoTitle = "Generating Plan...";
                const firstHeadingMatch = finalContent.match(/^\s*#\s+(.*)$/m);
                if (firstHeadingMatch && firstHeadingMatch[1]) {
                    autoTitle = firstHeadingMatch[1].trim();
                } else if (finalContent.length > 0) {
                    autoTitle = prompt.length > 40 ? prompt.substring(0, 40) + "..." : prompt;
                }

                const { error: finalError } = await supabase
                    .from("plans")
                    .update({
                        title: autoTitle,
                        content: finalContent,
                        status: "completed",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", planId)
                    .eq("user_id", userId);

                if (finalError) {
                    logger.error("Error finalizing plan in DB:", { error: finalError });
                    throw finalError;
                }

                logger.info("Plan generation completed and finalized successfully.", { finalTokenLength: finalContent.length });
            } else {
                throw new Error("Plan generation stream was interrupted or failed mid-flight.");
            }

            return { success: true, planId };
        } catch (err: unknown) {
            logger.error("Task failed:", { err });
            // Update status to failed
            await supabase
                .from("plans")
                .update({
                    status: "failed",
                    updated_at: new Date().toISOString()
                })
                .eq("id", planId)
                .eq("user_id", userId);
            throw err;
        } finally {
            // Check if status is still 'generating' (could happen on timeout)
            const { data } = await supabase
                .from("plans")
                .select("status")
                .eq("id", planId)
                .single();

            if (data?.status === "generating") {
                logger.warn("Plan stuck in generating state at end of task. Forcing failure status.");
                await supabase
                    .from("plans")
                    .update({
                        status: "failed",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", planId)
                    .eq("user_id", userId);
            }
        }
    },
});
