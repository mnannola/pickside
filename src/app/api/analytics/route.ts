import { NextResponse } from 'next/server';
import { z } from 'zod';
import { allowedOrigin, readJson } from '@/lib/http';
import { analyticsEnabled, recordFlow } from '@/lib/analytics';
import { voterHash } from '@/lib/identity';
import { currentCreator } from '@/lib/supabase/server';
const schema = z.object({ event: z.enum(['matchup_open','share_copy','share_native']), slug:z.string().regex(/^[\w-]{10}$/) });
export async function POST(request: Request) {
 if (!allowedOrigin(request)) return new NextResponse(null,{status:403});
 if (!analyticsEnabled() || request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1') return new NextResponse(null,{status:204});
 let data;
 try { data = schema.parse(await readJson(request)); } catch { return new NextResponse(null,{status:400}); }
 try {
  const hash = await voterHash();
  if (!hash) return new NextResponse(null,{status:204});
  const user = await currentCreator();
  await recordFlow(data.event,hash,data.slug,user?.id);
 } catch { /* Best effort analytics. */ }
 return new NextResponse(null,{status:204,headers:{'Cache-Control':'no-store'}});
}
