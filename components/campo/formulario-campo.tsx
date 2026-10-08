'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ActorDemo, DataJson, PersonaReporte, ZonaCorporal } from '@/lib/types';
import type { BorradorCampo, FormularioCampo } from '@/lib/pwa/types';
import { ColaCampo } from '@/lib/pwa/cola';
import { aReporte, erroresPaso, textosFormulario } from '@/lib/pwa/formulario';
import { formatoFecha } from '@/lib/domain/fechas';
import { revisarPrivacidad } from '@/lib/domain/privacidad';
import { comprimirFoto } from '@/lib/pwa/fotos';
import { constructorVoz, type Reconocimiento } from '@/lib/pwa/voz';
import { Button } from '@/components/ui/button';
const pasos = ['Ubicación y momento', 'Qué ocurrió', 'Persona afectada', 'Acciones y revisión'];
const zonas: ZonaCorporal[] = [
  'mano',
  'pie',
  'pierna',
  'rostro/cabeza',
  'ojo',
  'espalda',
  'hombro/brazo',
  'tórax',
  'Otra zona',
];
function Foto({ foto, index, quitar }: { foto: File; index: number; quitar: () => void }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(foto);
    const frame = requestAnimationFrame(() => setUrl(u));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(u);
    };
  }, [foto]);
  return (
    <figure className="rounded-lg border border-border p-2">
      {url && (
        <Image
          unoptimized
          src={url}
          width={240}
          height={160}
          alt={`Foto ${index + 1} del suceso, pendiente de revisión de privacidad`}
          className="h-32 w-full rounded object-contain"
        />
      )}
      <figcaption className="text-xs">
        Foto {index + 1} · {Math.round(foto.size / 1024)} KiB · JPEG sin EXIF
      </figcaption>
      <Button
        type="button"
        variant="outline"
        onClick={quitar}
        aria-label={`Retirar foto ${index + 1}`}
        className="mt-2 w-full"
      >
        Retirar
      </Button>
    </figure>
  );
}
export function FormularioReporte({
  inicial,
  data,
  actor,
  cola,
  terminado,
  cancelar,
}: {
  inicial: BorradorCampo;
  data: DataJson;
  actor: ActorDemo;
  cola: ColaCampo;
  terminado: () => void;
  cancelar: () => void;
}) {
  const [f, setF] = useState<FormularioCampo>(inicial.formulario);
  const [fotos, setFotos] = useState<File[]>(inicial.fotos);
  const [paso, setPaso] = useState(inicial.paso);
  const [mensaje, setMensaje] = useState('');
  const [errores, setErrores] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [listening, setListening] = useState(false),
    [vozDisponible, setVozDisponible] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null),
    cameraRef = useRef<HTMLInputElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const voz = useRef<Reconocimiento | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVozDisponible(Boolean(constructorVoz())));
    return () => {
      cancelAnimationFrame(frame);
      voz.current?.abort();
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [paso]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const privacy = revisarPrivacidad(textosFormulario(f, fotos));
      if (privacy.bloqueos.length || privacy.advertencias.length) {
        setMensaje('Cambios sin guardar: retire los posibles datos personales.');
        return;
      }
      void cola
        .guardarBorrador({
          ...inicial,
          actor,
          formulario: f,
          fotos,
          paso,
          actualizadoEn: new Date().toISOString(),
        })
        .then(
          () => setMensaje('Borrador guardado en este dispositivo.'),
          () =>
            setMensaje(
              'No se pudo guardar el borrador. Revise el espacio disponible; no cierre esta pantalla.',
            ),
        );
    }, 700);
    return () => clearTimeout(timer);
  }, [f, fotos, paso, cola, inicial, actor]);
  function change<K extends keyof FormularioCampo>(k: K, value: FormularioCampo[K]) {
    setF((prev) => ({
      ...prev,
      [k]: value,
      ...(k === 'revisionPrivacidad' ? {} : { revisionPrivacidad: false }),
    }));
    setErrores([]);
  }
  const privacy = revisarPrivacidad(textosFormulario(f, fotos));
  async function adjuntar(files: FileList | null) {
    if (!files?.length) return;
    if (fotos.length + files.length > 10) {
      setErrores(['Máximo 10 fotos por reporte.']);
      return;
    }
    setBusy(true);
    setErrores([]);
    try {
      const nuevas: File[] = [];
      // Process sequentially to bound peak memory on phones.
      for (const file of Array.from(files)) nuevas.push(await comprimirFoto(file));
      setFotos((prev) => [...prev, ...nuevas]);
      setF((prev) => ({ ...prev, revisionPrivacidad: false }));
    } catch (e) {
      setErrores([e instanceof Error ? e.message : 'No se pudieron preparar las fotos.']);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
      if (cameraRef.current) cameraRef.current.value = '';
    }
  }
  function dictar() {
    if (listening) {
      voz.current?.stop();
      return;
    }
    const Constructor = constructorVoz();
    if (!Constructor) return;
    const recognition = new Constructor();
    voz.current = recognition;
    recognition.lang = 'es-PE';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ');
      setF((prev) => ({
        ...prev,
        descripcion: [prev.descripcion, text].filter(Boolean).join(' '),
        revisionPrivacidad: false,
      }));
    };
    recognition.onerror = () => {
      setListening(false);
      setErrores([
        'No se pudo dictar. Use el teclado; el servicio de voz puede requerir conexión.',
      ]);
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      setListening(true);
    } catch {
      setErrores(['Micrófono no disponible. Use el teclado.']);
    }
  }
  async function guardarBorradorYSaliroAvanzar(destino: number | null) {
    setBusy(true);
    setErrores([]);
    try {
      await cola.guardarBorrador({
        ...inicial,
        actor,
        formulario: f,
        fotos,
        paso: destino ?? paso,
        actualizadoEn: new Date().toISOString(),
      });
      if (destino === null) cancelar();
      else {
        setPaso(destino);
        setMensaje('Borrador guardado en este dispositivo.');
      }
    } catch (e) {
      setErrores([
        e instanceof Error ? e.message : 'No se pudo guardar. Permanezca en el formulario.',
      ]);
    } finally {
      setBusy(false);
    }
  }
  async function guardar() {
    setBusy(true);
    setErrores([]);
    try {
      const reporte = aReporte(f, fotos, inicial.id, data, actor);
      await cola.encolar({
        id: inicial.id,
        actor,
        reporte,
        estado: 'pendiente',
        intentos: 0,
        creadoEn: new Date().toISOString(),
        ultimoError: null,
        acuseLocal: null,
      });
      terminado();
    } catch (e) {
      setErrores([e instanceof Error ? e.message : 'No se pudo guardar el reporte.']);
    } finally {
      setBusy(false);
    }
  }
  const persona = (index: number, patch: Partial<PersonaReporte>) =>
    change(
      'personas',
      f.personas.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    );
  return (
    <section
      className="campo-form rounded-xl border border-border bg-card p-4 sm:p-6"
      aria-label="Formulario de reporte"
    >
      <ol className="mb-5 grid grid-cols-4 gap-2 text-xs" aria-label="Progreso del reporte">
        {pasos.map((titulo, i) => (
          <li
            key={titulo}
            aria-current={paso === i ? 'step' : undefined}
            className={`rounded border px-2 py-3 ${paso === i ? 'border-brand-blue bg-brand-deep text-white' : 'border-border'}`}
          >
            <span className="font-bold">{i + 1}</span>
            <span className="ml-2 hidden sm:inline">{titulo}</span>
          </li>
        ))}
      </ol>
      <h2 ref={heading} tabIndex={-1} className="mb-5 text-xl font-semibold">
        Paso {paso + 1} de 4 · {pasos[paso]}
      </h2>
      <p className="mb-4 text-sm text-secondary">
        No ingrese nombres, DNI ni diagnósticos. Este reporte no sustituye el canal de emergencia de
        la operación.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (paso === 3) void guardar();
          else {
            const error = erroresPaso(f, paso);
            if (error.length) setErrores(error);
            else void guardarBorradorYSaliroAvanzar(paso + 1);
          }
        }}
      >
        <fieldset disabled={busy} className="grid min-w-0 gap-4">
          <legend className="sr-only">{pasos[paso]}</legend>
          {paso === 0 && (
            <>
              <label>
                Proyecto
                <select
                  className="w-full min-w-0"
                  value={f.proyectoCodigo}
                  disabled
                  aria-label="Proyecto del reporte"
                >
                  {data.proyectos
                    .filter((p) => p.codigo === f.proyectoCodigo)
                    .map((p) => (
                      <option value={p.codigo} key={p.codigo}>
                        {p.nombre}
                      </option>
                    ))}
                </select>
                <span className="text-xs text-secondary">
                  Cambie de proyecto desde Campo antes de iniciar otro reporte.
                </span>
              </label>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <label>
                  Fecha
                  <input
                    aria-label="Fecha del evento"
                    type="date"
                    value={f.fecha}
                    onChange={(e) => change('fecha', e.target.value)}
                  />
                </label>
                <label>
                  Hora
                  <input
                    aria-label="Hora del evento"
                    type="time"
                    value={f.hora}
                    onChange={(e) => change('hora', e.target.value)}
                  />
                </label>
              </div>
              <p className="text-xs text-secondary">
                Zona horaria America/Lima (UTC-5). Verifique el reloj y el momento real del evento.
              </p>
              <label>
                Lugar o labor
                <input
                  aria-label="Lugar o labor"
                  maxLength={200}
                  value={f.area}
                  onChange={(e) => change('area', e.target.value)}
                  placeholder="Ej.: rampa, nivel, taller"
                />
              </label>
            </>
          )}
          {paso === 1 && (
            <>
              <label>
                Tipo provisional
                <select
                  className="w-full min-w-0"
                  value={f.tipo}
                  onChange={(e) => change('tipo', e.target.value)}
                >
                  {data.catalogos.tipos_evento.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Actividad
                <input
                  maxLength={200}
                  value={f.actividad}
                  onChange={(e) => change('actividad', e.target.value)}
                  placeholder="No consta si lo deja vacío"
                />
              </label>
              <label>
                Equipo
                <input
                  maxLength={160}
                  value={f.equipo}
                  onChange={(e) => change('equipo', e.target.value)}
                  placeholder="No consta si lo deja vacío"
                />
              </label>
              <label>
                Riesgo crítico
                <select
                  className="w-full min-w-0"
                  value={f.riesgoCritico}
                  onChange={(e) => change('riesgoCritico', e.target.value)}
                >
                  <option value="">No consta / Por evaluar</option>
                  {[
                    ...new Set(
                      data.eventos.flatMap((e) => (e.riesgo_critico ? [e.riesgo_critico] : [])),
                    ),
                  ]
                    .sort()
                    .map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                </select>
              </label>
              <label>
                Alto potencial
                <select
                  className="w-full min-w-0"
                  value={f.potencial}
                  onChange={(e) =>
                    change('potencial', e.target.value as FormularioCampo['potencial'])
                  }
                >
                  <option value="confirmar">Por confirmar</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label>
                Descripción del hecho
                <textarea
                  aria-label="Descripción del hecho"
                  maxLength={4000}
                  rows={5}
                  value={f.descripcion}
                  onChange={(e) => change('descripcion', e.target.value)}
                />
              </label>
              {vozDisponible && (
                <>
                  <Button type="button" variant="outline" aria-pressed={listening} onClick={dictar}>
                    {listening ? 'Detener dictado' : 'Dictar descripción'}
                  </Button>
                  <p className="text-xs text-secondary">
                    El reconocimiento de voz puede usar servicios del navegador y necesitar
                    conexión. No dicte datos personales. El teclado funciona sin conexión.
                  </p>
                </>
              )}
              <input
                className="hidden"
                ref={cameraRef}
                aria-label="Tomar fotos del evento"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={(e) => {
                  void adjuntar(e.target.files);
                }}
              />
              <input
                className="hidden"
                ref={fileRef}
                aria-label="Adjuntar fotos del evento"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  void adjuntar(e.target.files);
                }}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => cameraRef.current?.click()}>
                  Tomar foto
                </Button>
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  Seleccionar fotos
                </Button>
              </div>
              <p className="text-xs text-secondary">
                Opcional, hasta 10 fotos. Revise rostros, credenciales y documentos: quitar EXIF no
                anonimiza la imagen.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {fotos.map((foto, i) => (
                  <Foto
                    key={`${foto.name}-${i}`}
                    foto={foto}
                    index={i}
                    quitar={() => {
                      setFotos((prev) => prev.filter((_, idx) => idx !== i));
                      change('revisionPrivacidad', false);
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {paso === 2 && (
            <>
              <label>
                ¿Hubo persona afectada?
                <select
                  className="w-full min-w-0"
                  value={f.personaAfectada}
                  onChange={(e) => {
                    const value = e.target.value as FormularioCampo['personaAfectada'];
                    if (
                      value === 'no' &&
                      f.personaAfectada === 'si' &&
                      f.personas.some((p) => p.rol) &&
                      !window.confirm(
                        'Se retirarán los roles y zonas corporales de este reporte. ¿Continuar?',
                      )
                    )
                      return;
                    setF((prev) => ({
                      ...prev,
                      personaAfectada: value,
                      personas: value === 'no' ? [{ rol: '', zonaCorporal: null }] : prev.personas,
                      revisionPrivacidad: false,
                    }));
                  }}
                >
                  <option value="">Seleccione</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </label>
              {f.personaAfectada === 'si' &&
                f.personas.map((p, i) => (
                  <fieldset key={i} className="grid gap-3 rounded border border-border p-4">
                    <legend className="px-1 text-sm">
                      Persona afectada {i + 1} · Sin identidad
                    </legend>
                    <label>
                      Rol
                      <input
                        maxLength={100}
                        aria-label={`Rol de persona ${i + 1}`}
                        value={p.rol}
                        onChange={(e) => persona(i, { rol: e.target.value })}
                        placeholder="Ej.: operador"
                      />
                    </label>
                    <label>
                      Zona corporal general
                      <select
                        className="w-full min-w-0"
                        aria-label={`Zona corporal de persona ${i + 1}`}
                        value={p.zonaCorporal ?? ''}
                        onChange={(e) =>
                          persona(i, {
                            zonaCorporal: (e.target.value || null) as ZonaCorporal | null,
                          })
                        }
                      >
                        <option value="">No consta</option>
                        {zonas.map((z) => (
                          <option key={z}>{z}</option>
                        ))}
                      </select>
                    </label>
                    {i > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          change(
                            'personas',
                            f.personas.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        Retirar persona {i + 1}
                      </Button>
                    )}
                  </fieldset>
                ))}
              {f.personaAfectada === 'si' && f.personas.length < 20 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    change('personas', [...f.personas, { rol: '', zonaCorporal: null }])
                  }
                >
                  Agregar otro rol y zona
                </Button>
              )}
              <p className="text-sm">
                No se solicitan nombres, documentos de identidad, información psicológica ni
                resultados médicos.
              </p>
            </>
          )}
          {paso === 3 && (
            <>
              <label>
                Acciones inmediatas
                <textarea
                  aria-label="Acciones inmediatas"
                  maxLength={2000}
                  rows={4}
                  value={f.accionesInmediatas}
                  onChange={(e) => change('accionesInmediatas', e.target.value)}
                  placeholder="Describa lo ejecutado. Si no consta, indique la brecha."
                />
              </label>
              <div className="rounded-lg border border-border bg-background p-4 text-sm">
                <h3 className="mb-3 font-semibold">Revisar antes de guardar</h3>
                <dl className="grid gap-2">
                  <dt>Proyecto y lugar</dt>
                  <dd>
                    {f.proyectoCodigo} · {f.area}
                  </dd>
                  <dt>Momento</dt>
                  <dd>
                    {formatoFecha(f.fecha)} · {f.hora} · America/Lima
                  </dd>
                  <dt>Descripción</dt>
                  <dd className="whitespace-pre-wrap break-words">{f.descripcion}</dd>
                  <dt>Personas afectadas</dt>
                  <dd>
                    {f.personaAfectada === 'si'
                      ? `${f.personas.length} registro(s), solo rol y zona`
                      : 'No'}
                  </dd>
                  <dt>Fotos</dt>
                  <dd>{fotos.length} adjuntas</dd>
                </dl>
              </div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={f.revisionPrivacidad}
                  onChange={(e) => change('revisionPrivacidad', e.target.checked)}
                />
                <span>
                  Revisé el texto y las fotos: no contienen nombres, DNI, diagnósticos ni otra
                  información personal prohibida.
                </span>
              </label>
              <a
                className="text-brand-blue underline dark:text-brand-cyan"
                href="/privacidad"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacidad y tratamiento de datos · Ley 29733
              </a>
            </>
          )}
        </fieldset>
        {[...new Set([...errores, ...privacy.bloqueos, ...privacy.advertencias])].length > 0 && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-500 bg-red-50 p-4 text-sm text-red-900"
          >
            {[...new Set([...errores, ...privacy.bloqueos, ...privacy.advertencias])].map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              void guardarBorradorYSaliroAvanzar(paso ? paso - 1 : null);
            }}
          >
            {paso ? 'Atrás' : 'Guardar borrador y salir'}
          </Button>
          <Button
            type="submit"
            disabled={busy || privacy.bloqueos.length > 0 || privacy.advertencias.length > 0}
          >
            {busy ? 'Procesando…' : paso === 3 ? 'Guardar reporte' : 'Continuar'}
          </Button>
          {paso > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                void guardarBorradorYSaliroAvanzar(null);
              }}
            >
              Guardar borrador y salir
            </Button>
          )}
        </div>
        <p className="mt-4 text-sm text-secondary" role="status" aria-live="polite">
          {mensaje}
        </p>
      </form>
    </section>
  );
}
