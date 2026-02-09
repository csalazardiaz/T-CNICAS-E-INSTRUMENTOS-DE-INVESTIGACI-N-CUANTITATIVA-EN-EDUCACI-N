const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
tabs.forEach(btn => btn.addEventListener('click', () => {
  tabs.forEach(t => t.classList.remove('active'));
  panels.forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active');
}));

// 1) Operacionalización
const dimensions = [];
const dimensionsList = document.getElementById('dimensionsList');
function renderDimensions() {
  dimensionsList.innerHTML = '';
  dimensions.forEach((d, i) => {
    const block = document.createElement('div');
    block.className = 'dim-block';
    block.innerHTML = `
      <strong>${d.name}</strong>
      <ul>${d.items.map(it => `<li>${it.indicator} → ${it.item}</li>`).join('')}</ul>
      <input id="ind-${i}" placeholder="Indicador observable" />
      <input id="item-${i}" placeholder="Ítem del cuestionario" />
      <button onclick="addIndicator(${i})">Añadir indicador + ítem</button>
    `;
    dimensionsList.appendChild(block);
  });
}
window.addIndicator = (i) => {
  const indicator = document.getElementById(`ind-${i}`).value.trim();
  const item = document.getElementById(`item-${i}`).value.trim();
  if (!indicator || !item) return;
  dimensions[i].items.push({ indicator, item });
  renderDimensions();
};

document.getElementById('addDimension').addEventListener('click', () => {
  const name = document.getElementById('dimName').value.trim();
  if (!name) return;
  dimensions.push({ name, items: [] });
  document.getElementById('dimName').value = '';
  renderDimensions();
});

document.getElementById('exportSpecs').addEventListener('click', () => {
  const variable = document.getElementById('varName').value.trim() || 'Variable sin nombre';
  const invalid = dimensions.filter(d => d.items.length === 0);
  const msg = invalid.length
    ? `⚠️ Faltan indicadores en: ${invalid.map(d => d.name).join(', ')}`
    : '✅ Tabla válida: todas las dimensiones tienen indicadores.';
  document.getElementById('specValidation').textContent = msg;

  const rows = [['Variable', 'Dimensión', 'Indicador', 'Ítem']];
  dimensions.forEach(d => d.items.forEach(it => rows.push([variable, d.name, it.indicator, it.item])));
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tabla_especificaciones_${Date.now()}.csv`;
  a.click();
});

// 2) CVR
const cvrCritical = { 5: 0.99, 6: 0.99, 7: 0.99, 8: 0.75, 9: 0.78, 10: 0.62, 11: 0.59, 12: 0.56, 13: 0.54, 14: 0.51, 15: 0.49 };
function cvr(ne, N) { return (ne - N / 2) / (N / 2); }

document.getElementById('buildCvrTable').addEventListener('click', () => {
  const N = Number(document.getElementById('numExperts').value);
  const items = Number(document.getElementById('numItems').value);
  const wrap = document.getElementById('cvrTableWrap');
  wrap.innerHTML = '';
  const table = document.createElement('table');
  table.innerHTML = '<tr><th>Ítem</th><th>Esencial (ne)</th><th>CVR</th><th>Decisión</th></tr>';

  let keep = 0;
  const crit = cvrCritical[N] ?? 0.49;
  for (let i = 1; i <= items; i++) {
    const ne = Math.floor(Math.random() * (N + 1));
    const value = cvr(ne, N);
    const decision = value >= crit ? 'Conservar' : 'Eliminar';
    if (decision === 'Conservar') keep++;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}</td><td>${ne}/${N}</td><td>${value.toFixed(2)}</td><td>${decision}</td>`;
    table.appendChild(tr);
  }
  wrap.appendChild(table);
  document.getElementById('cvrSummary').textContent = `Punto crítico (Ayre & Scally aprox.) para N=${N}: ${crit}. Conservar: ${keep}/${items}.`;
});

