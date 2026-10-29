import method from '../config/grid-v1.json';
import {createHash} from 'node:crypto';
import proj4 from 'proj4';
import inside from '@turf/boolean-point-in-polygon';
import type {Feature,Polygon,MultiPolygon} from 'geojson';
proj4.defs('EPSG:6933','+proj=cea +lat_ts=30 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
export const SOURCE_ADAPTER_VERSION='firms-archive-v2';
export type Observation={id:string;date:string;time:string;lat:number;lon:number;satellite:string;source:'modis'|'viirs';confidence:string;frp:number|null;cell_id:string;cx:number;cy:number;version:string};
export function normalize(r:Record<string,string>,source:'modis'|'viirs'):Observation {
 const lat=Number(r.latitude),lon=Number(r.longitude),date=r.acq_date,time=r.acq_time?.padStart(4,'0');
 if(!r.latitude?.trim()||!r.longitude?.trim()||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||!/^\d{4}$/.test(time)||Number(time.slice(0,2))>23||Number(time.slice(2))>59)throw Error('Invalid coordinates or UTC timestamp');
 // Explicit FIRMS aliases, including the supplied January 2025 archive exports.
 // Original labels remain in the raw file and ingestion manifest; normalize for identity.
 const aliases:Record<string,string>=source==='modis'?{Terra:'Terra',Aqua:'Aqua',T:'Terra',A:'Aqua'}:{N:'S-NPP','Suomi NPP':'S-NPP','S-NPP':'S-NPP',SNPP:'S-NPP'};
 const satellite=Object.hasOwn(aliases,r.satellite?.trim())?aliases[r.satellite.trim()]:undefined;
 if(!satellite)throw Error('Unexpected satellite');
 if(r.instrument?.trim()&&!(source==='modis'?['MODIS']:['VIIRS','SNPP']).includes(r.instrument.trim()))throw Error('Unexpected instrument');
 const confidence=r.confidence?.toLowerCase();if(source==='modis'&&(!/^\d+(\.\d+)?$/.test(confidence)||Number(confidence)>100)||source==='viirs'&&!['l','n','h'].includes(confidence))throw Error('Unknown confidence');
 // Do not infer standard-processing identity from arbitrary numeric versions.
 // 61.03 is the native version in the supplied M-C61 archive, not a rewritten value.
 if(!(source==='modis'?['6.1','61.03']:['1','2']).includes(r.version))throw Error('Supported standard-processing product version required');
 const [x,y]=proj4('EPSG:4326','EPSG:6933',[lon,lat]),ix=Math.floor(x/1000),iy=Math.floor(y/1000),[cx,cy]=proj4('EPSG:6933','EPSG:4326',[(ix+.5)*1000,(iy+.5)*1000]);
 const frp=r.frp?.trim()?Number(r.frp):null;if(frp!==null&&(!Number.isFinite(frp)||frp<0))throw Error('Invalid FRP');
 const id=createHash('sha256').update(JSON.stringify([source,satellite,date,time,lat,lon,r.scan,r.track,r.brightness,r.bright_ti4,r.version])).digest('hex');
 return {id,date,time,lat,lon,satellite,source,confidence,frp,cell_id:`6933:1000:${ix}:${iy}`,cx,cy,version:r.version};
}
export function included(o:Observation){return o.source==='modis'?Number(o.confidence)>=method.modis.minimum_confidence:method.viirs.included_confidence.includes(o.confidence);}
export function clip(o:Observation,boundary:Feature<Polygon|MultiPolygon>){return inside([o.lon,o.lat],boundary,{ignoreBoundary:false});}
export function aggregate(observations:Observation[]){const seen=new Set<string>(),cells=new Map<string,{date:string;cell_id:string;lon:number;lat:number;m:number;v:number}>();for(const o of observations){if(seen.has(o.id))continue;seen.add(o.id);const key=o.date+o.cell_id,c=cells.get(key)||{date:o.date,cell_id:o.cell_id,lon:o.cx,lat:o.cy,m:0,v:0};c[o.source==='modis'?'m':'v']++;cells.set(key,c);}return [...cells.values()];}

