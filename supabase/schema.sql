-- INCIMMET · Paso 2. Esquema de referencia para un proyecto Supabase vacío.
-- No ejecutado ni conectado a la demo. Aplicar primero en un entorno de pruebas.
-- Ninguna política depende del selector de rol del navegador o user_metadata.
begin;
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
create type public.rol_ssoma as enum ('gerencia', 'ssoma', 'supervisor', 'administrador', 'medico', 'rrhh');
create type public.estado_evento as enum ('Reportado','En investigación','Investigado','Acciones definidas','En seguimiento','Cerrado');
create type public.estado_verificado as enum ('Cerrada con evidencia','Declarada cerrada sin evidencia','Abierta','Vencida','Sin información');
create type public.jerarquia_control as enum ('Eliminación','Sustitución','Ingeniería','Administrativo','EPP');

create table public.perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rol public.rol_ssoma not null,
  funcion text,
  alcance_global boolean not null default false,
  habilitado boolean not null default true
);
-- Perfiles y membresías solo los escribe un servicio administrativo de confianza.
create table public.clientes (id uuid primary key default gen_random_uuid(), nombre text not null unique);
create table public.proyectos (
  codigo text primary key, nombre text not null, cliente_id uuid not null references public.clientes(id),
  activo boolean, meta_trifr numeric check (meta_trifr >= 0)
);
-- activo admite NULL para no inventar vigencia al importar la base histórica.
create table public.usuario_proyecto (
  user_id uuid not null references public.perfiles(user_id) on delete cascade,
  proyecto_codigo text not null references public.proyectos(codigo), primary key (user_id, proyecto_codigo)
);
create index usuario_proyecto_proyecto_idx on public.usuario_proyecto(proyecto_codigo, user_id);
create index proyectos_cliente_idx on public.proyectos(cliente_id);
create table public.contratos (
  id uuid primary key default gen_random_uuid(), proyecto_codigo text not null references public.proyectos(codigo),
  inicio date not null, fin date, check (fin is null or fin >= inicio)
);
create index contratos_proyecto_idx on public.contratos(proyecto_codigo);
create table public.empresas (
  id uuid primary key default gen_random_uuid(), nombre text not null,
  tipo text not null check (tipo in ('INCIMMET','Subcontrata','Tercero','Cliente'))
);
create table public.documentos_fuente (codigo text primary key, descripcion text not null, tipo text not null);
create table public.eventos (
  id text primary key, idempotencia uuid unique,
  proyecto_codigo text not null references public.proyectos(codigo), empresa_id uuid references public.empresas(id),
  fecha date, anio smallint not null, mes smallint check (mes between 1 and 12), hora time,
  area text, actividad text, equipo text, tipo text not null,
  tipo_grupo text not null check (tipo_grupo in ('Accidente','Incidente','Daño a la propiedad','Desvío','Ambiental','En investigación')),
  nivel_incimmet text check (nivel_incimmet in ('0','I','II','III','IV','V','VI')),
  pg_incimmet text, nivel_cliente text, pg_cliente text,
  alto_potencial boolean, riesgo_critico text, descripcion text not null,
  estado public.estado_evento, estado_origen text, confianza text,
  dias_perdidos numeric check (dias_perdidos >= 0), costo numeric check (costo >= 0), moneda text, penalidad text,
  creado_por uuid references public.perfiles(user_id), creado_en timestamptz,
  investigacion_revisada_por uuid references public.perfiles(user_id), investigacion_revisada_en timestamptz,
  resolucion_sin_acciones text,
  original jsonb,
  check (fecha is null or (extract(year from fecha) = anio and extract(month from fecha) = mes)),
  check ((investigacion_revisada_por is null) = (investigacion_revisada_en is null))
);
-- NULL de potencial es «Por confirmar» para nuevos reportes, nunca false implícito.
create index eventos_proyecto_fecha_idx on public.eventos(proyecto_codigo, fecha);
create index eventos_anio_mes_idx on public.eventos(anio, mes);
create index eventos_tipo_idx on public.eventos(tipo_grupo, tipo);
create index eventos_hpri_idx on public.eventos(proyecto_codigo, fecha) where alto_potencial is true;
create index eventos_empresa_idx on public.eventos(empresa_id);
create index eventos_texto_idx on public.eventos using gin(to_tsvector('spanish', coalesce(descripcion,'')));
create table public.evento_fuentes (
  evento_id text not null references public.eventos(id), documento_codigo text not null references public.documentos_fuente(codigo),
  ubicacion text not null default '', primary key(evento_id, documento_codigo, ubicacion)
);
create index evento_fuentes_documento_idx on public.evento_fuentes(documento_codigo);
create table public.personas_afectadas_anon (
  id uuid primary key default gen_random_uuid(), evento_id text not null references public.eventos(id),
  rol text not null, zona_corporal text check (zona_corporal in ('mano','pie','pierna','rostro/cabeza','ojo','espalda','hombro/brazo','tórax','Otra zona')),
  experiencia_meses integer check (experiencia_meses >= 0), empresa_id uuid references public.empresas(id)
);
create index personas_evento_idx on public.personas_afectadas_anon(evento_id);
create table app_private.identidad_restringida (
  persona_anon_id uuid primary key references public.personas_afectadas_anon(id),
  datos_cifrados bytea not null, version_clave text not null, actualizado_en timestamptz not null default now()
);
comment on table app_private.identidad_restringida is 'No exponer este esquema en la Data API. Cifrado por aplicación/KMS; no guardar llaves aquí. Lectura mediante backend médico/RRHH con auditoría. No poblar en la demo.';
create table public.causas (
  id uuid primary key default gen_random_uuid(), evento_id text not null references public.eventos(id),
  tipo text not null check (tipo in ('Inmediata-Acto','Inmediata-Condición','Básica-Personal','Básica-Trabajo')),
  codigo text, descripcion text not null,
  condicion_documental text not null check (condicion_documental in ('Confirmada','Inferida','No consta'))
);
create index causas_evento_idx on public.causas(evento_id);
create table public.acciones (
  id text primary key, evento_id text not null references public.eventos(id),
  proyecto_codigo text not null references public.proyectos(codigo), descripcion text not null, tipo text not null,
  jerarquia public.jerarquia_control not null, alcance text,
  responsable_rol text, responsable_usuario uuid references public.perfiles(user_id), fecha_compromiso date,
  estado_declarado text, fecha_estado_declarado date,
  estado_verificado_importado public.estado_verificado, fecha_corte_importado date,
  observaciones text, original jsonb
);
create index acciones_evento_idx on public.acciones(evento_id);
create index acciones_proyecto_compromiso_idx on public.acciones(proyecto_codigo, fecha_compromiso);
create index acciones_responsable_idx on public.acciones(responsable_usuario);
create table public.accion_proyectos_requeridos (
  accion_id text not null references public.acciones(id), proyecto_codigo text not null references public.proyectos(codigo),
  primary key (accion_id, proyecto_codigo)
);
create index accion_alcance_proyecto_idx on public.accion_proyectos_requeridos(proyecto_codigo);
create table public.evidencias (
  id uuid primary key default gen_random_uuid(), accion_id text not null references public.acciones(id),
  ruta_objeto text not null, nombre_archivo text not null, tipo text not null check (tipo in ('Foto','Informe','Registro','Otro')),
  mime text not null check(mime in ('image/jpeg','image/png','image/webp','application/pdf')),
  bytes bigint not null check (bytes > 0 and bytes <= 10485760),
  archivo_confirmado boolean not null default false, -- Solo servidor, después de confirmar Storage.
  creado_por uuid not null references public.perfiles(user_id), creado_en timestamptz not null default now(),
  decision text check (decision in ('Aceptada','Rechazada')),
  validado_por uuid references public.perfiles(user_id), validado_por_rol text,
  validado_en timestamptz, motivo text, alcance_completo boolean not null default false,
  proyectos_cubiertos text[] not null default '{}',
  check ((decision is null and validado_por is null and validado_en is null) or
    (decision is not null and validado_por is not null and validado_en is not null and
      validado_por <> creado_por and validado_por_rol = 'ssoma' and length(trim(motivo)) > 0)),
  check (validado_en is null or validado_en >= creado_en),
  check (decision is distinct from 'Aceptada' or (archivo_confirmado and alcance_completo))
);
create index evidencias_accion_idx on public.evidencias(accion_id);
create index evidencias_creador_idx on public.evidencias(creado_por);
create table public.lecciones (
  id text primary key, que_paso text not null, por_que text not null, leccion text not null,
  controles jsonb not null, actividad_critica text not null, riesgo_critico text not null, aplicabilidad text not null,
  estado text not null default 'Borrador' check(estado in ('Catalogada','Borrador','Publicada')),
  publicada_por uuid references public.perfiles(user_id), publicada_en timestamptz, version integer not null default 1,
  check (estado <> 'Publicada' or (publicada_por is not null and publicada_en is not null))
);
create index lecciones_texto_idx on public.lecciones using gin(to_tsvector('spanish', leccion || ' ' || riesgo_critico));
create table public.leccion_eventos (
  leccion_id text not null references public.lecciones(id), evento_id text not null references public.eventos(id),
  primary key (leccion_id, evento_id)
);
create index leccion_eventos_evento_idx on public.leccion_eventos(evento_id);
create table public.leccion_proyectos (
  leccion_id text not null references public.lecciones(id), proyecto_codigo text not null references public.proyectos(codigo),
  primary key (leccion_id, proyecto_codigo)
);
create index leccion_proyectos_proyecto_idx on public.leccion_proyectos(proyecto_codigo);
create table public.indicadores_periodo (
  id uuid primary key default gen_random_uuid(), anio smallint not null, mes smallint check(mes between 1 and 12),
  ambito text not null, proyecto_codigo text references public.proyectos(codigo),
  clase text not null check(clase in ('Oficial','Meta','Doce meses','No oficial')), version_fuente text not null,
  hht numeric check(hht >= 0), dias_perdidos numeric check(dias_perdidos >= 0),
  acc_nv1 integer, acc_nv2 integer, acc_nv3 integer, acc_nv4 integer, acc_nv5_6 integer,
  danos_propiedad integer, if_valor numeric, is_valor numeric, ia_valor numeric, trifr numeric,
  fuente text not null, desde date, hasta date, nota text,
  unique nulls not distinct(anio, mes, ambito, clase, version_fuente)
);
create index indicadores_ambito_periodo_idx on public.indicadores_periodo(ambito, anio, mes);
create table public.historial (
  id uuid primary key default gen_random_uuid(), proyecto_codigo text references public.proyectos(codigo),
  entidad text not null, entidad_id text not null, operacion text not null,
  actor_id uuid references public.perfiles(user_id), actor_rol text, fecha timestamptz not null default now(), datos jsonb
);
create index historial_entidad_idx on public.historial(entidad, entidad_id, fecha);
create index historial_proyecto_idx on public.historial(proyecto_codigo, fecha);

