import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const role = request.cookies.get('app_role')?.value;
    const status = request.cookies.get('app_status')?.value;
    const path = request.nextUrl.pathname;

    // Proteção de rotas Admin: apenas usuários configurados como ADMIN no BD terão acesso 
    // (ex: Contas de Weverton, Bruno e João deverão usar Role.ADMIN)
    if (path.startsWith('/admin') && role !== 'ADMIN') {
        console.info(`[Middleware] Redirecionando ADMIN: role=${role}, path=${path}`);
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (!role && path === '/') {
        console.info(`[Middleware] Redirecionando Auth: path=${path}`);
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (role && path === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Bloqueia médicos com status BLOCKED das rotas principais do sistema
    const isAnamneseRoute = path === '/' || path.startsWith('/templates') || path.startsWith('/paciente');
    if (isAnamneseRoute && status === 'BLOCKED') {
        // Redireciona para uma tela de bloqueio (pode ser mockada no próprio login c/ error query)
        return NextResponse.redirect(new URL('/login?error=Conta%20Bloqueada', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/login', '/admin/:path*', '/templates/:path*', '/paciente/:path*'],
};
