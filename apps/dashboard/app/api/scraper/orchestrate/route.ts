import { NextResponse } from 'next/server';

// Mock Apify Trigger Function (Since MCP is not connected)
async function triggerApifyActor(actorId: string, input: any) {
    // In a real environment, this makes a POST to https://api.apify.com/v2/acts/{actorId}/runs
    console.log(`[Apify Orchestrator] Triggering Actor: ${actorId} with input:`, input);

    // Mock artificial delay to simulate scraping
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Response
    if (actorId === 'swiss-real-estate') {
        return [{ title: 'Swiss Immo Group', location: 'Zurich', properties: 45 }];
    } else if (actorId === 'google-maps') {
        return [{ title: 'Swiss Immo Group AG', rating: 4.8, reviews: 120, phone: '+41 44 123 4567' }];
    }
    return [];
}

// Data Normalization Logic
function normalizeLeadData(results: any[]) {
    // Merge multiple array sources into a single consolidated lead object
    const merged = results.flat().reduce((acc, curr) => {
        return { ...acc, ...curr };
    }, {});

    // -------------------------------------------------------------
    // MIDDLE-LAYER PRE-SCORING: Data Completeness Evaluation
    // The richer the data, the higher priority the lead.
    // -------------------------------------------------------------
    let completenessScore = 30; // Base baseline

    // 1. Digital Footprint (High value for automation pitch)
    if (merged.website || merged.url) completenessScore += 20;

    // 2. Direct Contact Info
    if (merged.phone) completenessScore += 10;
    if (merged.email) completenessScore += 15;

    // 3. Simulated/Mock enriched metrics (e.g. traffic/team size)
    // If we had a web-traffic API, we'd check `monthly_visits > 5000`
    if (merged.rating > 4.5) completenessScore += 15;
    if (merged.properties && merged.properties > 20) completenessScore += 10; // "SME" size

    // Final score cap
    const finalScore = Math.min(completenessScore, 100);

    return {
        ...merged,
        data_completeness_score: finalScore,
        is_priority_lead: finalScore >= 75 ? true : false,
        normalized_at: new Date().toISOString(),
        status: finalScore >= 50 ? 'READY_FOR_OUTREACH' : 'NEEDS_ENRICHMENT'
    };
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { searchQuery, location } = body;

        if (!searchQuery) {
            return NextResponse.json({ error: 'Missing searchQuery' }, { status: 400 });
        }

        console.log(`[Scraper API] Starting multiactor scrape for: ${searchQuery} in ${location}`);

        // Trigger actors concurrently
        const [immoResults, mapsResults] = await Promise.all([
            triggerApifyActor('swiss-real-estate', { query: searchQuery, city: location }),
            triggerApifyActor('google-maps', { searchString: `${searchQuery} ${location}` })
        ]);

        // Normalize and Extract
        const processedLead = normalizeLeadData([immoResults, mapsResults]);

        return NextResponse.json({
            success: true,
            data: processedLead
        });

    } catch (error: any) {
        console.error('[Scraper API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
