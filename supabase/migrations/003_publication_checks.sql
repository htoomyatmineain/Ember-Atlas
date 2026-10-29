-- Verify spatial aggregates and completeness before the immutable version becomes visible.
create or replace function public.publish_dataset(p_id text) returns void language plpgsql set search_path=public as $$
declare spatial int;
begin
 select spatial_year into spatial from datasets where id=p_id and status='draft';
 if not found then raise exception 'Draft required'; end if;
 if not exists(select 1 from area_days where dataset=p_id) then raise exception 'No summaries'; end if;
 if exists(select 1 from ingestion_chunks where dataset=p_id and status<>'complete') then raise exception 'Incomplete chunks'; end if;
 if exists(select 1 from area_days a where dataset=p_id and
 (a.modis_complete <> (exists(select 1 from daily_source_status s where s.dataset=p_id and s.date=a.date and s.source='Terra' and s.status='complete') and exists(select 1 from daily_source_status s where s.dataset=p_id and s.date=a.date and s.source='Aqua' and s.status='complete')) or
 a.viirs_complete <> exists(select 1 from daily_source_status s where s.dataset=p_id and s.date=a.date and s.source='S-NPP' and s.status='complete'))) then raise exception 'Ledger mismatch'; end if;
 if exists(select 1 from area_days a left join (select date,sum(m) m,sum(v) v,count(*) occupied,count(*) filter(where m>0) mo,count(*) filter(where v>0) vo,count(*) filter(where m>0 and v>0) both_count from cell_days where dataset=p_id group by date) c on c.date=a.date where a.dataset=p_id and extract(year from a.date)=spatial and (a.m<>coalesce(c.m,0) or a.v<>coalesce(c.v,0) or a.union_count<>coalesce(c.occupied,0) or a."both"<>coalesce(c.both_count,0) or a.modis_occupied<>coalesce(c.mo,0) or a.viirs_occupied<>coalesce(c.vo,0))) then raise exception 'Spatial summary mismatch'; end if;
 update datasets set status='published',published_at=now() where id=p_id;
end $$;
revoke all on function public.publish_dataset(text) from public,anon,authenticated;
grant execute on function public.publish_dataset(text) to service_role;
