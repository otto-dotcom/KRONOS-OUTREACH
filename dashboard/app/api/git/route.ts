import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message = 'Dashboard Automated Commit' } = body;

        console.log('[Git API] Orchestrating Git sequence...');

        // Warning: Executing git commands from Node backend in production should be tightly secured.
        // Ensure this endpoint is protected by Auth middleware.

        // 1. Add all changes
        await execAsync('git add .', { cwd: process.cwd() });

        // 2. Commit
        const { stdout: commitStdout, stderr: commitStderr } = await execAsync(`git commit -m "${message}"`, { cwd: process.cwd() }).catch(e => {
            // If nothing to commit, it throws an error. Handle gracefully.
            if (e.message.includes('nothing to commit')) {
                return { stdout: 'nothing to commit', stderr: '' };
            }
            throw e;
        });

        if (commitStdout === 'nothing to commit') {
            return NextResponse.json({ success: true, message: 'Nothing to commit.' });
        }

        // 3. Push
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
