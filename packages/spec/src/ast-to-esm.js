import { error, isArray, isObject, isString, toParamRef } from './util.js';

export function astToESM(ast, options) {
  const { root, data, params, plotDefaults } = ast;
  const ctx = new CodegenContext({ plotDefaults, ...options });

  // generate data definitions
  const dataCode = [];
  for (const node of Object.values(data)) {
    const def = node.codegen(ctx);
    if (def) dataCode.push(def);
  }

  // generate default attributes
  let defaultCode = [];
  const defaultList = plotDefaults;
  if (defaultList.length) {
    defaultCode = [
      'const defaultAttributes = [',
      defaultList.map(a => '  ' + a.codegen(ctx)).join(',\n'),
      '];'
    ];
  }

  // generate specification tree
  const specCode = [
    `export default ${root.codegen(ctx)};`
  ];

  // generate params / selections
  const paramCode = [];
  for (const [key, value] of Object.entries(params)) {
    paramCode.push(`const ${toParamRef(key)} = ${value.codegen(ctx)};`);
  }

  // generate package imports
  const importsCode = [];
  for (const [pkg, methods] of ctx.imports) {
    importsCode.push(
      isString(methods)
        ? `import ${methods} from "${pkg}";`
        : `import { ${methods.join(', ')} } from "${pkg}";`
    );
  }

  return [
    ...importsCode,
    ...maybeNewline(importsCode),
    ...dataCode,
    ...maybeNewline(dataCode),
    ...paramCode,
    ...maybeNewline(paramCode),
    ...defaultCode,
    ...maybeNewline(defaultCode),
    ...specCode
  ].join('\n');
}

export class CodegenContext {
  constructor({
    plotDefaults = null,
    namespace = 'vg.',
    imports = new Map([['@uwdata/vgplot', '* as vg']]),
    baseURL = null,
    baseClientURL = baseURL,
    depth = 0
  } = {}) {
    this.plotDefaults = plotDefaults;
    this.namespace = namespace;
    this.imports = imports;
    this.baseURL = baseURL;
    this.baseClientURL = baseClientURL;
    this.depth = depth;
  }

  addImport(pkg, method) {
    if (!this.imports.has(pkg)) {
      this.imports.set(pkg, []);
    }
    this.imports.get(pkg).push(method);
  }

  setImports(pkg, all) {
    this.imports.set(pkg, all);
  }

  ns() {
    return this.namespace;
  }

  indent() {
    this.depth += 1;
  }

  undent() {
    this.depth -= 1;
  }

  tab() {
    return Array.from({ length: this.depth }, () => '  ').join('');
  }

  stringify(value) {
    if (isArray(value)) {
      const items = value.map(v => this.stringify(v));
      return `[${this.maybeLineWrap(items)}]`;
    } else if (isObject(value)) {
      const props = Object.entries(value)
        .map(([k, v]) => `${maybeQuote(k)}: ${this.stringify(v)}`);
      return `{${this.maybeLineWrap(props)}}`;
    } else {
      return JSON.stringify(value);
    }
  }

  maybeLineWrap(spans) {
    const limit = 80 - 2 * this.depth;
    const chars = 2 * spans.length + spans.reduce((a, b) => a + b.length, 0);
    if (chars > limit) {
      this.indent();
      const str = spans.map(s => `\n${this.tab()}${s}`).join(',')
      this.undent();
      return str + '\n' + this.tab();
    } else {
      return spans.join(', ');
    }
  }

  error(message, data) {
    error(message, data);
  }
}

function maybeQuote(str) {
  return /^[A-Za-z_$]\w*/.test(str) ? str : JSON.stringify(str);
}

function maybeNewline(entry) {
  return entry?.length ? [''] : [];
}