// Serve unique, crawlable canonical metadata for each published MarketingCy article.
const supabase='https://lgrqurlpkogsbiidmuaa.supabase.co/rest/v1/cms_blog_posts';
const key='sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_';
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(req,res){
 if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).end();
 const slug=String(req.query.slug||'');
 if(!/^[a-z0-9-]{1,180}$/.test(slug))return res.status(404).send('Article not found');
 try{
  const api=await fetch(supabase+'?select=slug,title,seo_title,meta_description,featured_image&status=eq.published&slug=eq.'+encodeURIComponent(slug)+'&limit=1',{headers:{apikey:key},signal:AbortSignal.timeout(6000)});
  if(!api.ok)throw Error('CMS unavailable');
  const posts=await api.json();
  if(!posts.length)return res.status(404).send('Article not found');
  const origin='https://www.marketingcy.com';
  const page=await fetch(origin+'/blog/article/',{signal:AbortSignal.timeout(6000)});
  if(!page.ok)throw Error('Article template unavailable');
  let html=await page.text();
  const p=posts[0],canonical=origin+'/blog/'+encodeURIComponent(slug)+'/';
  html=html.replace(/<link rel="canonical" id="page-canonical" href="[^"]*">/,'<link rel="canonical" id="page-canonical" href="'+canonical+'">');
  html=html.replace(/<title>[^<]*<\/title>/,'<title>'+escapeHtml((p.seo_title||p.title)+' | MarketingCy')+'</title>');
  html=html.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+escapeHtml(p.meta_description||p.title)+'">');
  const image=p.featured_image&&/^https:\/\//i.test(p.featured_image)?p.featured_image:origin+'/assets/blog/marketingcy-social-preview-1200x630.jpg';
  const tags={'og:type':'article','og:url':canonical,'og:title':(p.seo_title||p.title)+' | MarketingCy','og:description':p.meta_description||p.title,'og:image':image,'twitter:title':(p.seo_title||p.title)+' | MarketingCy','twitter:description':p.meta_description||p.title,'twitter:image':image};
  for(const [name,value] of Object.entries(tags)){const attr=name.startsWith('twitter:')?'name':'property';const re=new RegExp('<meta '+attr+'="'+name+'" content="[^"]*">');html=html.replace(re,'<meta '+attr+'="'+name+'" content="'+escapeHtml(value)+'">')}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(html);
 }catch(e){console.error('Article metadata rendering error',e.message);return res.status(503).send('Article temporarily unavailable')}
}
