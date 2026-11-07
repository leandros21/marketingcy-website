import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const supabase=createClient('https://lgrqurlpkogsbiidmuaa.supabase.co','sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_',{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
const screen=document.getElementById('auth-screen'),app=document.getElementById('cms-app'),error=document.getElementById('auth-error'),form=document.getElementById('auth-form'),button=document.getElementById('auth-submit');
let sequence=0;
function locked(message=''){app.style.display='none';screen.style.display='grid';error.textContent=message;}
async function check(){const n=++sequence;try{const {data:{user},error:e}=await supabase.auth.getUser();if(n!==sequence)return;if(e||!user){locked();return}const {data,error:dbError}=await supabase.from('cms_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(n!==sequence)return;if(dbError||!data){locked('This account is not authorised for MarketingCy CMS.');return}document.getElementById('auth-identity').textContent=user.email||'Administrator';screen.style.display='none';app.style.display='grid'}catch{if(n===sequence)locked('Unable to verify your account. Please try again.')}}
form.addEventListener('submit',async event=>{event.preventDefault();button.disabled=true;error.textContent='Signing in…';try{const {error:e}=await supabase.auth.signInWithPassword({email:document.getElementById('auth-email').value.trim(),password:document.getElementById('auth-password').value});if(e){locked('Sign-in failed: '+(e.message||'Check your email and password.'));return}await check()}catch(e){locked('Sign-in error: '+(e?.message||'Unable to reach authentication service.'))}finally{button.disabled=false}});
document.getElementById('logout').addEventListener('click',async()=>{locked();await supabase.auth.signOut();document.getElementById('auth-password').value=''});
supabase.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')locked();});
check();
