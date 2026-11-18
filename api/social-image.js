import {readFile} from 'node:fs/promises';
export default async function handler(req,res){
  try{
    const jpg=await readFile(new URL('../assets/blog/marketingcy-social-preview-1200x630.jpg',import.meta.url));
    res.setHeader('Content-Type','image/jpeg');
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');
    return res.status(200).send(jpg);
  }catch(e){console.error('Social image unavailable',e);return res.status(500).end()}
}
