const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

let currentLevel = 'Pregrado';
const levelHint = document.getElementById('globalLevelHint');
const globalLevel = document.getElementById('globalLevel');

const levelRules = {
  Pregrado: { experts: '3 a 5', cvrText: 'CVR base sugerido > 0.50 para práctica inicial.' },
  Maestría: { experts: '6 a 12', cvrText: 'Se recomienda mayor concordancia y justificación teórica.' },
  Doctorado: { experts: '12 a 15+', cvrText: 'Rigor alto: usar umbrales estrictos (p.ej., 0.58 con 15 jueces).' }
};

function renderLevelHint() {
  const r = levelRules[currentLevel];
  levelHint.textContent = `Nivel ${currentLevel}: expertos sugeridos ${r.experts}. ${r.cvrText}`;
}

globalLevel.addEventListener('change', () => {
  currentLevel = globalLevel.value;
  document.getElementById('cvrLevel').value = currentLevel;
  renderLevelHint();
});
renderLevelHint();

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

function buildSpecRows() {
  const variable = document.getElementById('varName').value.trim() || 'Variable sin nombre';
  const concept = document.getElementById('varConcept').value.trim() || 'Sin definición conceptual';
  const invalid = dimensions.filter(d => d.items.length === 0);
  const msg = invalid.length
    ? `⚠️ Faltan indicadores en: ${invalid.map(d => d.name).join(', ')}`
    : '✅ Matriz válida: todas las dimensiones tienen indicadores.';
  document.getElementById('specValidation').textContent = msg;

  const rows = [['Variable', 'Definición Conceptual', 'Dimensión', 'Indicador', 'Ítem']];
  dimensions.forEach(d => {
    if (d.items.length === 0) rows.push([variable, concept, d.name, '', '']);
    d.items.forEach(it => rows.push([variable, concept, d.name, it.indicator, it.item]));
  });
  return rows;
}

document.getElementById('exportCsv').addEventListener('click', () => {
  const rows = buildSpecRows();
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `matriz_consistencia_${Date.now()}.csv`;
  a.click();
});

document.getElementById('exportXlsx').addEventListener('click', () => {
  const rows = buildSpecRows();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 34 }, { wch: 18 }, { wch: 30 }, { wch: 45 }];
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) ws[addr].s = { font: { bold: true } };
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matriz');
  XLSX.writeFile(wb, `matriz_consistencia_${Date.now()}.xlsx`);
});

// 2) CVR
const cvrCritical = { 3: 0.99, 4: 0.99, 5: 0.99, 6: 0.99, 7: 0.99, 8: 0.75, 9: 0.78, 10: 0.62, 11: 0.59, 12: 0.56, 13: 0.54, 14: 0.51, 15: 0.49 };
const strictFloor = { Pregrado: 0.5, Maestría: 0.58, Doctorado: 0.58 };

function cvr(ne, N) { return (ne - N / 2) / (N / 2); }

const modal = document.getElementById('modal');
const cvrLevel = document.getElementById('cvrLevel');
const cvrLevelText = document.getElementById('cvrLevelText');

function renderCvrLevelText() {
  const lvl = cvrLevel.value;
  currentLevel = lvl;
  globalLevel.value = lvl;
  renderLevelHint();
  if (lvl === 'Pregrado') cvrLevelText.textContent = 'Pregrado: mínimo recomendado 3-5 expertos. CVR didáctico sugerido > 0.50.';
  if (lvl === 'Maestría') cvrLevelText.textContent = 'Maestría: reforzar argumento de validez de contenido y umbral estricto (≈0.58 con 15 jueces).';
  if (lvl === 'Doctorado') cvrLevelText.textContent = 'Doctorado: mayor exigencia metodológica, concordancia alta y justificación teórica robusta.';
}

document.getElementById('showCvrGuide').onclick = () => {
  modal.classList.remove('hidden');
  cvrLevel.value = currentLevel;
  renderCvrLevelText();
};
document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');
cvrLevel.onchange = renderCvrLevelText;

document.getElementById('buildCvrTable').addEventListener('click', () => {
  const N = Number(document.getElementById('numExperts').value);
  const items = Number(document.getElementById('numItems').value);
  const wrap = document.getElementById('cvrTableWrap');
  wrap.innerHTML = '';
  const table = document.createElement('table');
  table.innerHTML = '<tr><th>Ítem</th><th>Esencial (ne)</th><th>CVR</th><th>Decisión</th></tr>';

  let keep = 0;
  const baseCrit = cvrCritical[N] ?? 0.49;
  const crit = Math.max(baseCrit, strictFloor[currentLevel]);

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
  document.getElementById('cvrSummary').textContent = `Nivel ${currentLevel}. Punto crítico aplicado: ${crit.toFixed(2)} (base=${baseCrit.toFixed(2)}). Ítems conservados: ${keep}/${items}.`;
});

