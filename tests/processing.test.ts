import test from 'node:test';
import assert from 'node:assert/strict';
import {dates,parseFilters,period,csv,quantiles} from '../lib/model';
import {normalize,aggregate,included,clip} from '../lib/processing';
const row={latitude:'20',longitude:'96',acq_date:'2025-01-01',acq_time:'5',satellite:'Terra',confidence:'30',version:'6.1',frp:''};
test('real calendar and UTC selection include leap days',()=>{for(const y of [2016,2020,2024]){assert.equal(dates(y).length,366);assert(dates(y).includes(`${y}-02-29`))}assert.equal(dates(2025).length,365);assert.deepEqual(period(parseFilters(new URLSearchParams('year=2024&month=2&day=29'))),{start:'2024-02-29',end:'2024-02-29'});});
test('filters reject unsafe or impossible values',()=>{for(const q of ['area=other','year=2025x','year=2014','month=13','month=2&day=29','day=1','mode=unknown','panel=unknown'])assert.throws(()=>parseFilters(new URLSearchParams(q)));});
test('exact duplicates do not double count; two sensors share one union cell-day',()=>{const m=normalize(row,'modis'),v=normalize({...row,satellite:'N',confidence:'n',version:'1'},'viirs'),m2=normalize({...row,acq_time:'1000'},'modis');const cells=aggregate([m,m,v,m2]);assert.equal(cells.length,1);assert.equal(cells[0].m,2);assert.equal(cells[0].v,1);assert.equal(m.time,'0005');assert.equal(m.frp,null);assert.equal(m.cell_id,v.cell_id);assert.equal(aggregate([m,{...m,id:'another',date:'2025-01-02'}]).length,2)});
test('source-specific confidence and standard products',()=>{assert(included(normalize(row,'modis')));assert(!included(normalize({...row,confidence:'29'},'modis')));assert(!included(normalize({...row,satellite:'N',confidence:'l',version:'1'},'viirs')));assert.throws(()=>normalize({...row,satellite:'NOAA-20',confidence:'n'},'viirs'));for(const r of [{confidence:'x'},{latitude:'91'},{acq_time:'2400'},{acq_date:'2025-02-30'},{longitude:''},{version:'6.1NRT'}])assert.throws(()=>normalize({...row,...r},'modis'));});
test('archive adapters accept exact supplied labels and preserve native versions',()=>{
 const m=normalize({...row,version:'61.03',instrument:'MODIS'},'modis');assert.equal(m.version,'61.03');assert.equal(m.satellite,'Terra');
 const v={...row,satellite:'SNPP',instrument:'SNPP',confidence:'n',version:'2'};
 const o=normalize(v,'viirs');assert.equal(o.satellite,'S-NPP');assert.equal(o.version,'2');
 assert.equal(o.id,normalize({...v,satellite:'N',instrument:'VIIRS'},'viirs').id);
 for(const patch of [{satellite:'N21'},{satellite:'unknown'},{version:'2.0NRT'},{version:'999'},{instrument:'MODIS'}])assert.throws(()=>normalize({...v,...patch},'viirs'));
 for(const version of ['61','61.99','999'])assert.throws(()=>normalize({...row,version},'modis'));
});
test('polygon clipping excludes bbox-only points and includes borders',()=>{const boundary:any={type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[95,19],[97,19],[95,21],[95,19]]]}};assert(clip(normalize({...row,latitude:'19.2',longitude:'95.2'},'modis'),boundary));assert(!clip(normalize({...row,latitude:'20.9',longitude:'96.9'},'modis'),boundary));assert(clip(normalize({...row,latitude:'19',longitude:'95'},'modis'),boundary));});
test('CSV escapes quotes and delimiters, quantiles are reproducible',()=>{assert.equal(csv([{a:'x,"y"',b:null}]),'"a","b"\r\n"x,""y""",""');assert.deepEqual(quantiles([0,1,2,3,4]),[1,2,3,3]);});
