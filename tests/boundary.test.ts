import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clip,normalize} from '../lib/processing';
const boundary=JSON.parse(readFileSync('public/boundaries/MMR.geojson','utf8'));
test('real Myanmar boundary excludes neighboring bbox points and includes Yangon',()=>{const r={latitude:'16.84',longitude:'96.17',acq_date:'2025-01-01',acq_time:'1000',satellite:'Terra',confidence:'50',version:'6.1'};assert(clip(normalize(r,'modis'),boundary));assert(!clip(normalize({...r,latitude:'13.75',longitude:'100.5'},'modis'),boundary));});
