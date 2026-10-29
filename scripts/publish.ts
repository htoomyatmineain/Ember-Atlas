import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {createClient} from '@supabase/supabase-js';
import {aggregate,type Observation} from '../lib/processing';
import {dates,quantiles} from '../lib/model';
const {values:a}=parseArgs({options:{'spatial-year':{type:'string'},'max-spatial-rows':{type:'string',default:'150000'},'max-raw-rows':{type:'string',default:'50000'},'dry-run':{type:'boolean'},help:{type:'boolean'}}});
if(a.help){console.log('npm run publish:data -- --spatial-year 2025 [--max-spatial-rows 150000] [--max-raw-rows 50000] [--dry-run]\nCreates an immutable dataset version from validated local chunks. All years get area summaries; one year gets spatial detail. Changing --spatial-year publishes a new version. Review measured storage against your Supabase quota first.');process.exit(0)}
async function main(){
 const year=Number(a['spatial-year']);if(year<2015||year>2025||!Number.isInteger(year))throw Error('--spatial-year 2015–2025 required');
 if(!Number.isFinite(Number(a['max-spatial-rows']))||Number(a['max-spatial-rows'])<1||!Number.isFinite(Number(a['max-raw-rows']))||Number(a['max-raw-rows'])<0)throw Error('Row budgets must be finite nonnegative numbers; spatial budget must be positive');
 const files=(await readdir('data/chunks')).filter(f=>f.endsWith('.json')).sort();const manifests:any[]=[],observations:Observation[]=[],sourceDates=new Set<string>();let boundaryHash='';
 for(const file of files){const {manifest:m,observations:os}=JSON.parse(await readFile('data/chunks/'+file,'utf8'));if(m.state!=='complete')throw Error('A chunk requires review; fix or move it out before publishing');if(boundaryHash&&boundaryHash!==m.boundary_checksum)throw Error('Mixed boundary versions; reimport consistently');boundaryHash=m.boundary_checksum;manifests.push(m);for(const o of os)observations.push(o);for(let d=new Date(m.from+'T00:00:00Z');d.toISOString().slice(0,10)<=m.to;d.setUTCDate(d.getUTCDate()+1))sourceDates.add(m.source+':'+d.toISOString().slice(0,10));}
 if(!manifests.length)throw Error('No validated chunks. Run import first.');
 const uniqueRaw=[...new Map(observations.filter(o=>Number(o.date.slice(0,4))===year).map(o=>[o.id,o])).values()];const raw=uniqueRaw.length<=Number(a['max-raw-rows'])?uniqueRaw:[];
 const cellsByDate=new Map<string,ReturnType<typeof aggregate>>();
 const id=createHash('sha256').update(JSON.stringify([manifests.map(m=>m.id),year,raw.length])).digest('hex').slice(0,24),cells=aggregate(observations),spatial=cells.filter(c=>Number(c.date.slice(0,4))===year),areas:any[]=[],ledger:any[]=[];
 for(const c of cells){const bucket=cellsByDate.get(c.date)||[];bucket.push(c);cellsByDate.set(c.date,bucket);}
 for(let y=2015;y<=2025;y++)for(const date of dates(y)){const mc=sourceDates.has('modis:'+date),vc=sourceDates.has('viirs:'+date);if(!mc&&!vc)continue;const cs=cellsByDate.get(date)||[];areas.push({dataset:id,area:'MMR',date,m:cs.reduce((a,c)=>a+c.m,0),v:cs.reduce((a,c)=>a+c.v,0),modis_occupied:cs.filter(c=>c.m>0).length,viirs_occupied:cs.filter(c=>c.v>0).length,both:cs.filter(c=>c.m>0&&c.v>0).length,union_count:cs.length,modis_complete:mc,viirs_complete:vc});for(const source of ['Terra','Aqua','S-NPP'])if(source==='S-NPP'?vc:mc)ledger.push({dataset:id,date,source,status:'complete'});}
 const thresholds={modis:quantiles(areas.filter(r=>r.modis_complete).map(r=>r.m)),viirs:quantiles(areas.filter(r=>r.viirs_complete).map(r=>r.v)),harmonized:quantiles(areas.filter(r=>r.modis_complete&&r.viirs_complete).map(r=>r.union_count))};
 const measured={dataset:id,raw_rows:raw.length,raw_points_state:raw.length===uniqueRaw.length?'available':'budget-exceeded; source modes use aggregate bins',area_days:areas.length,spatial_rows:spatial.length,cell_days_all_years:cells.length,estimated_json_bytes:Buffer.byteLength(JSON.stringify({areas,spatial,ledger})),note:'Measure actual Postgres table/index sizes after import; JSON bytes are not database size.'};console.log(measured);
 if(spatial.length>Number(a['max-spatial-rows']))throw Error('Spatial row budget exceeded. Review project quotas and intentionally raise --max-spatial-rows or choose a smaller spatial year.');if(a['dry-run'])return;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw Error('Missing Supabase server credentials');const client=createClient(url,key,{auth:{persistSession:false}});
 const must=async(p:PromiseLike<any>)=>{const r=await p;if(r.error)throw Error('Database operation failed: '+r.error.code);return r.data};
 const existing=await must(client.from('datasets').select('status').eq('id',id).maybeSingle());if(existing?.status==='published'){console.log('Dataset already published; no changes.');return}if(existing)await must(client.from('datasets').delete().eq('id',id));
 const boundary=manifests[0].boundary;await must(client.from('areas').upsert({id:'MMR',name:'Myanmar',iso3:'MMR',boundary_source:boundary.source_url,boundary_license:boundary.license,boundary_version:boundary.version}));
 await must(client.from('datasets').insert({id,status:'draft',method_version:'grid-v1',config_hash:createHash('sha256').update(JSON.stringify(manifests[0].configuration)).digest('hex'),spatial_year:year,raw_year:raw.length===uniqueRaw.length?year:null,manifest:manifests,thresholds}));
 const batch=async(table:string,rs:any[])=>{for(let i=0;i<rs.length;i+=500)await must(client.from(table).insert(rs.slice(i,i+500)))};
 await batch('ingestion_chunks',manifests.map(m=>({id:id+':'+m.id,dataset:id,source:m.source,requested_start:m.from,requested_end:m.to,status:m.state,metadata:m})));
 const geometry=JSON.parse(await readFile('public/boundaries/MMR.geojson','utf8'));const geometryText=await readFile('public/boundaries/MMR.geojson','utf8');if(createHash('sha256').update(geometryText).digest('hex')===boundaryHash)await must(client.rpc('set_area_geometry',{p_geometry:geometry.geometry,p_bbox:[92,9,102,29]}));
 await batch('raw_detections',raw.map(({cx,cy,...o})=>({...o,dataset:id})));
 await batch('daily_source_status',ledger);await batch('area_days',areas);await batch('cell_days',spatial.map(c=>({...c,dataset:id,area:'MMR'})));await must(client.rpc('publish_dataset',{p_id:id}));console.log('Published dataset '+id+' atomically; full raw archives remain local.');
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Publication failed');process.exitCode=1});