// 3) Diseños
const palette = ['G', 'R', 'O1', 'X', 'O2', 'Gc', 'O'];
const designPalette = document.getElementById('designPalette');
const designSequence = document.getElementById('designSequence');
palette.forEach(t => {
  const el = document.createElement('span');
  el.className = 'chip'; el.textContent = t;
  el.onclick = () => {
    const token = document.createElement('span');
    token.className = 'token';
    token.textContent = t;
    token.onclick = () => token.remove();
    designSequence.appendChild(token);
  };
  designPalette.appendChild(el);
});
document.getElementById('clearDesign').onclick = () => designSequence.innerHTML = '';
document.getElementById('evaluateDesign').onclick = () => {
  const seq = [...designSequence.querySelectorAll('.token')].map(t => t.textContent).join(' ');
  let out = 'Diseño no reconocido. Revisa notación G, O, X.';
  if (seq === 'G O1 X O2') out = 'Pre-experimental: amenazas de historia y maduración.';
  if (seq.includes('R') && seq.includes('Gc') && seq.includes('X') && seq.includes('O2')) out = 'Experimental puro detectado: buen control de validez interna.';
  document.getElementById('designResult').textContent = out + `\nSecuencia: ${seq}`;
};

// 4) Árbol estadístico
const matrix = {
  comparar: {
    si: { '2ind': 't de Student independiente', '2rel': 't pareada', 'mind': 'ANOVA de un factor', 'mrel': 'ANOVA de medidas repetidas' },
    no: { '2ind': 'U de Mann-Whitney', '2rel': 'Wilcoxon', 'mind': 'Kruskal-Wallis', 'mrel': 'Friedman' }
  },
  asociar: {
    si: { '2ind': 'Correlación de Pearson', '2rel': 'Correlación de Pearson', 'mind': 'Regresión lineal múltiple', 'mrel': 'Modelo mixto/repetidas' },
    no: { '2ind': 'Spearman', '2rel': 'Spearman', 'mind': 'Kendall / modelos robustos', 'mrel': 'Spearman por momento + tendencia' }
  }
};

document.getElementById('suggestTest').onclick = () => {
  const goal = document.getElementById('goal').value;
  const normality = document.getElementById('normality').value;
  const designType = document.getElementById('designType').value;
  const test = matrix[goal][normality][designType];
  document.getElementById('testSuggestion').textContent = `Sugerencia: ${test}.\nMotivo: combinación de objetivo, normalidad y diseño muestral.`;
};

// 5) Muestreo
const e = document.getElementById('e');
const p = document.getElementById('p');
e.oninput = () => document.getElementById('eVal').textContent = Number(e.value).toFixed(3);
p.oninput = () => document.getElementById('pVal').textContent = Number(p.value).toFixed(2);

document.getElementById('calcSample').onclick = () => {
  const N = Number(document.getElementById('N').value);
  const Z = Number(document.getElementById('Z').value);
  const err = Number(e.value);
  const prob = Number(p.value);
  const q = 1 - prob;
  const n0 = (Z * Z * prob * q) / (err * err);
  const n = N ? (N * n0) / (N - 1 + n0) : n0;
  const finalN = Math.ceil(n);
  document.getElementById('sampleResult').textContent = `n requerido ≈ ${finalN} (n0=${n0.toFixed(2)}). Menor error => mayor muestra.`;
  const width = Math.min(100, finalN / 20);
  document.getElementById('sampleBar').style.width = `${width}%`;
};

// 6) Hipótesis
const templates = {
  Correlacional: (vi, vd) => `Hi: Existe relación significativa entre ${vi} y ${vd}.\nH0: No existe relación significativa entre ${vi} y ${vd}.`,
  Comparativo: (vi, vd) => `Hi: Existen diferencias en ${vd} según ${vi}.\nH0: No existen diferencias en ${vd} según ${vi}.`,
  Explicativo: (vi, vd) => `Hi: ${vi} influye significativamente en ${vd}.\nH0: ${vi} no influye significativamente en ${vd}.`,
  Descriptivo: (vi, vd) => `Hi: ${vd} presenta niveles definidos en la población estudiada.\nH0: ${vd} no presenta niveles definidos en la población estudiada.`
};

document.getElementById('generateHyp').onclick = () => {
  const scope = document.getElementById('scope').value;
  const vi = document.getElementById('vi').value.trim() || 'VI';
  const vd = document.getElementById('vd').value.trim() || 'VD';
  document.getElementById('hypOutput').textContent =
    `${templates[scope](vi, vd)}\n\nIdentificación:\n- Variable Independiente (VI): ${vi}\n- Variable Dependiente (VD): ${vd}`;
};
