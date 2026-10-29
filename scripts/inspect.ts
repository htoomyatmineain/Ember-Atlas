import {createReadStream} from 'node:fs';
import {parse} from 'csv-parse';
const file=process.argv[2];if(!file)throw Error('Usage: npx tsx scripts/inspect.ts path/to/file.csv');
let rows=0,min='',max='';const satellites=new Set<string>(),versions=new Set<string>(),instruments=new Set<string>();
for await(const r of createReadStream(file).pipe(parse({columns:true,bom:true,skip_empty_lines:true}))){rows++;if(!min||r.acq_date<min)min=r.acq_date;if(!max||r.acq_date>max)max=r.acq_date;satellites.add(r.satellite);versions.add(r.version);instruments.add(r.instrument);}
console.log(JSON.stringify({file,rows,date_start:min,date_end:max,satellites:[...satellites],versions:[...versions],instruments:[...instruments]},null,2));
