import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Privacidad y tratamiento de datos' };
import { Card, CardTitle } from '@/components/ui/card';
export default function Privacidad() {
  return (
    <article className="max-w-4xl space-y-6">
      <h1>Privacidad y tratamiento de datos</h1>
      <p className="text-sm leading-relaxed text-secondary">
        Aviso de demostración. Referencia normativa solicitada en el brief: Ley N.º 29733, Ley de
        Protección de Datos Personales del Perú. Este texto no constituye una declaración de
        cumplimiento ni sustituye la revisión jurídica para producción.
      </p>
      <Card>
        <CardTitle>Finalidad y límites</CardTitle>
        <p className="mt-3 text-sm leading-relaxed">
          La demo permite explorar registros documentales y probar la trazabilidad de reportes y
          evidencias. El JSON incluido se sirve públicamente. El selector de rol no acredita
          identidad ni controla el acceso real a ese archivo. No cargue información confidencial.
        </p>
      </Card>
      <Card>
        <CardTitle>Datos que no deben registrarse</CardTitle>
        <p className="mt-3 text-sm leading-relaxed">
          No incluya nombres, DNI, diagnósticos, datos psicológicos, historias clínicas ni
          resultados médicos. La persona afectada se representa solo mediante rol y zona corporal
          general. Revise también textos libres, nombres de archivos, rostros, credenciales y
          metadatos de fotografías.
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          La revisión declarada por el usuario no garantiza anonimización. El formulario bloquea
          patrones de DNI y advierte posibles nombres o diagnósticos; las detecciones deben
          corregirse antes del guardado. La compresión de fotos elimina EXIF, pero no elimina
          rostros ni textos visibles. Las heurísticas pueden omitir información sensible o producir
          falsos positivos.
        </p>
      </Card>
      <Card>
        <CardTitle>Almacenamiento y transmisión</CardTitle>
        <p className="mt-3 text-sm leading-relaxed">
          Los nuevos reportes y adjuntos se almacenan en IndexedDB, en este navegador y dispositivo.
          No se envían a Supabase ni a otro servidor en modo static. El alojamiento web puede
          mantener sus propios registros técnicos de acceso a la página.
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          Los archivos locales no tienen cifrado aplicativo ni plazo de retención automático. Pueden
          perderse si se borran los datos del sitio o el navegador libera almacenamiento. La pérdida
          de conexión no transforma un guardado local en una notificación de emergencia.
        </p>
      </Card>
      <Card>
        <CardTitle>Borrado local y atención de solicitudes</CardTitle>
        <p className="mt-3 text-sm leading-relaxed">
          Puede borrar los datos de este sitio desde la configuración de su navegador. Se perderán
          reportes, adjuntos e historial no enviados. La capa de datos también ofrece un
          restablecimiento local con confirmación explícita. En Campo puede eliminar borradores
          individuales.
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          Responsable, canal de atención, base jurídica, retención y transferencias para una
          operación real: no configurados en esta demo. Deben aprobarse antes de usar datos reales o
          publicar una versión operativa.
        </p>
      </Card>
      <Card>
        <CardTitle>Servicios del navegador y recursos de la PWA</CardTitle>
        <p className="mt-3 text-sm leading-relaxed">
          La instalación inicial del service worker descarga Workbox 7.3.0 desde el CDN oficial de
          Google. No se envían reportes a ese CDN. El navegador puede transmitir audio a su
          proveedor de reconocimiento al usar dictado; úselo solamente sin información personal y
          con conocimiento de esa limitación. Siempre está disponible el teclado.
        </p>
      </Card>
      <Card>
        <CardTitle>Backend futuro</CardTitle>
        <p className="mt-3 text-sm leading-relaxed">
          El esquema propuesto separa la identidad restringida de las tablas analíticas.
          Autenticación, RLS, almacenamiento privado, cifrado y auditoría de accesos requieren
          configuración y pruebas de producción. No están activados por el selector de rol de esta
          demo.
        </p>
      </Card>
    </article>
  );
}
