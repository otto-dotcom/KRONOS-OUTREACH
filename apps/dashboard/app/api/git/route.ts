import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Sanitize commit message: strip shell metacharacters
function sanitizeMessage(raw: string): string {
    return raw.replace(/[`$\\|;&<>(){}!]/g, '').trim().slice(0, 200) || 'Dashboard Automated Commit';
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const message = sanitizeMessage(body.message ?? '');

        console.log('[Git API] Orchestrating Git sequence...');

        await execAsync('git add .', { cwd: process.cwd() });

        const { stdout: commitStdout } = await execAsync(
            `git commit -m "${message}"`,
            { cwd: process.cwd() }
        ).catch(e => {
            if (e.message.includes('nothing to commit')) {
                return { stdout: 'nothing to commit', stderr: '' };
            }
            throw e;
        });

        if (commitStdout === 'nothing to commit') {
            return NextResponse.json({ success: true, message: 'Nothing to commit.' });
        }

        await execAsync('git push origin HEAD', { cwd: process.cwd() });

        return NextResponse.json({
            success: true,
            message: 'Successfully orchestrated Git push.',
            details: commitStdout
        });

    } catch (error: any) {
        console.error('[Git API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
