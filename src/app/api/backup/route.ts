import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Path to the sqlite database file
        const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

        if (!fs.existsSync(dbPath)) {
            return new NextResponse("Database file not found", { status: 404 });
        }

        const fileBuffer = fs.readFileSync(dbPath);

        const response = new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Disposition': 'attachment; filename="anamnese_backup.db"',
                'Content-Type': 'application/x-sqlite3',
                'Content-Length': fileBuffer.length.toString(),
            },
        });

        return response;
    } catch (error) {
        console.error("Error downloading database backup:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
