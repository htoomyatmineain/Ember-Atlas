create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create table if not exists public.areas(id text primary key, name text not null, iso3 text, parent_id text, geometry extensions.geometry(MultiPolygon,4326), bbox jsonb, boundary_source text, boundary_license text, boundary_version text);
create table if not exists public.datasets(id text primary key, method_version text not null default 'grid-v1', config_hash text not null, status text not null check(status in ('draft','published')), published_at timestamptz, spatial_year int, manifest jsonb not null default '[]', thresholds jsonb not null default '{}');
create table if not exists public.ingestion_chunks(id text primary key,dataset text references public.datasets(id) on delete cascade,source text,requested_start date,requested_end date,status text,metadata jsonb);
create table if not exists public.daily_source_status(dataset text references public.datasets(id) on delete cascade, date date, source text, status text,primary key(dataset,date,source));
create table if not exists public.cell_days(dataset text references public.datasets(id) on delete cascade,date date,cell_id text,area text references public.areas(id),lon double precision,lat double precision,m int not null,v int not null,primary key(dataset,date,cell_id));
create table if not exists public.area_days(dataset text references public.datasets(id) on delete cascade,area text references public.areas(id),date date,m bigint,v bigint,modis_occupied bigint,viirs_occupied bigint,"both" bigint,union_count bigint,modis_complete boolean,viirs_complete boolean,primary key(dataset,area,date));
create index if not exists cell_days_date on public.cell_days(dataset,date);
create index if not exists area_days_date on public.area_days(dataset,area,date);
create index if not exists areas_geometry on public.areas using gist(geometry);
-- All base tables are private. Browser clients cannot read or mutate scientific storage.
do $$ declare t text; begin foreach t in array array['areas','datasets','ingestion_chunks','daily_source_status','cell_days','area_days'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon, authenticated',t); end loop; end $$;
create or replace function public.map_cells(p_dataset text,p_area text,p_start date,p_end date,p_mode text,p_bbox double precision[],p_bin int)
returns jsonb language sql stable set search_path=public as $$
 with selected as (select *,floor(lon/(p_bin/100.0)) bx,floor(lat/(p_bin/100.0)) by from cell_days where dataset=p_dataset and area=p_area and date between p_start and p_end and lon between p_bbox[1] and p_bbox[3] and lat between p_bbox[2] and p_bbox[4] and case p_mode when 'modis' then m>0 when 'viirs' then v>0 else m+v>0 end), bins as (select bx,by,avg(lon) lon,avg(lat) lat,sum(m) m,sum(v) v,count(*) occupied_cell_days,count(distinct date) active_days,count(distinct cell_id) cells,case when p_bin=0 then min(cell_id) else 'display-bin' end cell_id from selected group by bx,by)
 select coalesce(jsonb_agg(to_jsonb(bins)),'[]') from bins;
$$;
revoke all on function public.map_cells(text,text,date,date,text,double precision[],int) from public,anon,authenticated;
grant execute on function public.map_cells(text,text,date,date,text,double precision[],int) to service_role;
create or replace function public.publish_dataset(p_id text) returns void language plpgsql set search_path=public as $$
begin
 if not exists(select 1 from datasets where id=p_id and status='draft') then raise exception 'Draft required'; end if;
 if not exists(select 1 from area_days where dataset=p_id) then raise exception 'No summaries'; end if;
 if exists(select 1 from ingestion_chunks where dataset=p_id and status<>'complete') then raise exception 'Incomplete chunks'; end if;
 update datasets set status='published',published_at=now() where id=p_id;
end $$;
revoke all on function public.publish_dataset(text) from public,anon,authenticated;
grant execute on function public.publish_dataset(text) to service_role;
