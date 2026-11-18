import './style.css';
import {createWorker} from 'tesseract.js';
import {parseAmount,extractPrices,convert} from './core.js';
const $=id=>document.getElementById(id);
const currencies={INR:'🇮🇳 Indian rupee',USD:'🇺🇸 US dollar',EUR:'🇪🇺 Euro',GBP:'🇬🇧 British pound',THB:'🇹🇭 Thai baht',JPY:'🇯🇵 Japanese yen',SGD:'🇸🇬 Singapore dollar',AUD:'🇦🇺 Australian dollar',CAD:'🇨🇦 Canadian dollar',CHF:'🇨🇭 Swiss franc',CNY:'🇨🇳 Chinese yuan',HKD:'🇭🇰 Hong Kong dollar',IDR:'🇮🇩 Indonesian rupiah',KRW:'🇰🇷 South Korean won',MYR:'🇲🇾 Malaysian ringgit',NZD:'🇳🇿 New Zealand dollar',PHP:'🇵🇭 Philippine peso',SEK:'🇸🇪 Swedish krona',ZAR:'🇿🇦 South African rand',TRY:'🇹🇷 Turkish lira',NOK:'🇳🇴 Norwegian krone',DKK:'🇩🇰 Danish krone',BRL:'🇧🇷 Brazilian real',MXN:'🇲🇽 Mexican peso',PLN:'🇵🇱 Polish zloty',CZK:'🇨🇿 Czech koruna',HUF:'🇭🇺 Hungarian forint',RON:'🇷🇴 Romanian leu',ISK:'🇮🇸 Icelandic króna',ILS:'🇮🇱 Israeli shekel'};
let stream=null,workerPromise=null,rate=null,rateDate='',rateSaved=false,requestId=0;
function read(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
const prefs=read('price-lens-prefs')||{};
for(const id of ['from','to'])for(const [code,name]of Object.entries(currencies)){const option=document.createElement('option');option.value=code;option.textContent=`${code} · ${name.replace(/^[^A-Za-z]+/,'')}`;$(id).append(option)}
$('from').value=currencies[prefs.from]?prefs.from:'THB';$('to').value=currencies[prefs.to]?prefs.to:'INR';
function status(message){$('status').textContent=message;$('status').hidden=!message}
function format(n,currency){return new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:currency==='JPY'||currency==='KRW'?0:2}).format(n)}
function render(){const from=$('from').value,to=$('to').value;for(const key of ['from','to']){$(`${key}-label`).textContent=$(key).value;$(`${key}-name`).textContent=currencies[$(key).value].replace(/^[^A-Za-z]+/,'');}const symbol=new Intl.NumberFormat('en',{style:'currency',currency:from}).formatToParts(0).find(x=>x.type==='currency')?.value||from;$('source-symbol').textContent=symbol;$('source-code').textContent=from;const amount=parseAmount($('amount').value);$('amount-error').hidden=true;$('amount-error').textContent='Enter a positive price, such as 589 or 1,250.50.';const value=convert(amount,rate);$('converted').textContent=amount===null?(stream?'Looking for a price…':'—'):value===null?'—':format(value,to);$('rate-detail').textContent=rate?`1 ${from} = ${new Intl.NumberFormat('en-IN',{maximumFractionDigits:5}).format(rate)} ${to} · before bank fees`:'Exchange rate unavailable';$('rate-date').textContent=rate?(from===to?'Same currency':`${rateSaved?'Saved rate · ':''}Reference date ${rateDate}`):'Check your connection and refresh';$('source-price').textContent=amount===null?'':`${new Intl.NumberFormat('en-IN',{maximumFractionDigits:2}).format(amount)} ${from}`;$('result-hint').textContent=amount===null?(stream?'Hold steady on a clear price label.':'Your next price appears here.'):'Approximate · before bank fees';document.querySelector('.result').dataset.detected=String(amount!==null);drawOverlays();}
async function loadRate(){$('refresh').disabled=false;const id=++requestId,from=$('from').value,to=$('to').value;rate=null;rateDate='';rateSaved=false;save('price-lens-prefs',{from,to});render();if(from===to){rate=1;render();return}const cacheKey=`price-lens-rate-${from}-${to}`,cached=read(cacheKey);if(cached&&Number.isFinite(cached.rate)&&cached.rate>0&&/^\d{4}-\d{2}-\d{2}$/.test(cached.date)){rate=cached.rate;rateDate=cached.date;rateSaved=true;render()}$('refresh').disabled=true;try{const response=await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Rates unavailable');const data=await response.json();if(id!==requestId)return;const value=data.rates?.[to];if(!Number.isFinite(value)||value<=0||!/^\d{4}-\d{2}-\d{2}$/.test(data.date))throw Error('Invalid rate');rate=value;rateDate=data.date;rateSaved=false;save(cacheKey,{rate,date:rateDate});status('');}catch(e){if(id!==requestId)return;status(rate?'Could not refresh. Showing a saved reference rate—check its date before relying on it.':'Could not get an exchange rate for this pair. Check your connection or choose another currency.');}finally{if(id===requestId){$('refresh').disabled=false;render()}}}
$('amount').addEventListener('input',render);for(const id of ['from','to'])$(id).addEventListener('change',loadRate);$('swap').onclick=()=>{const from=$('from').value;$('from').value=$('to').value;$('to').value=from;loadRate()};$('refresh').onclick=loadRate;
let cameraEpoch=0, loopTimer=null, inFlight=false, detections=[], lastCandidates=[], lastRead=0;
const scanCanvas=document.createElement('canvas');
function clearDetections(){detections=[];lastCandidates=[];lastRead=0;$('amount').value='';render();}
function drawOverlays(){
  const layer=$('live-overlays');layer.replaceChildren();
  for(const item of detections){const tag=document.createElement('div');tag.className='price-overlay';tag.style.left=`${item.x*100}%`;tag.style.top=`${item.y*100}%`;tag.style.width=`${item.w*100}%`;tag.style.height=`${item.h*100}%`;
    const label=document.createElement('span');const value=convert(item.value,rate);label.textContent=value===null?'Rate unavailable':format(value,$('to').value);if(item.x>.55){label.style.left='auto';label.style.right='-2px';}if(item.y+item.h>.78){label.style.top='auto';label.style.bottom='100%';}tag.append(label);layer.append(tag);}
}
function stopCamera(){document.body.classList.remove('live-mode');cameraEpoch++;clearTimeout(loopTimer);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('video').srcObject=null;$('viewfinder').classList.remove('camera-active');$('camera-controls').hidden=true;$('camera-empty').hidden=false;$('live-state').textContent='';clearDetections();}
$('close-camera').onclick=stopCamera;
async function getWorker(){if(!workerPromise)workerPromise=createWorker('eng',1,{workerPath:new URL('ocr/worker.min.js',document.baseURI).href,corePath:new URL('ocr/core/',document.baseURI).href,langPath:new URL('ocr/lang/',document.baseURI).href,logger:m=>{if(stream&&m.status!=='recognizing text')$('live-state').textContent='Preparing on-device scanner…'}}).then(async worker=>{await worker.setParameters({tessedit_pageseg_mode:'11'});return worker}).catch(e=>{workerPromise=null;throw e});return workerPromise}
function frameCandidates(data,width,height){
  const found=[];
  for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[])for(const word of line.words||[]){
    if(word.confidence<55)continue;
    const prices=extractPrices(word.text);if(prices.length!==1)continue;
    const price=prices[0];const box=word.bbox;if(!box||price.value<=0)continue;
    const item={value:price.value,raw:price.raw,x:box.x0/width,y:box.y0/height,w:(box.x1-box.x0)/width,h:(box.y1-box.y0)/height,confidence:word.confidence};
    if(item.w>0&&item.h>0)found.push(item);
  }
  return found.slice(0,12);
}
function schedule(epoch,delay=650){clearTimeout(loopTimer);if(stream&&epoch===cameraEpoch)loopTimer=setTimeout(()=>scanLive(epoch),delay)}
async function scanLive(epoch){
  if(!stream||epoch!==cameraEpoch)return;
  if(inFlight){schedule(epoch,150);return;}
  const video=$('video'),rect=video.getBoundingClientRect();
  if(!video.videoWidth||!rect.width||!rect.height){schedule(epoch,150);return;}
  inFlight=true;
  try{
    const worker=await getWorker();if(epoch!==cameraEpoch||!stream)return;
    // Match the visible object-fit:cover crop, so OCR coordinates align with the preview.
    const aspect=rect.width/rect.height;let sw=video.videoWidth,sh=video.videoHeight;
    if(sw/sh>aspect)sw=sh*aspect;else sh=sw/aspect;
    const cw=Math.min(1100,Math.round(sw)),ch=Math.round(cw/aspect);scanCanvas.width=cw;scanCanvas.height=ch;
    scanCanvas.getContext('2d').drawImage(video,(video.videoWidth-sw)/2,(video.videoHeight-sh)/2,sw,sh,0,0,cw,ch);
    const {data}=await worker.recognize(scanCanvas,{}, {blocks:true,text:true});
    if(epoch!==cameraEpoch||!stream)return;
    const next=frameCandidates(data,cw,ch);
    // Two consecutive readings suppress fleeting OCR guesses. Do not carry old prices onto new labels.
    detections=next.filter(item=>lastCandidates.some(old=>old.value===item.value&&Math.abs(old.x-item.x)<.15&&Math.abs(old.y-item.y)<.15));
    lastCandidates=next;lastRead=performance.now();
    if(detections.length){const best=[...detections].sort((a,b)=>b.h-a.h||b.confidence-a.confidence)[0];$('amount').value=String(best.value);$('live-state').textContent='Live · check the number and currency';}
    else{$('amount').value='';$('live-state').textContent=next.length?'Confirming price…':'Live · point at a clear price';}
    render();
  }catch(e){if(epoch===cameraEpoch&&stream){clearDetections();$('live-state').textContent='Scanner unavailable';status('The live scanner could not load. Check your connection and reopen the camera.');stopCamera();}}
  finally{inFlight=false;schedule(epoch);}
}
// Expire labels even if a frame takes unusually long to recognise.
setInterval(()=>{if(stream&&lastRead&&performance.now()-lastRead>2500){detections=[];$('amount').value='';render();}},400);
$('start-camera').onclick=async()=>{
  status('');$('start-camera').disabled=true;const epoch=++cameraEpoch;
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('unsupported');
    const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
    if(epoch!==cameraEpoch||document.hidden){acquired.getTracks().forEach(t=>t.stop());return;}
    stream=acquired;document.body.classList.add('live-mode');$('video').srcObject=stream;$('camera-empty').hidden=true;$('camera-controls').hidden=false;$('viewfinder').classList.add('camera-active');
    await $('video').play();if(epoch!==cameraEpoch)return;clearDetections();$('live-state').textContent='Preparing on-device scanner…';scanLive(epoch);
  }catch(e){if(epoch===cameraEpoch){stopCamera();status(e.name==='NotAllowedError'?'Allow camera access in your browser settings to scan live.':e.name==='NotFoundError'?'No camera found. Open this app on a phone with a camera.':'Camera could not start. Open the HTTPS site in Safari or Chrome and allow camera access.');}}
  finally{$('start-camera').disabled=false;}
};
for(const id of ['help','privacy'])$(id).onclick=()=>$('info-dialog').showModal();$('close-info').onclick=()=>$('info-dialog').close();$('info-dialog').onclick=e=>{if(e.target===$('info-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}};
window.addEventListener('pagehide',stopCamera);document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream)stopCamera()});
loadRate();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register(new URL('sw.js',document.baseURI)).catch(()=>{}));
