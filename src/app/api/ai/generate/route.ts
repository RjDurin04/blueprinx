import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { tasks } from "@trigger.dev/sdk/v3";

const MAX_PROMPT_LENGTH = 5000;

export async function POST(request: Request) {
    try {
        // ── CSRF / Origin validation ──
        const origin = request.headers.get('origin');
        const allowedOrigins = [
            process.env.NEXT_PUBLIC_SITE_URL,
            'http://localhost:3000',
            'http://localhost:3001',
        ].filter(Boolean);

        if (!origin || !allowedOrigins.includes(origin)) {
            return Response.json({ error: { code: 'FORBIDDEN', message: 'Invalid request origin.' } }, { status: 403 });
        }

        // ── Auth check ──
        let user;
        const supabase = await createClient(); // Still used for DB operations below
        try {
            const session = await auth.api.getSession({
                headers: request.headers
            });
            user = session?.user;
        } catch (authErr) {
            const authMessage = authErr instanceof Error ? authErr.message : String(authErr);
            console.warn('[AI Route] Better Auth verification failed:', authMessage);
            return Response.json({ error: { code: 'UNAVAILABLE', message: 'Auth service unavailable.' } }, { status: 503 });
        }

        if (!user) {
            return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
        }

        // ── Rate limiting ──
        const rateCheck = await checkRateLimit(user.id);
        if (!rateCheck.allowed) {
            return Response.json({
                error: { code: 'RATE_LIMITED', message: `Too many generations. Try again in ${Math.ceil(rateCheck.retryAfterSeconds / 60)} minutes.` }
            }, { status: 429 });
        }

        if (!process.env.TRIGGER_SECRET_KEY) {
            console.error('[AI Route Error] TRIGGER_SECRET_KEY is missing from environment variables.');
            return Response.json({ error: { code: 'CONFIG_ERROR', message: 'Generating plans is currently unavailable because the background task worker is not configured.' } }, { status: 503 });
        }

        // ── Input validation ──
        const body = await request.json();
        const prompt = body?.prompt;
        const existingPlanId = body?.planId;

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return Response.json({ error: { code: 'BAD_REQUEST', message: 'A valid text prompt is required.' } }, { status: 400 });
        }

        if (prompt.length > MAX_PROMPT_LENGTH) {
            return Response.json({ error: { code: 'BAD_REQUEST', message: `Prompt must be under ${MAX_PROMPT_LENGTH} characters.` } }, { status: 400 });
        }

        let currentPlanId = existingPlanId;

        // ── Database Initialization ──
        if (currentPlanId) {
            await supabase.from('plans').update({ status: 'generating', content: '', updated_at: new Date().toISOString() }).eq('id', currentPlanId).eq('user_id', user.id);
        } else {
            const { data: existingGenerating } = await supabase.from('plans').select('id').eq('user_id', user.id).eq('status', 'generating').limit(1);

            if (existingGenerating && existingGenerating.length > 0) {
                return Response.json({ error: { code: 'CONFLICT', message: 'A plan is already being generated.' } }, { status: 409 });
            }

            const { data, error: dbError } = await supabase.from('plans').insert({
                user_id: user.id,
                title: 'Generating Plan...',
                prompt,
                content: '',
                status: 'generating',
            }).select('id').single();

            if (dbError) throw new Error("Failed to insert plan.");
            currentPlanId = data.id;
        }

        // ── Background Task Trigger ──
        // Seamlessly offload the heavy OpenRouter streaming to Trigger.dev v3 Worker
        try {
            await tasks.trigger("generate-plan", {
                prompt,
                planId: currentPlanId,
                userId: user.id
            });
        } catch (triggerError: unknown) {
            const errBase = triggerError instanceof Error ? triggerError.message : String(triggerError);
            console.error('[AI Route Error] Background task failed to trigger:', errBase);
            if (currentPlanId) {
                await supabase.from('plans').update({
                    status: 'error',
                    title: 'Generation Failed',
                    content: 'An error occurred while attempting to start the generation process.',
                    updated_at: new Date().toISOString()
                }).eq('id', currentPlanId).eq('user_id', user.id);
            }
            throw new Error(`Background worker could not be triggered: ${errBase}`);
        }

        // Instantly return the plan ID so the frontend can subscribe via Supabase Realtime
        return Response.json({ success: true, planId: currentPlanId });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        console.error('[AI Route Error]', errorMessage);
        return Response.json({ error: { code: 'AI_SERVICE_ERROR', message: errorMessage } }, { status: 500 });
    }
}
