# Lab Cuantitativo en Educación

Aplicación web didáctica (HTML/CSS/JS) para transformar conceptos de investigación cuantitativa en experiencias prácticas de **aprender haciendo**.

## Mejoras implementadas

1. **Operacionalización avanzada**
   - Matriz con columnas: Variable, Definición Conceptual, Dimensión, Indicador, Ítem.
   - Exportación CSV con **BOM UTF-8** para compatibilidad con Excel.
   - Exportación directa a **.xlsx** usando SheetJS.

2. **Juicio de expertos (CVR) con rigor académico**
   - Modal “Explicación y Nivel” (Pregrado / Maestría / Doctorado).
   - Umbral de decisión contextualizado por nivel y número de expertos.

3. **Diseños experimentales guiados**
   - Constructor por preguntas (pretest, control, aleatorización).
   - Clasificación automática: pre-experimental, cuasi-experimental o experimental puro.
   - Diccionario de rótulos (R, G, X, O1, O2, Gc).

4. **Navegador estadístico pedagógico**
   - Sugerencia de prueba + explicación de normalidad y tipo de muestras.
   - Mini-guía integrada de conceptos.

5. **Muestreo con narrativa de impacto**
   - Cálculo de n para población finita/infinita.
   - Mensajes de riesgo/precisión y alerta de posible insuficiencia para nivel doctoral.

## Ejecutar

Abre `index.html` directamente o usa:

```bash
python3 -m http.server 8000
```

Luego visita `http://localhost:8000`.
