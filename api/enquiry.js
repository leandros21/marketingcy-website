import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const token=process.env.MARKETINGCY_ENQUIRY_TOKEN;
 if(!token)return res.status(503).json({error:'Enquiry service is not configured'});
 if(req.method==='GET'){
  const a=randomInt(2,10),b=randomInt(1,9),expires=Date.now()+10*60*1000;
  const payload=[a,b,expires].join(':');
  const signature=createHmac('sha256',token).update(payload).digest('hex');
  return res.status(200).json({question:'What is '+a+' + '+b+'?',challenge:Buffer.from(payload).toString('base64url')+'.'+signature});
 }
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const body=req.body||{};
 if(typeof body.website==='string'&&body.website.trim())return res.status(400).json({error:'Invalid submission'});
 const name=String(body.name||'').trim(),telephone=String(body.telephone||'').trim(),service=String(body.service||'').trim(),email=String(body.email||'').trim(),message=String(body.message||'').trim(),contact=body.formType==='contact';
 if(name.length<2)return res.status(400).json({error:'Name is too short. Please enter at least 2 characters.'});
 if(name.length>120)return res.status(400).json({error:'Name is too long. Please use 120 characters or fewer.'});
 if(contact){
  if(email.length<5||email.length>254||!email.includes('@'))return res.status(400).json({error:'Please enter a valid email address.'});
  if(message.length<5)return res.status(400).json({error:'Message is too short. Please enter at least 5 characters.'});
  if(telephone&&(telephone.length>40||!/^\+?[0-9 ()-]{5,40}$/.test(telephone)))return res.status(400).json({error:'Please enter a valid telephone number.'});
  if(message.length>5000)return res.status(400).json({error:'Message is too long. Please use 5,000 characters or fewer.'});
 }else{
  if(telephone.length<5||telephone.length>40)return res.status(400).json({error:'Please enter a valid telephone number (5–40 characters).'});
  if(service.length<2||service.length>100)return res.status(400).json({error:'Please select a valid service.'});
 }
 const challenge=String(body.mathChallenge||''),answer=String(body.mathAnswer??'').trim();
 const parts=challenge.split('.');
 if(parts.length!==2||!/^[a-f0-9]{64}$/.test(parts[1])||!/^[0-9]+$/.test(answer))return res.status(400).json({error:'Invalid math verification. Please try again.'});
 const payload=Buffer.from(parts[0],'base64url').toString('utf8');
 const expected=createHmac('sha256',token).update(payload).digest();
 const received=Buffer.from(parts[1],'hex');
 const nums=payload.match(/^(\d+):(\d+):(\d{13})$/);
 if(!timingSafeEqual(expected,received)||!nums||Number(nums[3])<Date.now()||Number(nums[3])>Date.now()+10*60*1000||Number(answer)!==Number(nums[1])+Number(nums[2]))return res.status(400).json({error:'Incorrect or expired math answer. Please try again.'});
 const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
 const ip=String(req.headers['x-vercel-forwarded-for']||forwarded||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 const visitorHash=createHash('sha256').update(token+':'+ip).digest('hex');
 try{
 const r=await fetch('https://lgrqurlpkogsbiidmuaa.supabase.co/rest/v1/rpc/'+(contact?'submit_marketingcy_contact':'submit_marketingcy_enquiry'),{method:'POST',headers:{apikey:'sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_','Content-Type':'application/json'},body:JSON.stringify(contact?{p_token:token,p_hash:visitorHash,p_name:name,p_email:email,p_message:telephone?'Telephone: '+telephone+'\n\n'+message:message}:{p_token:token,p_hash:visitorHash,p_name:name,p_phone:telephone,p_service:service})});
 const data=await r.json();if(!r.ok)throw Error('Database rejected submission');if(!data.ok)return res.status(429).json({error:data.error||'Submission limit reached'});
 // A failed notification must never discard an enquiry already saved to Supabase.
 const resendKey=process.env.RESEND_API_KEY;
 const recipient=process.env.ENQUIRY_NOTIFICATION_EMAIL;
 if(resendKey&&recipient){
  try{
   const fields=contact?[['Name',name],['Email',email],...(telephone?[['Telephone',telephone]]:[]),['Message',message]]:[['Name',name],['Telephone',telephone],['Service',service]];
   const receivedAt=new Date();
   const submitted=receivedAt.toLocaleString('en-GB',{timeZone:'Europe/Nicosia',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' (Cyprus time)';
   const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   const kind=contact?'contact message':'consultation enquiry';
   const subject='New MarketingCy '+kind+' — '+name;
   const textBody=['New MarketingCy '+kind,'','Submitted: '+submitted,'',...fields.map(([k,v])=>k+': '+v),'','Saved in MarketingCy Supabase CMS.'].join('\n');
   const fieldRows=fields.map(([label,value])=>'<tr><td style="padding:13px 16px 13px 0;border-bottom:1px solid #e9eef3;color:#73859a;font-size:13px;font-weight:600;vertical-align:top;width:95px;">'+escapeHtml(label)+'</td><td style="padding:13px 0;border-bottom:1px solid #e9eef3;color:#19344f;font-size:14px;line-height:1.65;overflow-wrap:anywhere;word-break:break-word;white-space:pre-wrap;">'+(label==='Email'?'<a href="mailto:'+encodeURIComponent(value)+'" style="color:#0C83C3;text-decoration:none;">'+escapeHtml(value)+'</a>':escapeHtml(value))+'</td></tr>').join('');
   const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f1f3f5;font-family:Arial,Helvetica,sans-serif;color:#19344f;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">New '+escapeHtml(kind)+' from '+escapeHtml(name)+'</div><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f3f5;"><tr><td align="center" style="padding:30px 14px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;background:#ffffff;border:1px solid #e2e7ec;border-radius:12px;"><tr><td style="padding:26px 30px 18px;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td style="color:#0C83C3;font-size:20px;font-weight:800;">MarketingCy</td><td align="right" style="color:#7a8795;font-size:12px;">'+(contact?'Contact Form':'Consultation Request')+'</td></tr></table></td></tr><tr><td style="padding:0 30px;"><div style="border-top:1px solid #e3e9ef;"></div><h1 style="margin:24px 0 10px;color:#162f49;font-size:23px;line-height:1.35;">New enquiry from '+escapeHtml(name)+'</h1><p style="margin:0 0 18px;color:#62748a;font-size:14px;line-height:1.6;">A new message was submitted through your website.</p><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">'+fieldRows+'</table><p style="margin:20px 0 0;color:#75869a;font-size:12px;">Received: '+escapeHtml(submitted)+'</p></td></tr><tr><td style="padding:22px 30px 26px;"><div style="border-top:1px solid #e3e9ef;padding-top:18px;color:#8191a0;font-size:12px;">Received via marketingcy.com · Saved in MarketingCy CMS</div></td></tr></table></td></tr></table></body></html>';
   const emailPayload={from:'MarketingCy Enquiries <notifications@marketingcy.com>',to:[recipient],subject,text:textBody,html};
   if(contact)emailPayload.reply_to=email;
   const notification=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+resendKey,'Content-Type':'application/json'},body:JSON.stringify(emailPayload),signal:AbortSignal.timeout(8000)});
   if(!notification.ok)console.error('Resend notification failed with HTTP status',notification.status);
  }catch(err){console.error('Resend notification delivery error',err?.message||'unknown')}
 }else{console.warn('Resend notification not configured')}
 return res.status(200).json({ok:true,message:'Your enquiry was received successfully.'});
 }catch(e){return res.status(503).json({error:'Unable to send your enquiry right now. Please try again later.'})}
}