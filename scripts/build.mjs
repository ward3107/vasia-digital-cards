import {readFileSync,writeFileSync,existsSync,readdirSync,mkdirSync,rmSync,cpSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {renderServiceWorker} from './service-worker.mjs';
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeJson=v=>JSON.stringify(v).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function validateCard(slug,c,options={}){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Invalid card slug');
 if(!c||typeof c.name!=='string'||!c.name.trim())throw Error('Business name is required');
 if(c.template!=='rotating-bag')throw Error('Unknown card template');
 if(!/^[1-9][0-9]{7,14}$/.test(c.whatsapp))throw Error('Invalid WhatsApp number');
 if(!Array.isArray(c.phones)||!c.phones.length||c.phones.some(p=>!/^\+[1-9][0-9]{7,14}$/.test(p.international)||!p.display||!['storePhone','mobile1','mobile2'].includes(p.label)))throw Error('Invalid contact phone');
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(c.email))throw Error('Invalid email');
 for(const [key,value] of [['website',c.website],['publicUrl',c.publicUrl]])if(value){let u;try{u=new URL(value)}catch{throw Error('Invalid '+key)}if(u.protocol!=='https:'||u.username||u.password)throw Error('Only HTTPS is allowed for '+key)}
 if(c.publicUrl){const u=new URL(c.publicUrl);if((u.pathname!==`/${slug}/`&&!(options.allowRoot&&u.pathname==='/'))||u.search||u.hash)throw Error('Public URL must be the exact customer card path');}
 if(c.qrAsset&&!/^assets\/[a-zA-Z0-9_-]+\.svg$/.test(c.qrAsset))throw Error('QR asset must be inside the card assets directory');
 return c;
}
export function renderCard(slug,c,template,options={}){
 validateCard(slug,c,options);
 const meta=(property,value)=>value?`<meta property="${property}" content="${escapeHtml(value)}">`:'';
 const name=c.name;const title=`${name} | ${c.names?.he||name} — הכרטיס הדיגיטלי`;
 const phones=c.phones.map(p=>`<a class="phone-row" href="tel:${escapeHtml(p.international)}"><span><small data-t="${p.label}"></small><strong>${escapeHtml(p.display)}</strong></span><svg class="icon" aria-hidden="true"><use href="#i-phone"/></svg></a>`).join('');
 const settings={name,names:c.names||{he:name,ar:name,en:name},whatsapp:c.whatsapp,publicUrl:c.publicUrl||null,qrAsset:c.qrAsset||null,appBase:'/'+slug+'/'};
 const values={NAME:escapeHtml(name),TITLE:escapeHtml(title),DESCRIPTION:escapeHtml(c.description),BAG_ALT:escapeHtml(c.bag.alt),PHONE_DISPLAY:escapeHtml(c.phones[0].display),WHATSAPP:escapeHtml(c.whatsapp),EMAIL:escapeHtml(c.email),WEBSITE:escapeHtml(c.website),MAPS_URL:escapeHtml('https://waze.com/ul?q='+encodeURIComponent(c.address.mapsQuery)+'&navigate=yes'),PHONE_ROWS:phones,TAGLINE:escapeHtml(c.bag.tagline),BAG_DETAILS:escapeHtml(c.bag.details),CONFIG_JSON:safeJson(settings),PUBLIC_URL:escapeHtml(c.publicUrl||''),QR_ASSET:c.qrAsset?escapeHtml('/'+slug+'/'+c.qrAsset):'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E',CANONICAL_META:c.publicUrl?`<link rel="canonical" href="${escapeHtml(c.publicUrl)}">`:'',OG_URL_META:meta('og:url',c.publicUrl),OG_IMAGE_META:meta('og:image',c.publicUrl?new URL('/'+slug+'/assets/share.png',c.publicUrl).href:null)};
 return template.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{if(!(key in values))throw Error('Unknown template field: '+key);return values[key]}).replaceAll('src="./assets/','src="/'+slug+'/assets/').replaceAll('href="./assets/','href="/'+slug+'/assets/').replace('href="./contact.vcf"','href="/'+slug+'/contact.vcf"').replace('href="./manifest.webmanifest"','href="/'+slug+'/manifest.webmanifest"');
}
const vcardEscape=v=>String(v||'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
export function buildVCard(c){
 const a=c.address;const lines=['BEGIN:VCARD','VERSION:3.0',`N:;${vcardEscape(c.name)};;;`,`FN:${vcardEscape(c.name)}`,`ORG:${vcardEscape(c.name)}`,...c.phones.map(p=>'TEL;TYPE='+ (p.label==='storePhone'?'WORK,VOICE':'CELL,VOICE')+':'+p.international),'EMAIL;TYPE=INTERNET:'+vcardEscape(c.email),'URL:'+vcardEscape(c.website),...(c.publicUrl?['URL:'+vcardEscape(c.publicUrl)]:[]),'ADR;TYPE=WORK:;;'+vcardEscape(a.street)+';'+vcardEscape(a.city)+';;;'+vcardEscape(a.country),'END:VCARD'];
 const folded=[];for(const line of lines){let part='';for(const ch of line){if(Buffer.byteLength(part+ch)>75){folded.push(part);part=' '+ch}else part+=ch}folded.push(part)}return folded.join('\r\n')+'\r\n';
}
export function build(root=process.cwd()){
 const site=existsSync(join(root,'site.json'))?JSON.parse(readFileSync(join(root,'site.json'),'utf8')):{};
 const dist=join(root,'dist');rmSync(dist,{recursive:true,force:true});mkdirSync(dist,{recursive:true});cpSync(join(root,'shared'),join(dist,'shared'),{recursive:true});
 const slugs=readdirSync(join(root,'cards'),{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);
 for(const slug of slugs){const c=JSON.parse(readFileSync(join(root,'cards',slug,'card.json'),'utf8'));validateCard(slug,c,{allowRoot:site.homeCard===slug});const template=readFileSync(join(root,'templates',c.template+'.html'),'utf8');const dest=join(dist,slug);mkdirSync(dest,{recursive:true});cpSync(join(root,'cards',slug,'assets'),join(dest,'assets'),{recursive:true});if(c.qrAsset&&!existsSync(join(dest,c.qrAsset)))throw Error('Missing QR asset for '+slug);writeFileSync(join(dest,'index.html'),renderCard(slug,c,template,{allowRoot:site.homeCard===slug}));writeFileSync(join(dest,'contact.vcf'),buildVCard(c));writeFileSync(join(dest,'manifest.webmanifest'),JSON.stringify({id:`/${slug}/`,description:c.description,prefer_related_applications:false,name:c.name,short_name:c.name,start_url:`/${slug}/`,scope:`/${slug}/`,display:'standalone',theme_color:'#1243ce',background_color:'#092b84',lang:'he',dir:'rtl',icons:[{src:'./assets/icon-192.png',sizes:'192x192',type:'image/png'},{src:'./assets/icon-512.png',sizes:'512x512',type:'image/png'}]},null,2));const files=readdirSync(join(dest,'assets')).map(name=>'/'+slug+'/assets/'+name);const sharedFiles=['/shared/card.css','/shared/card.js','/shared/vasia-logo-light.svg','/shared/fonts/heebo.woff2','/shared/fonts/cairo.woff2'];const cachedFiles=[`/${slug}/index.html`,`/${slug}/contact.vcf`,`/${slug}/manifest.webmanifest`,...files,...sharedFiles];const fingerprint=createHash('sha256');for(const file of cachedFiles)fingerprint.update(file).update(readFileSync(join(dist,file)));const version=fingerprint.digest('hex').slice(0,12);writeFileSync(join(dest,'sw.js'),renderServiceWorker(slug,version,cachedFiles));console.log('Built /'+slug+'/');}
 writeFileSync(join(dist,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VASIA Digital Cards</title><link rel="stylesheet" href="/shared/card.css"><body class="repository-home"><main><img src="/shared/vasia-logo-light.svg" alt="VASIA" width="170" height="49"><p>Open your digital card using its direct link.</p></main></body></html>');
 if(site.homeCard){if(!slugs.includes(site.homeCard))throw Error('Unknown homeCard');writeFileSync(join(dist,'index.html'),readFileSync(join(dist,site.homeCard,'index.html')));writeFileSync(join(dist,'_redirects'),'/ /'+site.homeCard+'/ 302!\n');}writeFileSync(join(dist,'_headers'),"/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'\n");
 console.log('Built '+slugs.length+' card(s).');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)build();
