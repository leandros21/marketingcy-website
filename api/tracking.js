// Public tracking bootstrap. Only validated, published, non-secret CMS IDs are used.
const endpoint='https://lgrqurlpkogsbiidmuaa.supabase.co/rest/v1/rpc/marketingcy_public_tracking_ids';
const apikey='sb_publishable_66YqqBDBC3TwHFeVu9gCDg_r1mDPJB_';
export default async function handler(req,res){
  res.setHeader('Content-Type','application/javascript; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=60, stale-while-revalidate=60');
  if(req.method!=='GET')return res.status(405).send('');
  try{
    const response=await fetch(endpoint,{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(4000)});
    if(!response.ok)throw Error('Published tracking settings unavailable: '+response.status);
    const data=await response.json();
    const ga4=/^G-[A-Z0-9]{6,20}$/.test(data?.ga4||'')?data.ga4:'';
    const gtm=/^GTM-[A-Z0-9]{4,20}$/.test(data?.gtm||'')?data.gtm:'';
    let js='(function(){if(window.__marketingcyTrackingLoaded)return;window.__marketingcyTrackingLoaded=true;\n';
    if(gtm){
      js+='window.dataLayer=window.dataLayer||[];window.dataLayer.push({\'gtm.start\':Date.now(),event:\'gtm.js\'});';
      js+='var g=document.createElement(\'script\');g.async=true;g.src=\'https://www.googletagmanager.com/gtm.js?id='+gtm+'\';document.head.appendChild(g);\n';
    }
    if(ga4){
      js+='window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};';
      js+='window.gtag(\'js\',new Date());window.gtag(\'config\',\''+ga4+'\');';
      js+='var a=document.createElement(\'script\');a.async=true;a.src=\'https://www.googletagmanager.com/gtag/js?id='+ga4+'\';document.head.appendChild(a);\n';
    }
    js+='})();';
    return res.status(200).send(js);
  }catch(error){
    console.error('Tracking bootstrap error',error);
    return res.status(503).send('/* Tracking configuration temporarily unavailable. */');
  }
}