-- Funciones de permisos: esquema privado, search_path fijo, identidad del JWT firmada.
create function app_private.rol_actual() returns public.rol_ssoma language sql stable security definer set search_path = '' as $$
  select rol from public.perfiles where user_id = auth.uid() and habilitado
$$;
create function app_private.es_ssoma() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(app_private.rol_actual() = 'ssoma', false)
$$;
create function app_private.puede_ver_proyecto(codigo text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.perfiles p where p.user_id = auth.uid() and p.habilitado and
    (p.rol in ('ssoma','administrador') or
     (p.rol = 'gerencia' and p.alcance_global) or
     (p.rol in ('supervisor','gerencia') and exists(select 1 from public.usuario_proyecto up where up.user_id = p.user_id and up.proyecto_codigo = codigo))))
$$;
create function app_private.puede_ver_evento(eid text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.eventos e where e.id = eid and app_private.puede_ver_proyecto(e.proyecto_codigo))
$$;
create function app_private.puede_ver_accion(aid text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.acciones a where a.id = aid and app_private.puede_ver_proyecto(a.proyecto_codigo))
$$;
create function app_private.puede_adjuntar_accion(aid text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.acciones a join public.perfiles p on p.user_id = auth.uid() where a.id = aid and p.habilitado and
    (p.rol = 'ssoma' or (p.rol = 'supervisor' and app_private.puede_ver_proyecto(a.proyecto_codigo) and
      (a.responsable_usuario = p.user_id or (a.responsable_rol is not null and a.responsable_rol !~* '^no consta' and a.responsable_rol = p.funcion)))))
