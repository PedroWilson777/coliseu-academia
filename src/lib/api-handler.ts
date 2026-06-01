// Utilitário para simplificar rotas de API com tratamento de erro padronizado
// Uso: export const GET = apiHandler(async (req) => { ... return NextResponse.json(...) })

import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (req: NextRequest, ctx?: { params: Record<string, string> }) => Promise<NextResponse>;

export function apiHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ [${req.method}] ${req.nextUrl.pathname}:`, msg);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  };
}

// Versão para rotas sem parâmetro de request
export function apiHandlerSimple(handler: () => Promise<NextResponse>): () => Promise<NextResponse> {
  return async () => {
    try {
      return await handler();
    } catch (error) {
      console.error('❌ API Error:', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  };
}
