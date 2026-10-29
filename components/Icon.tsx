import {Flame,Map,Columns2,ShieldCheck,CalendarDays,Share2,Download,X,Minus,Plus,ArrowUpRight,ChevronDown} from 'lucide-react';
const icons={flame:Flame,map:Map,compare:Columns2,quality:ShieldCheck,calendar:CalendarDays,share:Share2,download:Download,close:X,minus:Minus,plus:Plus,external:ArrowUpRight,chevron:ChevronDown};
export type IconName=keyof typeof icons;
export default function Icon({name,size=18,className=''}:{name:IconName;size?:number;className?:string}){const Glyph=icons[name];return <Glyph size={size} strokeWidth={1.25} aria-hidden="true" focusable="false" className={className}/>}