$$;

-- RLS de todas las tablas propias, revocando primero privilegios implícitos.
do $$ declare t text; begin
  foreach t in array array['perfiles','clientes','proyectos','usuario_proyecto','contratos','empresas','documentos_fuente','eventos','evento_fuentes','personas_afectadas_anon','causas','acciones','accion_proyectos_requeridos','evidencias','lecciones','leccion_eventos','leccion_proyectos','indicadores_periodo','historial'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
  end loop;
end $$;
create policy perfiles_lectura_propia on public.perfiles for select to authenticated using (user_id = (select auth.uid()));
create policy membresia_lectura_propia on public.usuario_proyecto for select to authenticated using (user_id = (select auth.uid()));
create policy proyectos_lectura on public.proyectos for select to authenticated using (app_private.puede_ver_proyecto(codigo));
create policy clientes_lectura on public.clientes for select to authenticated using (exists(select 1 from public.proyectos p where p.cliente_id = clientes.id));
create policy contratos_lectura on public.contratos for select to authenticated using (app_private.puede_ver_proyecto(proyecto_codigo));
create policy empresas_lectura on public.empresas for select to authenticated using ((select app_private.rol_actual()) in ('gerencia','ssoma','supervisor','administrador'));
create policy documentos_lectura on public.documentos_fuente for select to authenticated using ((select app_private.rol_actual()) in ('gerencia','ssoma','supervisor','administrador'));
create policy eventos_lectura on public.eventos for select to authenticated using (app_private.puede_ver_proyecto(proyecto_codigo));
grant insert on public.eventos to authenticated;
grant update (area,actividad,equipo,tipo,tipo_grupo,nivel_incimmet,pg_incimmet,nivel_cliente,pg_cliente,alto_potencial,riesgo_critico,descripcion,estado,investigacion_revisada_por,investigacion_revisada_en,resolucion_sin_acciones) on public.eventos to authenticated;
create policy eventos_reporte on public.eventos for insert to authenticated with check (
  (select app_private.rol_actual()) in ('supervisor','ssoma') and app_private.puede_ver_proyecto(proyecto_codigo)
  and creado_por = (select auth.uid()) and estado = 'Reportado' and creado_en is not null
  and investigacion_revisada_por is null and resolucion_sin_acciones is null
);
create policy eventos_investigacion on public.eventos for update to authenticated using ((select app_private.es_ssoma())) with check ((select app_private.es_ssoma()));
create policy fuentes_lectura on public.evento_fuentes for select to authenticated using (app_private.puede_ver_evento(evento_id));
create policy personas_lectura on public.personas_afectadas_anon for select to authenticated using (app_private.puede_ver_evento(evento_id));
create policy causas_lectura on public.causas for select to authenticated using (app_private.puede_ver_evento(evento_id));
create policy acciones_lectura on public.acciones for select to authenticated using (app_private.puede_ver_proyecto(proyecto_codigo));
create policy accion_alcance_lectura on public.accion_proyectos_requeridos for select to authenticated using (app_private.puede_ver_accion(accion_id));
-- Escrituras estructuradas solo SSOMA; sin delete desde clientes.
do $$ declare t text; begin
  foreach t in array array['evento_fuentes','personas_afectadas_anon','causas','acciones','accion_proyectos_requeridos','lecciones','leccion_eventos','leccion_proyectos'] loop
    execute format('grant insert, update on table public.%I to authenticated',t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select app_private.es_ssoma()))', t||'_ssoma_insert',t);
    execute format('create policy %I on public.%I for update to authenticated using ((select app_private.es_ssoma())) with check ((select app_private.es_ssoma()))',t||'_ssoma_update',t);
  end loop;
