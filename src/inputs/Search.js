import { isSelection, isSignal, MosaicClient } from '../mosaic/index.js';
import {
  Query, column as columnRef, regexp_matches, contains, prefix, suffix, literal
} from '../sql/index.js';

const FUNCTIONS = { contains, prefix, suffix, regexp: regexp_matches };
let _id = 0;

export class Search extends MosaicClient {
  constructor({
    filterBy,
    from,
    column,
    label,
    type,
    as
  } = {}) {
    super(filterBy);
    this.id = 'search_' + (++_id);
    this.type = type;
    this.from = from;
    this.column = column;
    this.selection = as;

    this.element = document.createElement('div');
    this.element.setAttribute('class', 'input');
    this.element.value = this;

    if (label) {
      const lab = document.createElement('label');
      lab.setAttribute('for', this.id);
      lab.innerText = label;
      this.element.appendChild(lab);
    }

    this.searchbox = document.createElement('input');
    this.searchbox.setAttribute('id', this.id);
    this.searchbox.setAttribute('type', 'text');
    this.searchbox.setAttribute('placeholder', 'Query');
    this.element.appendChild(this.searchbox);

    if (this.selection) {
      this.searchbox.addEventListener('input', () => {
        this.publish(this.searchbox.value || null);
      });
      if (!isSelection(this.selection)) {
        this.selection.addEventListener('value', value => {
          if (value !== this.searchbox.value) {
            this.searchbox.value = value;
          }
        });
      }
    }
  }

  publish(value) {
    const { selection, column, type } = this;
    if (isSelection(selection)) {
      selection.update({
        source: this,
        schema: { type },
        value,
        predicate: value ? FUNCTIONS[type](column, literal(value)) : null
      });
    } else if (isSignal(selection)) {
      selection.update(value);
    }
  }

  fields() {
    const { from, column } = this;
    return from ? [ columnRef(from, column) ] : null;
  }

  query(filter = []) {
    const { from, column } = this;
    if (!from) return null;
    return Query
      .from(from)
      .select({ list: column })
      .distinct()
      .where(filter);
  }

  queryResult(data) {
    this.data = data;
    return this;
  }

  update() {
    const list = document.createElement('datalist');
    const id = `${this.id}_list`;
    list.setAttribute('id', id);
    for (const d of this.data) {
      const opt = document.createElement('option');
      opt.setAttribute('value', d.list);
      list.append(opt);
    }
    if (this.datalist) this.datalist.remove();
    this.element.appendChild(this.datalist = list);
    this.searchbox.setAttribute('list', id);
    return this;
  }
}
