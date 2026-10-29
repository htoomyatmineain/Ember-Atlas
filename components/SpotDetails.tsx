'use client';
import Icon from './Icon';
function locationText(lat:number,lon:number){return `${Math.abs(lat).toFixed(4)}° ${lat<0?'S':'N'}, ${Math.abs(lon).toFixed(4)}° ${lon<0?'W':'E'}`}
function dateText(date:string){const parsed=new Date(date+'T00:00:00Z');return Number.isNaN(parsed.getTime())?date:parsed.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}
export default function SpotDetails({feature:p,start,end,coverage,onClose}:{feature:any;start:string;end:string;coverage?:string;onClose:()=>void}){
 const raw=!!p.source,lat=p.locationLat??p.lat,lon=p.locationLon??p.lon;
 const hasCoordinates=Number.isFinite(lat)&&Number.isFinite(lon);
 const m=Number(p.m??0),v=Number(p.v??0);
 const time=typeof p.time==='string'?p.time.padStart(4,'0'):'';
 const platform=p.satellite==='S-NPP'||p.satellite==='N'||p.satellite==='SNPP'?'Suomi NPP':p.satellite;
 return <section className="detail-drawer spot-details" aria-label="Selected hotspot details">
  <button onClick={onClose} aria-label="Close feature details"><Icon name="close" size={18}/></button>
  <div className="eyebrow">{raw?'SATELLITE OBSERVATION':'AREA ACTIVITY'}</div>
  <h3>{raw?'Detected hotspot':'Activity at this location'}</h3>
  <dl className="spot-facts"><div><dt>Location</dt><dd>{hasCoordinates?locationText(lat,lon):'Coordinates unavailable'}<small>{raw?'Satellite detection position':'Approximate center of the mapped area'} · Myanmar study area</small></dd></div>
   <div><dt>{raw?'Observed':'Selected period'}</dt><dd>{raw?dateText(p.date):start===end?dateText(start):dateText(start)+' – '+dateText(end)}{raw&&time&&<small>{time.slice(0,2)}:{time.slice(2)} UTC</small>}</dd></div>
   {raw?<div><dt>Satellite source</dt><dd>{p.source==='modis'?'MODIS':'VIIRS'}{platform?' · '+platform:''}</dd></div>:<><div><dt>Satellite detections</dt><dd>{(m+v).toLocaleString()}<small>{m.toLocaleString()} MODIS · {v.toLocaleString()} VIIRS</small></dd></div><div><dt>Days with activity</dt><dd>{Number(p.active_days??0).toLocaleString()}<small>Days when a satellite detected activity in this mapped area</small></dd></div></>}
  </dl>
  <p className="spot-caveat">{raw?'A detected heat source, not a confirmed fire perimeter.':'Several detections may belong to the same fire. This marker shows an area center, not a fire perimeter.'}{coverage&&coverage!=='complete'?' Data coverage is incomplete.':''}</p>
  <details className="spot-technical"><summary>Technical details</summary><dl className="spot-facts"><div><dt>Grid identifier</dt><dd>{p.cell_id}</dd></div>{raw?<><div><dt>Detection confidence</dt><dd>{p.confidence}<small>Original source scale; not a validated accuracy percentage</small></dd></div><div><dt>Fire radiative power</dt><dd>{p.frp==null?'Unavailable':p.frp+' MW'}<small>Satellite-estimated radiative power</small></dd></div></>:<><div><dt>Occupied cell-days</dt><dd>{p.occupied_cell_days}</dd></div><div><dt>Contributing grid cells</dt><dd>{p.cells}</dd></div></>}<div><dt>Product / method</dt><dd>{p.products} · {p.method_version}</dd></div><div><dt>Ingestion coverage</dt><dd>{coverage??'Unavailable'}</dd></div></dl></details>
 </section>
}