end $$;
-- Persona afectada: inserción por supervisor solo en su propio reporte aún Reportado.
create policy personas_en_reporte_propio on public.personas_afectadas_anon for insert to authenticated with check (
  (select app_private.rol_actual()) = 'supervisor' and exists(select 1 from public.eventos e where e.id = evento_id and e.creado_por = (select auth.uid()) and e.estado = 'Reportado')
);
create policy evidencia_lectura on public.evidencias for select to authenticated using (app_private.puede_ver_accion(accion_id));
grant insert(id,accion_id,ruta_objeto,nombre_archivo,tipo,mime,bytes,creado_por) on public.evidencias to authenticated;
grant update(decision,validado_por,validado_por_rol,validado_en,motivo,alcance_completo,proyectos_cubiertos) on public.evidencias to authenticated;
create policy evidencia_adjunto on public.evidencias for insert to authenticated with check (
  creado_por = (select auth.uid()) and app_private.puede_adjuntar_accion(accion_id) and not archivo_confirmado and decision is null
);
create policy evidencia_validacion on public.evidencias for update to authenticated using (
  (select app_private.es_ssoma()) and creado_por <> (select auth.uid()) and decision is null
) with check ((select app_private.es_ssoma()) and creado_por <> (select auth.uid()) and validado_por = (select auth.uid()) and validado_por_rol = 'ssoma');
create policy leccion_proyectos_lectura on public.leccion_proyectos for select to authenticated using (app_private.puede_ver_proyecto(proyecto_codigo));
create policy leccion_eventos_lectura on public.leccion_eventos for select to authenticated using (app_private.puede_ver_evento(evento_id));
create policy lecciones_lectura on public.lecciones for select to authenticated using (
  (select app_private.es_ssoma()) or (estado in ('Catalogada','Publicada') and exists(select 1 from public.leccion_proyectos lp where lp.leccion_id = lecciones.id and app_private.puede_ver_proyecto(lp.proyecto_codigo)))
);
create policy indicadores_lectura on public.indicadores_periodo for select to authenticated using (
  (select app_private.es_ssoma()) or app_private.puede_ver_proyecto(proyecto_codigo) or
  ((select app_private.rol_actual()) = 'gerencia' and exists(select 1 from public.perfiles p where p.user_id = (select auth.uid()) and p.alcance_global))
);
create policy historial_lectura on public.historial for select to authenticated using (
  (select app_private.es_ssoma()) or app_private.puede_ver_proyecto(proyecto_codigo)
);
-- Sin permisos de escritura en perfiles, membresías, indicadores, historial ni confirmación de Storage.

