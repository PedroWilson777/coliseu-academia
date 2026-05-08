// Middleware - atualiza sessão Supabase em todas as requisições
// e redireciona usuários não logados pra /login

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Rotas públicas (sem autenticação)
  const publicPaths = ['/login', '/auth/callback'];
  const isPublic = publicPaths.some(p => path.startsWith(p));

  // Rotas de API que NÃO precisam autenticação (webhook do WhatsApp)
  const isWebhook = path.startsWith('/api/webhook');

  // Imagens dos planos (precisam ser públicas pro WhatsApp baixar)
  const isPublicImage = path.startsWith('/planos/');

  if (!user && !isPublic && !isWebhook && !isPublicImage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se tá logado e tentando acessar /login, redireciona pro painel
  if (user && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match em todas as rotas exceto:
     * - _next/static
     * - _next/image
     * - favicon
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
