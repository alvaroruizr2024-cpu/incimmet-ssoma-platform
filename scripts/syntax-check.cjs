const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let count = 0,
  errors = 0;
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.verification'].includes(ent.name)) continue;
    const file = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(file);
      continue;
    }
    if (!/\.tsx?$/.test(file) || /\.d\.ts$/.test(file)) continue;
    count++;
    const text = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    function inspect(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const seen = new Set();
        for (const attr of node.attributes.properties) {
          if (!ts.isJsxAttribute(attr)) continue;
          const key = attr.name.getText(ast);
          if (seen.has(key)) {
            errors++;
            console.error(path.relative(root, file), `Atributo JSX duplicado: ${key}`);
          }
          seen.add(key);
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(ast);
    const result = ts.transpileModule(text, {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        isolatedModules: true,
      },
    });
    const diagnostics = (result.diagnostics ?? []).filter(
      (d) => d.category === ts.DiagnosticCategory.Error,
    );
    for (const d of diagnostics) {
      errors++;
      console.error(path.relative(root, file), ts.flattenDiagnosticMessageText(d.messageText, ' '));
    }
  }
}
walk(root);
console.log(
  `Revisión sintáctica TypeScript ${ts.version}: ${count} archivos TS/TSX; ${errors} errores de sintaxis.`,
);
console.log('No comprueba tipos de dependencias externas, enlaces ni renderizado React/Next.');
process.exitCode = errors ? 1 : 0;
