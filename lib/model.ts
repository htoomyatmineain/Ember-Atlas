export type Mode = 'harmonized' | 'modis' | 'viirs';
export type Filters = {area:string;year:number;month?:number;day?:number;mode:Mode;panel:string};
export const METHOD='grid-v1';
export function dates(year:number){const out:string[]=[];for(let d=new Date(Date.UTC(year,0,1));d.getUTCFullYear()===year;d.setUTCDate(d.getUTCDate()+1))out.push(d.toISOString().slice(0,10));return out;}
export function parseFilters(p:URLSearchParams):Filters {
 const integer=(k:string,f:number)=>{const v=p.get(k);if(v!==null&&!/^\d+$/.test(v))throw Error(`Invalid ${k}`);return v===null?f:Number(v)};
 const year=integer('year',2025),month=p.has('month')?integer('month',1):undefined,day=p.has('day')?integer('day',1):undefined;
 const area=p.get('area')||'MMR',mode=p.get('mode')||'harmonized',panel=p.get('panel')||'explore';
 if(area!=='MMR'||year<2015||year>2025||!['harmonized','modis','viirs'].includes(mode)||!['explore','compare','quality'].includes(panel)||month!==undefined&&(month<1||month>12)||day!==undefined&&(!month||day<1||day>new Date(Date.UTC(year,month,0)).getUTCDate()))throw Error('Invalid filters');
 return {area,year,month,day,mode:mode as Mode,panel};
}
export function period(f:Filters){const ds=dates(f.year).filter(d=>(!f.month||Number(d.slice(5,7))===f.month)&&(!f.day||Number(d.slice(8,10))===f.day));return {start:ds[0],end:ds.at(-1)!};}
export function unit(mode:Mode){return mode==='harmonized'?'occupied cell-days':'included detections';}
export function csv(rows:Record<string,unknown>[]){if(!rows.length)return '';const keys=Object.keys(rows[0]);const enc=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';return [keys.map(enc).join(','),...rows.map(r=>keys.map(k=>enc(r[k])).join(','))].join('\r\n');}
export function quantiles(values:number[]){const sorted=values.toSorted((a,b)=>a-b);return [.25,.5,.75,.95].map(p=>sorted.length?sorted[Math.floor((sorted.length-1)*p)]:0);}
