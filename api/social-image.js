import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
export default async function handler(req,res){try{const svg=await readFile(new URL('../assets/marketingcy-social-preview.svg',import.meta.url));const png=await sharp(svg).resize(1200,630).png().toBuffer();res.setHeader('Content-Type','image/png');res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');return res.status(200).send(png)}catch(e){return res.status(500).end()}}
