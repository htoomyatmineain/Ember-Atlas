'use client';
import {useState} from 'react';
import Icon from './Icon';
import {dates,type Filters} from '@/lib/model';
const months=Array.from({length:12},(_,i)=>new Date(Date.UTC(2025,i,1)).toLocaleString('en',{month:'short',timeZone:'UTC'}));
type Props={filters:Filters;calendar:any;open:boolean;onChange:(patch:Partial<Filters>)=>void;onClose:()=>void};
export default function ActivityCalendar({filters:f,calendar,open,onChange,onClose}:Props){
 const [view,setView]=useState<'year'|'month'>('year');
 const all=dates(f.year),month=f.month??1;
 const shown=view==='year'?all:all.filter(d=>Number(d.slice(5,7))===month);
 const offset=(new Date(shown[0]+'T00:00:00Z').getUTCDay()+6)%7;
 const weeks=Math.ceil((offset+shown.length)/7);
 const dayMap=new Map<string,any>((calendar?.days??[]).map((d:any)=>[d.date,d]));
 const labels=view==='year'?months.map((name,i)=>({name,col:1+Math.floor((offset+all.indexOf(`${f.year}-${String(i+1).padStart(2,'0')}-01`))/7)})):[{name:months[month-1],col:1}];
 return <section id="activity-calendar" className={'calendar-section contribution-calendar '+(view==='month'?'contribution-month':'')} hidden={!open} aria-label="Activity heatmap calendar">
  <div className="contribution-heading"><div><h2>Burning activity <span>{f.year}</span></h2><p>{calendar?.unit??'occupied cells / UTC day'} · UTC</p></div><div className="contribution-controls">
   <div className="calendar-view-switch" role="group" aria-label="Calendar view"><button aria-pressed={view==='year'} onClick={()=>setView('year')}>Year</button><button aria-pressed={view==='month'} onClick={()=>{setView('month');if(!f.month)onChange({month:1,day:undefined})}}>Month</button></div>
   <label className="sr-only" htmlFor="heatmap-month">Filter month</label><select id="heatmap-month" value={f.month??0} onChange={e=>{const m=Number(e.target.value);onChange({month:m||undefined,day:undefined});if(!m)setView('year')}}><option value="0">Whole year</option>{months.map((name,i)=><option key={name} value={i+1}>{name}</option>)}</select>
   <label className="sr-only" htmlFor="heatmap-year">Calendar year</label><select id="heatmap-year" value={f.year} onChange={e=>onChange({year:Number(e.target.value),day:undefined})}>{Array.from({length:11},(_,i)=>2025-i).map(y=><option key={y}>{y}</option>)}</select>
   <button className="calendar-minimize" aria-label="Hide calendar" onClick={onClose}><Icon name="minus" size={16}/></button>
  </div></div>
  <div className="contribution-scroll"><div className="contribution-chart" style={{'--weeks':weeks} as React.CSSProperties}>
   <div className="contribution-month-labels">{labels.map(({name,col})=><span key={name} style={{gridColumn:col}}>{name}</span>)}</div>
   <div className="contribution-weekdays" aria-hidden="true">{['Mon','','Wed','','Fri','','Sun'].map((d,i)=><span key={i}>{d}</span>)}</div>
   <div className="contribution-cells" aria-label={`${f.year} ${view==='year'?'daily activity':months[month-1]+' daily activity'}`}>
    {Array.from({length:offset},(_,i)=><span className="contribution-blank" key={'blank'+i} aria-hidden="true"/>)}
    {shown.map((date,index)=>{const d=dayMap.get(date),value=d?.value,complete=d?.completeness==='complete',thresholds=calendar?.thresholds??[];
     const level=value>0?Math.min(4,1+thresholds.filter((t:number)=>value>t).length):0;
     const selected=f.month===Number(date.slice(5,7))&&f.day===Number(date.slice(8));
     const inMonth=!!f.month&&f.month===Number(date.slice(5,7));
     const label=`${date}: ${value==null?'unavailable':value.toLocaleString()+' '+(calendar?.unit??'occupied cells')}; ${d?.completeness??'unavailable'} ingestion`;
     return <button key={date} data-day-index={index} className={'contribution-day '+(complete?(value===0?'zero':'level'+level):'unavailable')+(selected?' contribution-selected':'')+(inMonth?' contribution-in-month':'')} title={label} aria-label={label} aria-pressed={selected} onClick={()=>onChange({month:Number(date.slice(5,7)),day:selected?undefined:Number(date.slice(8))})} onKeyDown={event=>{const delta=({ArrowUp:-1,ArrowDown:1,ArrowLeft:-7,ArrowRight:7} as Record<string,number>)[event.key];if(delta){event.preventDefault();const next=index+delta;event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-day-index="${next}"]`)?.focus()}}}>{view==='month'?Number(date.slice(8)):null}</button>
    })}
   </div>
  </div></div>
  <div className="contribution-footer"><span>Map: {f.month?months[f.month-1]:'Whole year'} {f.day?f.day+' · ':''}{f.year} <span className="heatmap-hint">· click a square to explore</span></span><div className="calendar-legend"><span><i className="unavailable"/> Unavailable</span><span><i className="zero"/> Zero</span><span>Less <i className="level1"/><i className="level2"/><i className="level3"/><i className="level4"/> More</span></div></div>
 </section>
}
