import test from 'node:test';
import assert from 'node:assert/strict';
import {quality,type AreaDay} from '../lib/analytics';
const day:AreaDay={date:'2025-01-01',m:0,v:0,union_count:0,both:0,modis_occupied:0,viirs_occupied:0,modis_complete:true,viirs_complete:true};
test('successful empty paired days have N/A agreement and complete ingestion',()=>{const q=quality([day],1);assert.equal(q.agreement.percent,null);assert.equal(q.ingestion.percent,100);assert.equal(q.paired_days,1);});
test('missing ledger dates stay incomplete and partial detections never enter agreement',()=>{const q=quality([{...day,m:100,both:10,union_count:50,viirs_complete:false},{...day,date:'2025-01-02',both:2,union_count:8}],3);assert.equal(q.agreement.percent,25);assert.equal(q.agreement.denominator,8);assert.equal(q.ingestion.numerator,5);assert.equal(q.ingestion.denominator,9);assert.equal(q.paired_days,1);});
