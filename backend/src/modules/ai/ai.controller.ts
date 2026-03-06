import { Request, Response } from 'express';
import { aiService } from './ai.service';

export const generatePlan = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'A valid text prompt is required.' } });
        }

        // Set headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Flush headers to establish connection immediately
        res.flushHeaders();

        // Status callback sends status updates to the frontend so user sees progress
        const onStatus = (msg: string) => {
            res.write(`data: ${JSON.stringify({ status: msg })}\n\n`);
        };

        onStatus("Reviewing your idea...");

        const reader = await aiService.generateArchitectureStream(prompt, onStatus);

        if (!reader) {
            throw new Error("No readable stream received from OpenRouter.");
        }

        onStatus("Writing the final plan...");

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim();
                    if (dataStr === '[DONE]') continue;

                    try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices?.[0]?.delta?.content;
                        if (content !== undefined && content !== null) {
                            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                        }
                    } catch (e: any) {
                        console.error(`[AI Parser Error] Failed to parse: ${dataStr}`, e.message);
                    }
                } else {
                    console.log(`[AI Stream Unhandled Line] ${line}`);
                }
            }
        }

        // Indicate end of stream
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error: any) {
        console.error('[AI Controller Error]', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: { code: 'AI_SERVICE_ERROR', message: error.message || 'Failed to generate plan.' } });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message || 'Internal Server Error during generation.' })}\n\n`);
            res.end();
        }
    }
};
