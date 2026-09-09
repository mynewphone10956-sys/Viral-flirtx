const OWNER = 'mynewphone10956-sys';
const REPO = 'Viral-flirtx';
const ASSET_NAME = 'FlirtX.apk';
const API_VERSION = '2026-03-10';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8','cache-control':'no-store'}})}
function authorized(request,env){const supplied=request.headers.get('x-admin-password')||'';return supplied && env.ADMIN_PASSWORD && supplied===env.ADMIN_PASSWORD;}
function cleanTag(input){const v=(input||'').trim().replace(/[^A-Za-z0-9._-]/g,'-').replace(/-+/g,'-').slice(0,60);return v||`v${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}`;}
function ghHeaders(env,extra={}){return {'Accept':'application/vnd.github+json','Authorization':`Bearer ${env.GITHUB_TOKEN}`,'X-GitHub-Api-Version':API_VERSION,'User-Agent':'FlirtX-APK-Admin',...extra};}

async function createRelease(env,tag){
  const r=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`,{method:'POST',headers:ghHeaders(env,{'content-type':'application/json'}),body:JSON.stringify({tag_name:tag,name:tag,body:'APK uploaded from FlirtX Admin',draft:false,prerelease:false})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.message||`GitHub release creation failed (${r.status})`);
  return data;
}

async function handleUpload(request,env){
  if(!authorized(request,env)) return json({error:'Incorrect admin password.'},401);
  if(!env.GITHUB_TOKEN) return json({error:'Server is missing the GITHUB_TOKEN secret.'},500);
  const len=Number(request.headers.get('content-length')||0);
  if(!len) return json({error:'No APK data received.'},400);
  if(len>100*1024*1024) return json({error:'APK is larger than the 100 MB upload limit on Cloudflare Free.'},413);
  const tag=cleanTag(request.headers.get('x-version'));
  let release;
  try{release=await createRelease(env,tag);}catch(e){return json({error:e.message},502);}
  const uploadUrl=release.upload_url.replace('{?name,label}','')+`?name=${encodeURIComponent(ASSET_NAME)}`;
  const up=await fetch(uploadUrl,{method:'POST',headers:ghHeaders(env,{'content-type':'application/vnd.android.package-archive','content-length':String(len)}),body:request.body});
  const asset=await up.json().catch(()=>({}));
  if(!up.ok){
    // Avoid leaving a broken published release behind.
    await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${release.id}`,{method:'DELETE',headers:ghHeaders(env)}).catch(()=>{});
    return json({error:asset.message||`GitHub asset upload failed (${up.status})`},502);
  }
  return json({ok:true,tag,download_url:asset.browser_download_url,latest_url:`https://github.com/${OWNER}/${REPO}/releases/latest/download/${ASSET_NAME}`});
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/api/login' && request.method==='POST') return authorized(request,env)?json({ok:true}):json({error:'Incorrect admin password.'},401);
    if(url.pathname==='/api/upload' && request.method==='POST') return handleUpload(request,env);
    return env.ASSETS.fetch(request);
  }
};
