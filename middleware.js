import { next } from '@vercel/functions';
const endpoint='https://lgrqurlpkogsbiidmuaa.supabase.co/rest/v1/cms_seo_redirects?select=source,destination';
const apikey='sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_';
let rules=[],updated=0;
export const config={matcher:['/((?!_vercel/).*)']};
export default async function middleware(request){
  if(request.method!=='GET'&&request.method!=='HEAD')return next();
  const url=new URL(request.url);
  if(url.hostname==='marketingcy.com'){url.hostname='www.marketingcy.com';return new Response(null,{status:301,headers:{Location:url.toString(),'Cache-Control':'public, max-age=0, s-maxage=3600'}});}
  if(/^(\/api\/|\/assets\/|\/cms\/|\/favicon\.ico$|\/robots\.txt$|\/llms\.txt$|\/sitemap\.xml$)/.test(url.pathname))return next();

  if(Date.now()-updated>60000){try{const response=await fetch(endpoint,{headers:{apikey},signal:AbortSignal.timeout(2500)});if(response.ok){const data=await response.json();if(Array.isArray(data)){rules=data;updated=Date.now()}}}catch(e){/* Keep existing cached rules; never block the website. */}}
  const pathname=url.pathname;
  const normalized=pathname.endsWith('/')?pathname.slice(0,-1):pathname;
  const rule=rules.find(x=>{const source=String(x.source||'');return source===pathname||(source.endsWith('/')?source.slice(0,-1):source)===normalized;});
  if(!rule)return next();
  const destination=String(rule.destination||'');
  let target;
  if(destination.startsWith('/')&&!destination.startsWith('//'))target=new URL(destination,url.origin);
  else if(/^https:\/\//i.test(destination)){try{target=new URL(destination)}catch(e){return next()}}else return next();
  if(!target||target.href===url.href)return next();
  if(!target.search)target.search=url.search;
  return new Response(null,{status:301,headers:{Location:target.toString(),'Cache-Control':'public, max-age=0, s-maxage=60'}});
}
