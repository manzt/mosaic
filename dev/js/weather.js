import * as vg from '../setup.js';

export default function(el) {
  const {
    plot, vconcat, from, dot, barX,
    count, dateMonthDay, intervalX, highlight, toggleY,
    xyDomain, xDomain, yDomain, colorDomain, colorRange, rDomain, rRange,
    xTickFormat, yLabel, colorLegend,
    width, Fixed, Selection
  } = vg;

  const table = 'weather';
  const range = Selection.intersect();
  const click = Selection.single();

  const weather = ['sun', 'fog', 'drizzle', 'rain', 'snow'];
  const colors = [
    colorDomain(weather),
    colorRange(['#e7ba52', '#a7a7a7', '#aec7e8', '#1f77b4', '#9467bd'])
  ];

  el.appendChild(
    vconcat(
      plot(
        dot(
          from(table, { filterBy: click }),
          { x: dateMonthDay('date'), y: 'temp_max', fill: 'weather', r: 'precipitation', opacity: 0.7 }
        ),
        intervalX({ as: range }),
        highlight({ by: range, fill: '#eee' }),
        xyDomain(Fixed), xTickFormat('%b'),
        rRange([2, 10]), rDomain(Fixed),
        width(800),
        colorLegend({ as: click, columns: 1 }),
        ...colors
      ),
      plot(
        barX(from(table), { x: count(), y: 'weather', fill: '#f5f5f5' }),
        barX(
          from(table, { filterBy: range }),
          { x: count(), y: 'weather', fill: 'weather', order: 'weather' }
        ),
        toggleY({ as: click }),
        highlight({ by: click }),
        xDomain(Fixed),
        yDomain(weather), yLabel(null),
        width(800),
        ...colors
      )
    )
  );
}