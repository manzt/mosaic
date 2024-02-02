import { createAPIContext } from '@uwdata/vgplot';
import { error, isArray } from './util.js';

export async function astToDOM(ast, options) {
  const { data, params, plotDefaults } = ast;
  const ctx = new InstatiateContext({ plotDefaults, ...options });

  // process data definitions, loading data as needed
  // perform sequentially, as later datasets may be derived
  for (const [name, node] of Object.entries(data)) {
    const dataset = await node.instantiate(ctx);
    if (isArray(dataset)) {
      // client-side dataset, not managed by DuckDB
      ctx.activeData.set(name, dataset);
    }
  }

  // process param/selection definitions
  for (const [name, node] of Object.entries(params)) {
    const param = node.instantiate(ctx);
    ctx.activeParams.set(name, param);
  }

  return {
    element: ast.root.instantiate(ctx),
    data: ctx.activeData,
    params: ctx.activeParams
  };
}

export class InstatiateContext {
  constructor({
    api = createAPIContext(),
    plotDefaults = [],
    activeData = new Map,
    activeParams = new Map,
    baseURL = null,
    baseClientURL = baseURL,
    fetch = (...args) => window.fetch(...args)
  } = {}) {
    this.api = api;
    this.plotDefaults = plotDefaults;
    this.activeData = activeData;
    this.activeParams = activeParams;
    this.baseURL = baseURL;
    this.baseClientURL = baseClientURL;
    this.fetch = fetch;
    this.coordinator = api.context.coordinator;
  }

  error(message, data) {
    error(message, data);
  }
}