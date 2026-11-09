export type YouthIdCardDetails = { name: string; age: string; barangay: string; birthdate?: string; address?: string; registration?: string; gender?: string; contact?: string; ageGroup?: string; civilStatus?: string };
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Card image unavailable')); image.src = src; });
}
export async function renderYouthIdCard(details: YouthIdCardDetails, qr: string, picture?: string | null, seal = '/images/sk-talipapa-logo.png'): Promise<string> {
  await document.fonts.ready;
  const [code, logo, photo, laminate] = await Promise.all([loadImage(qr), loadImage(seal), picture ? loadImage(picture) : Promise.resolve(null), loadImage('/images/youth-id-laminate-v1.png').catch(() => null)]);
  const canvas = document.createElement('canvas'); canvas.width = 1260; canvas.height = 710;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Card preview unavailable');
  const box = (x:number,y:number,w:number,h:number,r:number,color:string) => {ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
  const star = (x:number,y:number,r:number,color:string,rotation=0) => {
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.beginPath();
    for(let point=0;point<10;point++){const angle=-Math.PI/2+point*Math.PI/5;const radius=point%2?r*.46:r;const px=Math.cos(angle)*radius,py=Math.sin(angle)*radius;if(point===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore();
  };
  // Clip every layer so the downloaded PNG keeps transparent rounded corners.
  ctx.beginPath();ctx.roundRect(0,0,1260,710,36);ctx.clip();
  box(0,0,1260,710,36,'#e3f1fb');
  if (laminate) ctx.drawImage(laminate, 0, 0, 1260, 710);
  box(32,32,1196,646,18,'#f8fcff');
  box(40,40,1180,125,16,'#061A4D');
  ctx.save();ctx.beginPath();ctx.roundRect(40,40,1180,125,16);ctx.clip();
  ctx.strokeStyle='#174776';ctx.lineWidth=2;
  for(let x=1050;x<1500;x+=34){ctx.beginPath();ctx.arc(x,10,160,0,Math.PI*2);ctx.stroke();}
  for(const [x,y,r] of [[220,74,12],[290,126,7],[1080,74,12],[1145,125,7]])star(x,y,r,'#8ebce0',.15);
  ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(110,102,43,0,Math.PI*2);ctx.clip();ctx.drawImage(logo,67,59,86,86);ctx.restore();
  ctx.fillStyle='#ffffff';ctx.font='700 33px "Source Sans 3", sans-serif';ctx.textAlign='center';ctx.fillText('Sangguniang Kabataan',630,92);
  ctx.font='23px "Source Sans 3", sans-serif';ctx.fillStyle='#d1e6f7';ctx.fillText('Barangay Talipapa · Quezon City',630,132);ctx.textAlign='left';
  box(65,205,370,370,20,'#e3edf8');
  ctx.save();ctx.beginPath();ctx.roundRect(65,205,370,370,20);ctx.clip();
  if(photo){const scale=Math.max(370/photo.width,370/photo.height);ctx.drawImage(photo,65+(370-photo.width*scale)/2,205+(370-photo.height*scale)/2,photo.width*scale,photo.height*scale);}
  else{ctx.fillStyle='#061A4D';ctx.font='700 105px "Source Sans 3", sans-serif';ctx.textAlign='center';ctx.fillText(details.name.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase()||'?',250,430);ctx.textAlign='left';}ctx.restore();
  // Preserve the QR quiet zone and black/white pixels at their generated size.
  box(825,205,370,370,20,'#ffffff');ctx.imageSmoothingEnabled=false;ctx.drawImage(code,825,205,370,370);ctx.imageSmoothingEnabled=true;
  const text=(value:string,x:number,y:number,width:number,size:number,weight='600')=>{ctx.fillStyle='#061A4D';let fontSize=size;do{ctx.font=weight+' '+fontSize+'px "Source Sans 3", sans-serif';if(ctx.measureText(value).width<=width)break;fontSize--;}while(fontSize>18);ctx.fillText(value,x,y,width);};
  const field=(label:string,value:string|undefined,x:number,y:number,width:number,size=30)=>{ctx.fillStyle='#0038A7';ctx.font='700 20px "Source Sans 3", sans-serif';ctx.fillText(label,x,y);text(value||'Not provided',x,y+39,width,size);};
  field('BIRTHDATE',details.birthdate,475,235,305,32);
  field('GENDER',details.gender,475,335,305,32);
  field('CONTACT NO.',details.contact,475,435,305,32);
  field('BARANGAY',details.barangay,475,536,305,30);
  ctx.textAlign='center';
  field('NAME',details.name,250,605,456,34);
  field('REGISTRATION NO.',details.registration||'Unassigned',1010,605,370,32);
  ctx.textAlign='left';
  return canvas.toDataURL('image/png');
}