-- Identidad restringida: ningún rol analítico puede verla; no exponer app_private.
alter table app_private.identidad_restringida enable row level security;
revoke all on app_private.identidad_restringida from public, anon, authenticated;
-- Política de referencia para el backend autorizado; el cliente NO recibe un grant SELECT.
create policy identidad_medico_rrhh on app_private.identidad_restringida for select to authenticated using (
  (select app_private.rol_actual()) in ('medico','rrhh') and (select auth.jwt()->>'aal') = 'aal2'
);
-- TODO: acceso médico/RRHH mediante endpoint con auditoría de lectura y descifrado KMS.

-- Estado operativo calculado. El estado importado se conserva en otra columna y no habilita cierre.
create function app_private.estado_accion(aid text, corte date) returns public.estado_verificado
language sql stable security invoker set search_path = '' as $$
  select case
    when exists(select 1 from public.evidencias ev where ev.accion_id = a.id and ev.archivo_confirmado
      and ev.decision = 'Aceptada' and ev.alcance_completo
      and (ev.validado_en at time zone 'America/Lima')::date <= corte
      and ev.validado_por <> ev.creado_por
      and exists(select 1 from public.accion_proyectos_requeridos ar where ar.accion_id = a.id)
      and not exists(select 1 from public.accion_proyectos_requeridos ar where ar.accion_id = a.id and not(ar.proyecto_codigo = any(ev.proyectos_cubiertos))))
      then 'Cerrada con evidencia'::public.estado_verificado
    when (a.fecha_estado_declarado is null or a.fecha_estado_declarado <= corte)
      and coalesce(a.estado_declarado,'') ~* '^\s*(cerrad[ao]|finalizad[ao]|realizad[ao]|implementad[ao]|completad[ao]|concluid[ao])\y'
      then 'Declarada cerrada sin evidencia'::public.estado_verificado
    when a.fecha_compromiso < corte then 'Vencida'::public.estado_verificado
    when a.fecha_compromiso >= corte or ((a.fecha_estado_declarado is null or a.fecha_estado_declarado <= corte) and coalesce(a.estado_declarado,'') ~* 'en proceso')
      then 'Abierta'::public.estado_verificado
    else 'Sin información'::public.estado_verificado end
  from public.acciones a where a.id = aid
$$;
create view public.acciones_estado with (security_invoker = true) as
  select a.*, app_private.estado_accion(a.id, (now() at time zone 'America/Lima')::date) as estado_operativo from public.acciones a;
revoke all on public.acciones_estado from anon, authenticated;
grant select on public.acciones_estado to authenticated;

-- Coherencia de claves del evento y la acción.
create function app_private.comprobar_accion_proyecto() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.eventos e where e.id = new.evento_id and e.proyecto_codigo = new.proyecto_codigo) then
    raise exception 'El proyecto de la acción debe coincidir con el evento';
  end if;
  return new;
