-- At native detail, group by the scientific cell ID; display coarsening is used only above the feature cap.
create or replace function public.map_cells(p_dataset text,p_area text,p_start date,p_end date,p_mode text,p_bbox double precision[],p_bin int)
returns jsonb language sql stable set search_path=public as $$
 with selected as (
 select *,case when p_bin=0 then cell_id else floor(lon/(p_bin/100.0))::text||':'||floor(lat/(p_bin/100.0))::text end display_key
 from cell_days where dataset=p_dataset and area=p_area and date between p_start and p_end
 and lon between p_bbox[1] and p_bbox[3] and lat between p_bbox[2] and p_bbox[4]
 and case p_mode when 'modis' then m>0 when 'viirs' then v>0 else m+v>0 end
 ), bins as (
 select display_key,avg(lon) lon,avg(lat) lat,sum(m) m,sum(v) v,count(*) occupied_cell_days,
 count(distinct date) active_days,count(distinct cell_id) cells,
 case when p_bin=0 then min(cell_id) else 'display-bin:'||display_key end cell_id
 from selected group by display_key
 ) select coalesce(jsonb_agg(to_jsonb(bins)),'[]') from bins;
$$;
revoke all on function public.map_cells(text,text,date,date,text,double precision[],int) from public,anon,authenticated;
grant execute on function public.map_cells(text,text,date,date,text,double precision[],int) to service_role;
