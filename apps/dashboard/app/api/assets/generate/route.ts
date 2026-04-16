import { NextResponse } from 'next/server';

const KIE_AI_URL = process.env.KIE_AI_URL || 'https://api.kie.ai/v1/images/generations';
const KIE_API_KEY = process.env.KIE_API_KEY || '';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
        }

        // Automating the KRONOS Pixel-Retro aesthetic enforcement
        const engineeredPrompt = `[AESTHETIC: Pixel-Retro meets Swiss Elite. Hyper-Orange (#FF6B00) accents. Dark Onyx background. High contrast, professional cypherpunk styling, macro-pixelated]. ${prompt}`;

        console.log(`[Asset Gen API] Generating KRONOS Asset for prompt: ${engineeredPrompt}`);

        if (!KIE_API_KEY) {
            return NextResponse.json({
                error: "Image generation is disabled until KIE_API_KEY is configured.",
                status: "unavailable",
            }, { status: 501 });
        }

        const response = await fetch(KIE_AI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIE_API_KEY}`
            },
            body: JSON.stringify({
                model: "kie-vision-standard", // Substitute for actual model ID
                prompt: engineeredPrompt,
                n: 1,
                size: "1024x1024"
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Failed to generate image');
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            data: {
                url: data.data[0].url,
                prompt_used: engineeredPrompt
            }
        });

    } catch (error: any) {
        console.error('[Asset Gen API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
