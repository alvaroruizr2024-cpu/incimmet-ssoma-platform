-- Prueba mínima pgTAP para ejecutar después del esquema en Supabase local.
-- No prueba toda la matriz de permisos ni sustituye pruebas transaccionales.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(8);
select ok((select relrowsecurity from pg_class where oid = 'public.eventos'::regclass), 'RLS eventos activada');
select ok((select relrowsecurity from pg_class where oid = 'public.evidencias'::regclass), 'RLS evidencias activada');
select ok(not has_table_privilege('anon', 'public.eventos', 'SELECT'), 'Anon no puede leer eventos');
select ok(not has_table_privilege('authenticated', 'public.perfiles', 'UPDATE'), 'Usuario no puede escalar su rol');
select ok(not has_column_privilege('authenticated','public.evidencias','archivo_confirmado','UPDATE'), 'Cliente no puede confirmar Storage');
select ok(not has_table_privilege('authenticated','app_private.identidad_restringida','SELECT'), 'Identidad excluida de acceso de cliente');
select ok(not has_table_privilege('authenticated','public.historial','INSERT'), 'Auditoría no escribible por cliente');
select ok((select array_to_string(reloptions,',') like '%security_invoker=true%' from pg_class where oid = 'public.acciones_estado'::regclass), 'Vista de estado respeta RLS');
select * from finish();
rollback;
