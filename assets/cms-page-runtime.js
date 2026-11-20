(async function(){
 const slug=location.pathname.endsWith('/')?location.pathname:location.pathname+'/';
 const nodes=[...document.querySelectorAll(slug==='/pricing/'?'main h1,main h2,main h3,main p,main .price strong,main .inclusions li':'main h1,main h2,main h3,main p')].filter(n=>!n.closest('form'));
 const url='https://lgrqurlpkogsbiidmuaa.supabase.co/rest/v1/cms_published_pages?slug=eq.'+encodeURIComponent(slug)+'&select=published_body,published_heading,published_summary,published_seo_title,published_meta_description';
 try{
  const r=await fetch(url,{cache:'no-store',headers:{apikey:'sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_'}});
  if(!r.ok)throw Error('Published content request failed ('+r.status+')');
  const data=(await r.json())[0];if(!data)throw Error('No published CMS record for '+slug);
  if(data.published_seo_title)document.title=data.published_seo_title;
  if(data.published_meta_description){let meta=document.querySelector('meta[name="description"]');if(!meta){meta=document.createElement('meta');meta.name='description';document.head.append(meta)}meta.content=data.published_meta_description}
  
  let body;try{body=JSON.parse(data.published_body)}catch{throw Error('Published CMS content is invalid JSON')}
  if(!body||body.format!=='marketingcy-structured-v1'||!Array.isArray(body.blocks))throw Error('Published CMS content format is invalid');
  if(slug==='/pricing/'&&(body.blocks.length!==nodes.length||body.blocks.some((b,i)=>!b||b.tag!==nodes[i].tagName)))throw Error('Pricing CMS content does not match page layout');
  const allowed=new Set(['STRONG','B','EM','I','A','BR','SPAN','U','SMALL','SUP','SUB']);
  function safe(html){
   const template=document.createElement('template');template.innerHTML=html;
   function clean(parent){for(const child of [...parent.childNodes]){if(child.nodeType===8){child.remove();continue}if(child.nodeType!==1)continue;if(!allowed.has(child.tagName)){child.replaceWith(...child.childNodes);clean(parent);continue}for(const attr of [...child.attributes]){if(!(child.tagName==='A'&&attr.name==='href'&&(/^(https?:|#|mailto:)/i.test(attr.value)||attr.value.startsWith('/'))))child.removeAttribute(attr.name)}if(child.tagName==='A')child.rel='noopener noreferrer';clean(child)}}
   clean(template.content);return template.innerHTML
  }
  body.blocks.forEach((block,i)=>{const node=nodes[i];if(node&&block&&node.tagName===block.tag&&typeof block.html==='string'&&block.html.length<30000){node.innerHTML=safe(block.html);if(slug==='/pricing/')node.style.display=node.textContent.trim()?'':'none'}});
  if(slug!=='/pricing/'&&data.published_heading){const h=document.querySelector('main h1');if(h)h.textContent=data.published_heading}
  if(slug!=='/pricing/'&&data.published_summary){const hero=document.querySelector('main .hero p');if(hero)hero.textContent=data.published_summary}
 }catch(e){console.warn('CMS content unavailable',e);if(slug==='/pricing/'){const main=document.querySelector('main');if(main){main.replaceChildren();const panel=document.createElement('div');panel.style.cssText='max-width:780px;margin:80px auto;padding:28px;border:1px solid #dce6f1;border-radius:12px;background:#fff;color:#18344e;font:16px/1.6 Arial,sans-serif';const heading=document.createElement('h1');heading.textContent='Pricing temporarily unavailable';const p=document.createElement('p');p.textContent='The latest published pricing could not be loaded. Please try again shortly or contact us for current pricing.';panel.append(heading,p);main.append(panel)}}}finally{if(slug==='/pricing/'){const gate=document.getElementById('cms-pricing-gate');if(gate)gate.remove()}}
})();