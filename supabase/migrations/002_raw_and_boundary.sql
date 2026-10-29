-- Optional compact raw subset. Full-year raw points publish only below the explicit row budget.
create table public.raw_detections(dataset text references public.datasets(id) on delete cascade,id text,date date,time text,lat double precision,lon double precision,satellite text,source text,confidence text,frp double precision,version text,cell_id text,primary key(dataset,id));
alter table public.raw_detections enable row level security;
revoke all on public.raw_detections from anon,authenticated;
create index raw_detections_date on public.raw_detections(dataset,date,source);
alter table public.datasets add column raw_year int;
create or replace function public.map_raw(p_dataset text,p_start date,p_end date,p_mode text,p_bbox double precision[])
returns jsonb language sql stable set search_path=public as $$
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') from (select id,date,time,lat,lon,satellite,source,confidence,frp,version,cell_id from raw_detections where dataset=p_dataset and date between p_start and p_end and source=p_mode and lon between p_bbox[1] and p_bbox[3] and lat between p_bbox[2] and p_bbox[4] limit 5001) r;
$$;
revoke all on function public.map_raw(text,date,date,text,double precision[]) from public,anon,authenticated;
grant execute on function public.map_raw(text,date,date,text,double precision[]) to service_role;
create or replace function public.set_area_geometry(p_geometry jsonb,p_bbox jsonb) returns void language sql set search_path=public,extensions as $$
 update public.areas set geometry=extensions.st_multi(extensions.st_setsrid(extensions.st_geomfromgeojson(p_geometry::text),4326)),bbox=p_bbox where id='MMR';
$$;
revoke all on function public.set_area_geometry(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.set_area_geometry(jsonb,jsonb) to service_role;
