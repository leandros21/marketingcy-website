import { createHash } from 'node:crypto';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const body=req.body||{};
 if(typeof body.website==='string'&&body.website.trim())return res.status(400).json({error:'Invalid submission'});
 const name=String(body.name||'').trim(),telephone=String(body.telephone||'').trim(),service=String(body.service||'').trim();
 if(name.length<2||name.length>120||telephone.length<5||telephone.length>40||service.length<2||service.length>100)return res.status(400).json({error:'Please complete all required fields'});
 const token=process.env.MARKETINGCY_ENQUIRY_TOKEN;
 if(!token)return res.status(503).json({error:'Enquiry service is not configured'});
 const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
 const ip=String(req.headers['x-vercel-forwarded-for']||forwarded||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 const visitorHash=createHash('sha256').update(token+':'+ip).digest('hex');
 try{
 const r=await fetch('https://lgrqurlpkogsbiidmuaa.supabase.co/rest/v1/rpc/submit_marketingcy_enquiry',{method:'POST',headers:{apikey:'sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_','Content-Type':'application/json'},body:JSON.stringify({p_token:token,p_hash:visitorHash,p_name:name,p_phone:telephone,p_service:service})});
 const data=await r.json();if(!r.ok)throw Error('Database rejected submission');if(!data.ok)return res.status(429).json({error:data.error||'Submission limit reached'});return res.status(200).json({ok:true,message:'Your enquiry was received successfully.'});
 }catch(e){return res.status(503).json({error:'Unable to send your enquiry right now. Please try again later.'})}
}