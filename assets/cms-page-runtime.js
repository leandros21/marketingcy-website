(async function(){
 const slug=location.pathname.endsWith('/')?location.pathname:location.pathname+'/';
 const nodes=[...document.querySelectorAll('main h1,main h2,main h3,main p')].filter(n=>!n.closest('form'));
 const url='https://lgrqurlpkogsbiidmuaa.supabase.co/rest/v1/cms_pages?slug=eq.'+encodeURIComponent(slug)+'&status=eq.published&select=published_body,published_heading,published_summary,published_seo_title,published_meta_description';
 try{
  const r=await fetch(url,{headers:{apikey:'sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_'}});
  if(!r.ok)return;
  const data=(await r.json())[0];if(!data)return;
  if(data.published_seo_title)document.title=data.published_seo_title;
  if(data.published_meta_description){let meta=document.querySelector('meta[name="description"]');if(!meta){meta=document.createElement('meta');meta.name='description';document.head.append(meta)}meta.content=data.published_meta_description}
  if(data.published_heading){const h=document.querySelector('main h1');if(h)h.textContent=data.published_heading}
  if(data.published_summary){const hero=document.querySelector('main .hero p');if(hero)hero.textContent=data.published_summary}
  let body;try{body=JSON.parse(data.published_body)}catch{return}
  if(!body||body.format!=='marketingcy-structured-v1'||!Array.isArray(body.blocks))return;
  const allowed=new Set(['STRONG','B','EM','I','A','BR','SPAN','U','SMALL','SUP','SUB']);
  function safe(html){
   const template=document.createElement('template');template.innerHTML=html;
   function clean(parent){for(const child of [...parent.childNodes]){if(child.nodeType===8){child.remove();continue}if(child.nodeType!==1)continue;if(!allowed.has(child.tagName)){child.replaceWith(...child.childNodes);clean(parent);continue}for(const attr of [...child.attributes]){if(!(child.tagName==='A'&&attr.name==='href'&&/^(https?:\\/\\/|\\/|#|mailto:)/i.test(attr.value)))child.removeAttribute(attr.name)}if(child.tagName==='A')child.rel='noopener noreferrer';clean(child)}}
   clean(template.content);return template.innerHTML
  }
  body.blocks.forEach((block,i)=>{const node=nodes[i];if(node&&block&&node.tagName===block.tag&&typeof block.html==='string'&&block.html.length<30000){node.innerHTML=safe(block.html)}});
 }catch(e){console.warn('CMS content unavailable',e)}
})();