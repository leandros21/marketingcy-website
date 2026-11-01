(async()=>{try{
const slug=location.pathname.replace(/\/+$/,'/')||'/';
const endpoint='https://lgrqurlpkogsbiidmuaa.supabase.co/rest/v1/cms_published_pages?select=published_heading,published_summary,published_seo_title,published_meta_description,published_body&slug=eq.'+encodeURIComponent(slug);
const response=await fetch(endpoint,{headers:{apikey:'sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_'}});
if(!response.ok)return;const p=(await response.json())[0];if(!p)return;
const hero=document.querySelector('main .hero')||document.querySelector('main');
const heading=hero?.querySelector('h1'),summary=hero?.querySelector('h1 + p');
if(heading&&p.published_heading)heading.textContent=p.published_heading;
if(summary&&p.published_summary)summary.textContent=p.published_summary;
if(p.published_seo_title)document.title=p.published_seo_title;
const meta=document.querySelector('meta[name="description"]');
if(meta&&p.published_meta_description)meta.content=p.published_meta_description;
/* Preserve original layout, images, links, and any unmatched content.
   Only apply one-for-one edits to existing visible text blocks. */
const original=(window.marketingcyImportedContent||[]).find(x=>x.slug===slug);
if(original&&typeof p.published_body==='string'&&p.published_body!==original.body){
 const lines=s=>s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const before=lines(original.body),after=lines(p.published_body);
 const norm=s=>s.replace(/\s+/g,' ').trim();
 const root=document.querySelector('main');if(root){
  const candidates=[...root.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,small,span,a')].filter(el=>el.children.length===0&&!el.closest('.marketingcy-slider,.nav,.header,footer,script,style'));
  const used=new Set();
  const count=Math.min(before.length,after.length);
  for(let i=0;i<count;i++){
   if(before[i]===after[i]||!after[i])continue;
   const old=norm(before[i]),next=after[i];
   const matches=candidates.filter(el=>!used.has(el)&&norm(el.textContent)===old);
   if(matches.length===1){matches[0].textContent=next;used.add(matches[0])}
  }
 }
}
}catch(e){console.warn('Published content unavailable; using original page content.',e)}})();