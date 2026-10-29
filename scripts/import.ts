import {createReadStream} from 'node:fs';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {parse} from 'csv-parse';
import {parse as parseSync} from 'csv-parse/sync';
import method from '../config/grid-v1.json';
import {normalize,included,clip,SOURCE_ADAPTER_VERSION,type Observation} from '../lib/processing';
import {dates,METHOD} from '../lib/model';
const {values:a}=parseArgs({options:{from:{type:'string'},to:{type:'string'},source:{type:'string'},file:{type:'string'},boundary:{type:'string'},'boundary-manifest':{type:'string'},resume:{type:'boolean'},'dry-run':{type:'boolean'},help:{type:'boolean'}}});
if(a.help){console.log('Import genuine standard-processing archives.\n npm run import -- --from YYYY-MM-DD --to YYYY-MM-DD --source modis|viirs --file data/archive.csv --boundary public/boundaries/MMR.geojson --boundary-manifest public/boundaries/manifest.json [--resume] [--dry-run]\nOmit --file to use authenticated daily FIRMS SP API requests. MAP_KEY is read from environment. Boundary manifest requires source_url, license, version.');process.exit(0)}
async function main(){
 const from=a.from!,to=a.to!,source=a.source as 'modis'|'viirs';
 if(!['modis','viirs'].includes(source)||!dates(Number(from?.slice(0,4))).includes(from)||!dates(Number(to?.slice(0,4))).includes(to)||from>to||from<'2015-01-01'||to>'2025-12-31')throw Error('Valid --from, --to in 2015–2025 and --source modis|viirs required');
 if(!a.boundary||!a['boundary-manifest'])throw Error('Licensed GeoJSON boundary and --boundary-manifest required; bbox totals cannot be called Myanmar totals.');
 const boundaryText=await readFile(a.boundary,'utf8'),boundary=JSON.parse(boundaryText),boundaryManifest=JSON.parse(await readFile(a['boundary-manifest'],'utf8'));
 if(boundary.type!=='Feature'||!['Polygon','MultiPolygon'].includes(boundary.geometry?.type))throw Error('Boundary must be a Polygon or MultiPolygon GeoJSON Feature');
 if(!boundaryManifest.source_url||!boundaryManifest.license||!boundaryManifest.version)throw Error('Boundary manifest requires source_url, license, version');
 const boundaryHash=createHash('sha256').update(boundaryText).digest('hex');
 await mkdir('data/chunks',{recursive:true});await mkdir('data/cache',{recursive:true});
 async function ingest(file:string,start:string,end:string,url:string){
  const contentHash=createHash('sha256');for await(const piece of createReadStream(file))contentHash.update(piece);const checksum=contentHash.digest('hex');
  const id=createHash('sha256').update([source,start,end,checksum,boundaryHash,METHOD,SOURCE_ADAPTER_VERSION].join('|')).digest('hex');const dest=`data/chunks/${id}.json`;
  if(a.resume){try{const previous=JSON.parse(await readFile(dest,'utf8'));if(previous.manifest.state==='complete'){console.log(`Resumed validated chunk ${source} ${start} to ${end}`);return}}catch{}}
  const nativeSatellites=new Set<string>(),nativeVersions=new Set<string>(),nativeInstruments=new Set<string>();
  const observations:Observation[]=[];let parsed=0,valid=0,rejected=0,excluded=0,duplicates=0,headersValidated=false;const seen=new Set<string>();
  const stream=createReadStream(file).pipe(parse({columns:(headers:string[])=>{const required=['latitude','longitude','acq_date','acq_time','satellite','confidence','version'];if(required.some(h=>!headers.includes(h)))throw Error('Malformed source CSV: missing required headers');headersValidated=true;return headers;},bom:true,skip_empty_lines:true,trim:true}));
  for await(const row of stream){parsed++;nativeSatellites.add(row.satellite);nativeVersions.add(row.version);if(row.instrument)nativeInstruments.add(row.instrument);let o:Observation;try{o=normalize(row,source);valid++;}catch{rejected++;continue;}
   if(o.date<start||o.date>end||!included(o)||!clip(o,boundary)){excluded++;continue;}if(seen.has(o.id)){duplicates++;continue;}seen.add(o.id);observations.push(o);
  }
  if(!headersValidated)throw Error('Missing CSV headers; empty body is not a validated empty source response');
  // Reject publication if malformed observations could hide activity. Valid exclusions are separately counted.
  const manifest={id,source,source_adapter_version:SOURCE_ADAPTER_VERSION,native_satellites:[...nativeSatellites].sort(),native_versions:[...nativeVersions].sort(),native_instruments:[...nativeInstruments].sort(),product:source==='modis'?'MODIS Collection 6.1':'VIIRS S-NPP 375 m',platforms:source==='modis'?['Terra','Aqua']:['S-NPP'],versions:[...new Set(observations.map(o=>o.version))],source_url:url,from:start,to:end,actual_first:observations.map(o=>o.date).sort()[0]??null,actual_last:observations.map(o=>o.date).sort().at(-1)??null,fetched_at:new Date().toISOString(),checksum,boundary:boundaryManifest,boundary_checksum:boundaryHash,parsed_rows:parsed,valid_rows:valid,rejected_rows:rejected,excluded_rows:excluded,duplicate_rows:duplicates,included_rows:observations.length,state:rejected?'review-required':'complete',method_version:METHOD,configuration:method,errors:rejected?['Rejected observations require correction before publication']:[]};
  console.log(JSON.stringify({...manifest,source_url:url}));if(!a['dry-run']){await writeFile(dest+'.tmp',JSON.stringify({manifest,observations}));await rename(dest+'.tmp',dest);}
  if(rejected)throw Error('Chunk retained for review, not complete. Correct invalid rows and reimport.');
 }
 if(a.file){await ingest(a.file,from,to,'local-archive:'+a.file.replaceAll('\\','/').split('/').at(-1));return}
 const key=process.env.FIRMS_MAP_KEY;if(!key)throw Error('Missing FIRMS_MAP_KEY. Use --file with archive CSV instead.');
 const product=source==='modis'?'MODIS_SP':'VIIRS_SNPP_SP';
 const availability=await fetch(`https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/${key}/${product}`,{signal:AbortSignal.timeout(30000)});if(!availability.ok)throw Error('FIRMS availability check failed; verify key and archive access');const availableText=await availability.text();const availabilityRows=parseSync(availableText,{columns:true,skip_empty_lines:true,trim:true}) as Record<string,string>[];const availabilityRow=availabilityRows.find((r:Record<string,string>)=>r.data_id===product);if(!availabilityRow||from<availabilityRow.min_date||to>availabilityRow.max_date)throw Error('Requested dates are outside the live standard-processing source availability; use NASA archive CSV or adjust dates');
 for(let d=new Date(from+'T00:00:00Z');d.toISOString().slice(0,10)<=to;d.setUTCDate(d.getUTCDate()+1)){
  const day=d.toISOString().slice(0,10),file=`data/cache/${product}-${day}.csv`;if(a.resume){try{await ingest(file,day,day,`https://firms.modaps.eosdis.nasa.gov/api/country/csv/[REDACTED]/${product}/MMR/1/${day}`);continue}catch{}}
  let ok=false;for(let attempt=0;attempt<4;attempt++){try{const response=await fetch(`https://firms.modaps.eosdis.nasa.gov/api/country/csv/${key}/${product}/MMR/1/${day}`,{signal:AbortSignal.timeout(60000)});if(response.status===401||response.status===403)throw Error('FIRMS authentication failed');if(!response.ok)throw Error('FIRMS request failed or rate limited');const text=await response.text();if(!text.split(/\r?\n/)[0].split(',').includes('latitude'))throw Error('FIRMS did not return a source CSV');await writeFile(file,text);ok=true;break}catch{if(attempt<3)await new Promise(r=>setTimeout(r,1000*2**attempt));}}
  if(!ok)throw Error('FIRMS chunk failed after four attempts. Retry with --resume; verify credentials, availability, and rate limits.');await ingest(file,day,day,`https://firms.modaps.eosdis.nasa.gov/api/country/csv/[REDACTED]/${product}/MMR/1/${day}`);
 }
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Import failed');process.exitCode=1});

