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
  <div className="spot-heading"><div><div className="eyebrow">{raw?'SATELLITE OBSERVATION':'AREA ACTIVITY'}</div><h3>{raw?'Detected hotspot':'Activity at this location'}</h3></div><button onClick={onClose} aria-label="Close feature details"><Icon name="close" size={18}/></button></div>
  <div className="spot-location"><span className="spot-coordinate">{hasCoordinates?locationText(lat,lon):'Coordinates unavailable'}</span><p>{raw?'Satellite detection position':'Approximate area center'} · Myanmar study area</p></div>
  <dl className="spot-period"><dt>{raw?'Observed':'Selected period'}</dt><dd>{raw?dateText(p.date):start===end?dateText(start):dateText(start)+' – '+dateText(end)}{raw&&time&&<span> · {time.slice(0,2)}:{time.slice(2)} UTC</span>}</dd></dl>
  <dl className="spot-activity"><div><dt>Satellite detections</dt><dd>{(m+v).toLocaleString()}</dd></div><div><dt>Days with activity</dt><dd>{raw?'1':Number(p.active_days??0).toLocaleString()}</dd></div></dl>
  <div className="spot-source-line">{raw?<><span>Satellite source</span><strong>{p.source==='modis'?'MODIS':'VIIRS'}{platform?' · '+platform:''}</strong></>:<><span>Contributing sensors</span><strong>{m.toLocaleString()} MODIS <span className="source-divider">/</span> {v.toLocaleString()} VIIRS</strong></>}</div>
  <p className="spot-caveat">{raw?'A detected heat source, not a confirmed fire perimeter.':'Several detections may belong to the same fire. This marker shows an area center, not a fire perimeter.'}{coverage&&coverage!=='complete'?' Data coverage is incomplete.':''}</p>
  <details className="spot-technical"><summary>Technical details</summary><dl className="spot-facts"><div><dt>Grid identifier</dt><dd>{p.cell_id}</dd></div>{raw?<><div><dt>Detection confidence</dt><dd>{p.confidence}<small>Original source scale; not a validated accuracy percentage</small></dd></div><div><dt>Fire radiative power</dt><dd>{p.frp==null?'Unavailable':p.frp+' MW'}<small>Satellite-estimated radiative power</small></dd></div></>:<><div><dt>Occupied cell-days</dt><dd>{p.occupied_cell_days}</dd></div><div><dt>Contributing grid cells</dt><dd>{p.cells}</dd></div></>}<div><dt>Product / method</dt><dd>{p.products} · {p.method_version}</dd></div><div><dt>Ingestion coverage</dt><dd>{coverage??'Unavailable'}</dd></div></dl></details>
 </section>
}
