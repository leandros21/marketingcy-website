let createClient;
try {
 ({createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.0'));
} catch (primaryError) {
 try {
  ({createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm'));
 } catch (fallbackError) {
  const message='The CMS authentication library could not load. In Microsoft Edge, check Tracking Prevention, extensions, or network restrictions, then refresh. ('+(fallbackError?.message||'Network error')+')';
  const el=document.getElementById('auth-error');
  if(el)el.textContent=message;
  throw fallbackError;
 }
}
const cmsLinkType=new URLSearchParams(window.location.hash.slice(1)).get('type')||new URLSearchParams(window.location.search).get('type');
const supabase=createClient('https://lgrqurlpkogsbiidmuaa.supabase.co','sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_',{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
const screen=document.getElementById('auth-screen'),app=document.getElementById('cms-app'),error=document.getElementById('auth-error'),form=document.getElementById('auth-form'),button=document.getElementById('auth-submit');

const pageStore={
 async load(){let result=await supabase.from('cms_pages').select('slug,title,draft_body,draft_seo_title,draft_meta_description,draft_heading,draft_summary,status').order('slug');if(result.error)return result;if(!result.data.length){const imported=window.marketingcyImportedContent||[];if(imported.length){const seed=imported.map(p=>({slug:p.slug,title:p.title.split('|')[0].trim(),draft_body:p.body,draft_seo_title:p.meta,draft_meta_description:p.description,draft_heading:p.title.split('|')[0].trim(),draft_summary:'',status:'draft'}));const inserted=await supabase.from('cms_pages').upsert(seed,{onConflict:'slug',ignoreDuplicates:true});if(inserted.error)return inserted;result=await supabase.from('cms_pages').select('slug,title,draft_body,draft_seo_title,draft_meta_description,draft_heading,draft_summary,status').order('slug')}}return result},
 async publish(p){return supabase.from('cms_pages').update({title:p.title,draft_body:p.body||'',draft_seo_title:p.meta||'',draft_meta_description:p.description||'',draft_heading:p.heading||p.title,draft_summary:p.summary||'',published_body:p.body||'',published_seo_title:p.meta||'',published_meta_description:p.description||'',published_heading:p.heading||p.title,published_summary:p.summary||'',status:'published',updated_at:new Date().toISOString()}).eq('slug',p.slug).select('slug').single()},
 async save(p){return supabase.from('cms_pages').upsert({slug:p.slug,title:p.title,draft_body:p.body||'',draft_seo_title:p.meta||'',draft_meta_description:p.description||'',draft_heading:p.heading||p.title,draft_summary:p.summary||'',updated_at:new Date().toISOString()},{onConflict:'slug'})}
};

const seoStore={
 async files(){const r=await supabase.from('cms_seo_files').select('*');if(r.error)throw r.error;return r.data},
 async save(key,value,publish){const changes=publish?{draft:value,published:value,updated_at:new Date().toISOString()}:{draft:value,updated_at:new Date().toISOString()};const r=await supabase.from('cms_seo_files').update(changes).eq('key',key);if(r.error)throw r.error},
 async redirects(){const r=await supabase.from('cms_seo_redirects').select('*').order('id');if(r.error)throw r.error;return r.data},
 async addRedirect(source,destination){const r=await supabase.from('cms_seo_redirects').insert({source,destination});if(r.error)throw r.error},
 async removeRedirect(id){const r=await supabase.from('cms_seo_redirects').delete().eq('id',id);if(r.error)throw r.error}
};window.marketingcySeoStore=seoStore;
const enquiriesStore={
 async list(){const r=await supabase.from('cms_enquiries').select('id,created_at,full_name,telephone,service,email,message,status,priority').order('created_at',{ascending:false}).limit(200);if(r.error)throw r.error;return r.data||[]},
 async update(id,changes){const r=await supabase.from('cms_enquiries').update(changes).eq('id',id).select('id,status,priority').single();if(r.error)throw r.error;return r.data},
 async notes(ids){if(!ids.length)return [];const r=await supabase.from('cms_enquiry_notes').select('id,enquiry_id,author_id,body,created_at').in('enquiry_id',ids).order('created_at',{ascending:true});if(r.error)throw r.error;return r.data||[]},
 async addNote(enquiry_id,body){const u=await supabase.auth.getUser();if(u.error||!u.data.user)throw Error('Sign in again');const r=await supabase.from('cms_enquiry_notes').insert({enquiry_id,author_id:u.data.user.id,body}).select('id,enquiry_id,author_id,body,created_at').single();if(r.error)throw r.error;return r.data}
};window.marketingcyEnquiriesStore=enquiriesStore;
const mediaStore={
 async list(){const r=await supabase.from('cms_media').select('*').order('created_at',{ascending:false});if(r.error)throw r.error;return r.data},
 async upload(file,category){const allowed=['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','application/pdf','text/plain'];if(!allowed.includes(file.type))throw Error('Unsupported file type');if(file.size>10485760)throw Error('Maximum file size is 10 MB');const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=Date.now()+'-'+Math.random().toString(36).slice(2)+'-'+safe;const u=await supabase.storage.from('cms-media').upload(path,file,{contentType:file.type});if(u.error)throw u.error;const url=supabase.storage.from('cms-media').getPublicUrl(path).data.publicUrl;const r=await supabase.from('cms_media').insert({name:file.name,category,url,bucket:'cms-media',storage_path:path,mime_type:file.type,size_bytes:file.size});if(r.error)throw Error('File uploaded but library registration failed: '+r.error.message);return url},
 async update(id,changes){const r=await supabase.from('cms_media').update(changes).eq('id',id);if(r.error)throw r.error},
 async remove(item){if(item.bucket&&item.storage_path){const r=await supabase.storage.from(item.bucket).remove([item.storage_path]);if(r.error)throw r.error}const r=await supabase.from('cms_media').delete().eq('id',item.id);if(r.error)throw r.error}
};window.marketingcyMediaStore=mediaStore;
const portfolioStore={
 async load(){const r=await supabase.from('cms_portfolio').select('*').order('portfolio_order');if(r.error)throw r.error;return r.data},
 async save(rows,publish){for(const row of rows){const payload={...row,updated_at:new Date().toISOString()};let r=await supabase.from('cms_portfolio').upsert(payload,{onConflict:'id'});if(r.error)throw r.error;if(publish){r=await supabase.from('cms_portfolio_live').upsert(payload,{onConflict:'id'});if(r.error)throw r.error}}return true},
 async remove(id){let a=await supabase.from('cms_portfolio_live').delete().eq('id',id);if(a.error)throw a.error;a=await supabase.from('cms_portfolio').delete().eq('id',id);if(a.error)throw a.error;return true},
 async upload(file,id){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Use JPG, PNG or WebP');if(file.size>5242880)throw Error('Maximum image size is 5 MB');const ext=file.type.split('/')[1].replace('jpeg','jpg');const path='project-'+id+'-'+Date.now()+'.'+ext;const r=await supabase.storage.from('cms-portfolio').upload(path,file,{contentType:file.type});if(r.error)throw r.error;return supabase.storage.from('cms-portfolio').getPublicUrl(path).data.publicUrl}
};window.marketingcyPortfolioStore=portfolioStore;
const servicesStore={
 async load(){const [cards,section]=await Promise.all([supabase.from('cms_services').select('*').order('sort_order'),supabase.from('cms_services_section').select('*').eq('id',1).single()]);if(cards.error)throw cards.error;if(section.error)throw section.error;return {cards:cards.data,section:section.data}},
 async save(cards,section,publish){let a=await supabase.from('cms_services_section').upsert({...section,id:1,updated_at:new Date().toISOString()});if(a.error)throw a.error;for(const card of cards){a=await supabase.from('cms_services').upsert({...card,updated_at:new Date().toISOString()},{onConflict:'id'});if(a.error)throw a.error}if(publish){a=await supabase.from('cms_services_section_live').upsert({...section,id:1,updated_at:new Date().toISOString()});if(a.error)throw a.error;for(const card of cards){a=await supabase.from('cms_services_live').upsert({...card,updated_at:new Date().toISOString()},{onConflict:'id'});if(a.error)throw a.error}}return true}
};window.marketingcyServicesStore=servicesStore;
const sliderStore={
 async load(){return supabase.from('cms_slider_slides').select('*').order('id')},
 async save(row){return supabase.from('cms_slider_slides').upsert({...row,updated_at:new Date().toISOString()},{onConflict:'id'})},
 async publish(row){const saved=await this.save(row);if(saved.error)return saved;return supabase.from('cms_slider_live').upsert({...row,updated_at:new Date().toISOString()},{onConflict:'id'})},
 async upload(file,id){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Use JPG, PNG or WebP');if(file.size>5*1024*1024)throw Error('Image must be under 5MB');const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path='slide-'+id+'-'+Date.now()+'.'+ext;const result=await supabase.storage.from('cms-slider').upload(path,file,{contentType:file.type,upsert:false});if(result.error)throw result.error;return supabase.storage.from('cms-slider').getPublicUrl(path).data.publicUrl}
};window.marketingcySliderStore=sliderStore;

const navigationStore={async load(){return supabase.from('cms_navigation').select('*')},async save(key,items,publish){const {data,error}=await supabase.from('cms_navigation').select('published_items').eq('menu_key',key).maybeSingle();if(error)throw error;const row={menu_key:key,draft_items:items,published_items:publish?items:(data?.published_items||[]),updated_at:new Date().toISOString()};const result=await supabase.from('cms_navigation').upsert(row,{onConflict:'menu_key'});if(result.error)throw result.error;return row}};window.marketingcyNavigationStore=navigationStore;
const rolesStore={
 async me(){const {data,error}=await supabase.from('cms_user_roles').select('role').single();if(error)throw error;return data.role},
 async manage(input){const {data,error}=await supabase.functions.invoke('cms-manage-users',{body:input});if(error){if(error.context){try{const detail=await error.context.json();if(detail?.error)throw Error(detail.error)}catch(e){if(e?.message&&e.message!== 'Unexpected end of JSON input')throw e}}throw error}if(data?.error)throw Error(data.error);return data},
 async blogList(){const {data,error}=await supabase.from('cms_blog_posts').select('*').order('updated_at',{ascending:false});if(error)throw error;return (data||[]).filter(p=>window.cmsUserRole!=='contributor'||p.author_id===window.cmsCurrentUserId)},
 async blogSave(p){const {data:{user},error:ue}=await supabase.auth.getUser();if(ue||!user)throw Error('Please sign in');const payload={slug:p.slug,title:p.title,body:p.body||'',seo_title:p.meta||'',meta_description:p.description||'',status:p.status==='Published'?'published':'draft',updated_at:new Date().toISOString(),...(p.status==='Published'?{published_at:new Date().toISOString()}:{})};if(p.id){const {data,error}=await supabase.from('cms_blog_posts').update(payload).eq('id',p.id).select().single();if(error)throw error;return data}const {data,error}=await supabase.from('cms_blog_posts').insert({...payload,author_id:user.id}).select().single();if(error)throw error;return data}
};window.marketingcyRolesStore=rolesStore;
let sequence=0;
let passwordSetupPending=cmsLinkType==='invite'||cmsLinkType==='recovery';
const passwordForm=document.getElementById('auth-set-password-form'),loginForm=document.getElementById('auth-form'),forgotButton=document.getElementById('auth-forgot');
function showPasswordSetup(){app.style.display='none';screen.style.display='grid';loginForm.style.display='none';if(forgotButton)forgotButton.style.display='none';passwordForm.style.display='block';document.getElementById('auth-set-password-heading').textContent=cmsLinkType==='recovery'?'Reset your password':'Create your password';error.textContent='';}
passwordForm.addEventListener('submit',async event=>{event.preventDefault();const p=document.getElementById('auth-new-password').value,c=document.getElementById('auth-confirm-password').value,msg=document.getElementById('auth-set-password-message');if(p.length<12||p!==c){msg.textContent='Use at least 12 characters and ensure passwords match.';return}const {error:e}=await supabase.auth.updateUser({password:p});if(e){msg.textContent='Could not save password: '+e.message;return}passwordSetupPending=false;passwordForm.style.display='none';loginForm.style.display='block';if(forgotButton)forgotButton.style.display='block';history.replaceState(null,'',window.location.pathname);msg.textContent='';await check();});
forgotButton?.addEventListener('click',async()=>{const email=document.getElementById('auth-email').value.trim();if(!email){error.textContent='Enter your email address above first.';return}const {error:e}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/cms/'});error.textContent=e?'Could not send reset email: '+e.message:'If this email is registered, a password reset link has been sent.';});
let manualSignOut=false;
const sessionExpiredMessage='Your session may have expired or browser storage was cleared. Please sign in again.';
function locked(message=''){app.style.display='none';screen.style.display='grid';error.textContent=message;}
async function check({initial=false}={}){
 const n=++sequence;
 try{
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(n!==sequence)return false;
  if(authError||!user){locked(authError?sessionExpiredMessage:(initial?'':sessionExpiredMessage));return false}if(passwordSetupPending){showPasswordSetup();return true}
  const {data,error:dbError}=await supabase.from('cms_user_roles').select('role').eq('user_id',user.id).maybeSingle();
  if(n!==sequence)return false;
  if(dbError){locked('Could not check administrator access: '+dbError.message);return false}
  if(!data){locked('This account is not authorised for MarketingCy CMS.');return false} window.cmsUserRole=data.role;window.cmsCurrentUserId=user.id;if(window.cmsApplyRole)window.cmsApplyRole(data.role);
  document.getElementById('auth-identity').textContent=user.email||'Administrator';
  screen.style.display='none';app.style.display='grid';
  if(window.cmsConnect)await window.cmsConnect(pageStore);
  return true;
 }catch(e){if(n===sequence)locked('Unable to load the CMS: '+(e?.message||'Please try again.'));return false}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 button.disabled=true;error.textContent='Signing in…';
 try{
  const email=document.getElementById('auth-email').value.trim();
  const password=document.getElementById('auth-password').value;
  if(!email||!password){locked('Enter your email and password to sign in.');return}
  const {error:signInError}=await Promise.race([
   supabase.auth.signInWithPassword({email,password}),
   new Promise((_,reject)=>setTimeout(()=>reject(new Error('Authentication timed out. Please check your connection and try again.')),15000))
  ]);
  if(signInError){locked('Sign-in failed: '+(signInError.message||'Check your email and password.'));return}
  await check();
 }catch(e){locked('Sign-in error: '+(e?.message||'Unable to connect to the authentication service.'))}
 finally{button.disabled=false}
});
async function signOut(){manualSignOut=true;++sequence;locked('You have signed out.');try{await supabase.auth.signOut()}finally{manualSignOut=false;document.getElementById('auth-password').value=''}}
document.getElementById('logout').addEventListener('click',signOut);
document.getElementById('top-logout').addEventListener('click',signOut);
supabase.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){passwordSetupPending=true;setTimeout(showPasswordSetup,0)}if(event==='SIGNED_IN'&&passwordSetupPending){setTimeout(showPasswordSetup,0)}if(event==='SIGNED_OUT'){++sequence;locked(manualSignOut?'You have signed out.':sessionExpiredMessage)}});
window.cmsAuthReady=true;
check({initial:true});