end $$;
create trigger accion_proyecto before insert or update on public.acciones for each row execute function app_private.comprobar_accion_proyecto();

create function app_private.comprobar_validacion() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.decision is distinct from old.decision or new.validado_por is distinct from old.validado_por then
    if not app_private.es_ssoma() or new.validado_por is distinct from auth.uid() or old.creado_por = auth.uid() then raise exception 'Verificador SSOMA distinto del ejecutor requerido'; end if;
    if old.decision is not null then raise exception 'La validación es inmutable; generar una revisión'; end if;
    if new.decision = 'Aceptada' and (not old.archivo_confirmado or not new.alcance_completo or
      not exists(select 1 from public.accion_proyectos_requeridos ar where ar.accion_id = new.accion_id) or
      exists(select 1 from public.accion_proyectos_requeridos ar where ar.accion_id = new.accion_id and not(ar.proyecto_codigo = any(new.proyectos_cubiertos)))) then raise exception 'Evidencia o cobertura insuficiente'; end if;
    new.validado_en := now();
    new.validado_por_rol := 'ssoma';
  end if;
  return new;
end $$;
create trigger validacion_controlada before update on public.evidencias for each row execute function app_private.comprobar_validacion();

create function app_private.comprobar_cierre() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.estado = 'Cerrado' and old.estado is distinct from 'Cerrado' then
    if not app_private.es_ssoma() then raise exception 'Solo SSOMA puede cerrar eventos'; end if;
    if new.investigacion_revisada_por is null or new.investigacion_revisada_en is null then raise exception 'Investigación revisada requerida'; end if;
    if not exists(select 1 from public.causas c where c.evento_id = new.id and c.tipo like 'Inmediata-%' and c.condicion_documental = 'Confirmada') or
       not exists(select 1 from public.causas c where c.evento_id = new.id and c.tipo like 'Básica-%' and c.condicion_documental = 'Confirmada') then raise exception 'Faltan causas confirmadas y revisadas'; end if;
    if not exists(select 1 from public.acciones a where a.evento_id = new.id) and coalesce(length(trim(new.resolucion_sin_acciones)),0) = 0 then raise exception 'Sin acciones: se requiere resolución explícita'; end if;
    if exists(select 1 from public.acciones a where a.evento_id = new.id and app_private.estado_accion(a.id,(now() at time zone 'America/Lima')::date) <> 'Cerrada con evidencia') then raise exception 'Hay acciones sin cierre operativo suficiente'; end if;
  end if;
  return new;
end $$;
create trigger cierre_controlado before update on public.eventos for each row execute function app_private.comprobar_cierre();

-- Publicación es hito, no un nuevo enum de Evento.estado.
create function app_private.comprobar_publicacion() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.estado = 'Publicada' then
    if not app_private.es_ssoma() or new.publicada_por is distinct from auth.uid() then raise exception 'Publicación reservada a SSOMA'; end if;
    if not exists(select 1 from public.leccion_eventos le where le.leccion_id = new.id) or
       exists(select 1 from public.leccion_eventos le join public.eventos e on e.id = le.evento_id where le.leccion_id = new.id and e.estado is distinct from 'Cerrado') then raise exception 'Vincule y cierre los eventos antes de publicar'; end if;
    new.publicada_en := now();
  end if;
  return new;
end $$;
create trigger publicacion_controlada before insert or update on public.lecciones for each row execute function app_private.comprobar_publicacion();

-- Las funciones privadas no quedan ejecutables por PUBLIC por defecto.
revoke all on all functions in schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.rol_actual(), app_private.es_ssoma(), app_private.puede_ver_proyecto(text),
  app_private.puede_ver_evento(text), app_private.puede_ver_accion(text), app_private.puede_adjuntar_accion(text),
  app_private.estado_accion(text,date) to authenticated;

-- TODO antes de producción: bucket Storage privado y políticas path/acción; confirmar objeto en servidor;
-- RPC transaccional con bloqueo de evento/acciones al cerrar y reabrir; auditoría de cambios y de lecturas
-- médicas; gestión de versiones, revalidación al cambiar alcance/plazo y tests pgTAP completos.
-- No habilitar el adaptador real hasta terminar y probar estas piezas. No hay secreto de servicio en el frontend.
commit;
