import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return Response.json({ status: 'ok', db: 'up' });
    } catch {
        return Response.json({ status: 'degraded', db: 'down' }, { status: 503 });
    }
}