// 3) Diseños experimentales
const legend = {
  R: 'Asignación aleatoria (Randomization)',
  G: 'Grupo de sujetos',
  X: 'Tratamiento o estímulo experimental',
  O1: 'Observación inicial (Pre-test)',
  O2: 'Observación final (Post-test)',
  Gc: 'Grupo control'
};
document.getElementById('designLegend').innerHTML = Object.entries(legend).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('');
document.getElementById('toggleLegend').onclick = () => document.getElementById('designLegend').classList.toggle('hidden');

document.getElementById('buildDesign').onclick = () => {
  const pre = document.getElementById('qPretest').value;
  const control = document.getElementById('qControl').value;
  const rand = document.getElementById('qRandom').value;
  let diagram = '';
  let type = '';
  let warning = '';

  if (control === 'no' && pre === 'no') {
    diagram = 'G X O2';
    type = 'Pre-experimental (estudio de caso con una sola medición).';
    warning = '⚠️ Riesgo alto de amenazas a la validez interna.';
  } else if (control === 'no' && pre === 'si') {
    diagram = 'G O1 X O2';
    type = 'Pre-experimental (pretest-postest con un grupo).';
    warning = '⚠️ Cuidado con historia y maduración.';
  } else if (control === 'si' && rand === 'no') {
    diagram = pre === 'si' ? 'G O1 X O2 || Gc O1 - O2' : 'G X O2 || Gc - O2';
    type = 'Cuasi-experimental (grupos intactos sin aleatorización).';
    warning = '⚠️ Equivalencia inicial no garantizada.';
  } else {
    diagram = pre === 'si' ? 'R G O1 X O2 || R Gc O1 - O2' : 'R G X O2 || R Gc - O2';
    type = 'Experimental puro (control y aleatorización).';
    warning = '✅ Alta validez interna respecto a diseños no aleatorizados.';
  }

  document.getElementById('designDiagram').textContent = diagram;
  document.getElementById('designResult').textContent = `${type}\n${warning}`;
};

// 4) Navegador estadístico
const matrix = {
  comparar: {
    si: { '2ind': 't de Student independiente', '2rel': 't pareada', 'mind': 'ANOVA de un factor', 'mrel': 'ANOVA de medidas repetidas' },
    no: { '2ind': 'U de Mann-Whitney', '2rel': 'Wilcoxon', 'mind': 'Kruskal-Wallis', 'mrel': 'Friedman' }
  },
  asociar: {
    si: { '2ind': 'Correlación de Pearson', '2rel': 'Correlación de Pearson', 'mind': 'Regresión lineal múltiple', 'mrel': 'Modelo mixto/repetidas' },
    no: { '2ind': 'Spearman', '2rel': 'Spearman', 'mind': 'Kendall', 'mrel': 'Spearman por momento + tendencia' }
  }
};

document.getElementById('suggestTest').onclick = () => {
  const goal = document.getElementById('goal').value;
  const normality = document.getElementById('normality').value;
  const designType = document.getElementById('designType').value;
  const test = matrix[goal][normality][designType];
  const rationale = normality === 'si'
    ? 'Tus datos cumplen normalidad, puedes usar pruebas paramétricas más potentes.'
    : 'Sin normalidad, se recomienda un enfoque conservador no paramétrico.';
  document.getElementById('testSuggestion').textContent = `Sugerencia: ${test}.\nMotivo: ${rationale}`;
};

// 5) Muestreo + narrativa
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

  document.getElementById('sampleResult').textContent = `n requerido ≈ ${finalN} (n0=${n0.toFixed(2)}).`;
  const msg = err >= 0.1
    ? 'Al usar error de 10%, la muestra baja pero aumenta el riesgo de conclusiones inestables.'
    : err <= 0.03
      ? 'Reducir el error exige más muestra: más costo, pero mayor precisión inferencial.'
      : 'Existe un balance entre costo de campo y precisión estadística.';

  const doctoralAlert = currentLevel === 'Doctorado' && finalN < 120
    ? '\n⚠️ Muestra posiblemente insuficiente para rigor doctoral en estudios complejos.'
    : '';

  const narrative = document.getElementById('sampleNarrative');
  narrative.textContent = msg + doctoralAlert;
  narrative.className = doctoralAlert ? 'hint alert-danger' : 'hint';

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
