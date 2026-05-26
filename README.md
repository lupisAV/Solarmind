# Solarmind Analytics

> Pipeline de minería de datos para análisis de radiación solar mediante árboles de decisión

![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![React](https://img.shields.io/badge/react-18.3-61DAFB)

Proyecto final de la asignatura de **Minería de Datos**. Sistema completo que abarca la generación de un dataset de radiación solar con errores, su limpieza automatizada, la aplicación de árboles de decisión (regresión y clasificación) y la visualización interactiva de resultados a través de un dashboard web.

---

## Arquitectura

```
solarmind/
├── data/
│   └── solar_radiation_dataset.csv       # 5,518 registros con errores inyectados
├── backend/
│   ├── generate_dataset.py               # Generación de dataset sintético con anomalías
│   ├── clean_and_model.py               # Pipeline de limpieza y modelado ML
│   ├── app.py                            # API REST (FastAPI)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                       # Orquestador de simulación
│   │   ├── index.css                     # Tema oscuro "Solar Pulse"
│   │   └── components/
│   │       ├── SolarPulse.jsx            # Animación de anillos solares
│   │       ├── StepIndicator.jsx         # Indicador de progreso
│   │       ├── RawDataPreview.jsx        # Vista de datos crudos con errores
│   │       ├── CleaningStats.jsx         # Estadísticas de limpieza
│   │       ├── MetricsDashboard.jsx       # Métricas + matriz de confusión
│   │       ├── FeatureImportance.jsx     # Gráficos de importancia de features
│   │       └── TreeVisualizer.jsx        # Árbol SVG interactivo
│   ├── vite.config.js
│   └── package.json
└── run.bat                               # Script de arranque completo
```

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Backend API** | FastAPI + Uvicorn | Servicio REST de alto rendimiento |
| **Procesamiento de datos** | Pandas 3.0 + NumPy | Limpieza, imputación y normalización |
| **Machine Learning** | Scikit-learn 1.8 | Árboles de decisión (regresión + clasificación) |
| **Frontend** | React 18 + Vite 6 | SPA con HMR en desarrollo |
| **Visualización** | Recharts + SVG | Gráficos de barras, matriz de confusión, árbol interactivo |
| **Tipografía** | Inter + JetBrains Mono | Sistema tipográfico profesional |

## Dataset

El dataset se genera sintéticamente simulando datos reales de radiación solar con las siguientes características:

### Features
| Variable | Descripción | Rango |
|---|---|---|
| `hora_numerica` | Hora del día (decimal) | 0 – 24 |
| `temperatura` | Temperatura ambiente | -5 – 45 °C |
| `humedad` | Humedad relativa | 5 – 100 % |
| `presion_atmosferica` | Presión barométrica | 990 – 1040 hPa |
| `velocidad_viento` | Velocidad del viento | 0 – 25 m/s |
| `nubosidad` | Cobertura de nubes (oktas) | 0 – 8 |
| `angulo_zenital` | Ángulo solar zenital | 0 – 90° |
| `precipitacion` | Precipitación acumulada | 0 – 50 mm |

### Target
| Variable | Descripción |
|---|---|
| `radiacion_solar` | Radiación solar global (W/m²) — regresión |
| `radiacion_categoria` | Baja / Media / Alta / Muy Alta — clasificación |

### Errores inyectados
- **Valores nulos (NaN)** — 186 celdas
- **Strings inválidos** ("ERR", "N/A", "---") — 175 celdas
- **Outliers** (9999, -999, etc.) — 660 celdas
- **Valores vacíos** — 35 celdas
- **Duplicados** — 18 filas

## Pipeline de Limpieza

1. **Conversión de tipos**: `pd.to_numeric(..., errors='coerce')` para detectar strings en columnas numéricas
2. **Imputación de nulos**: Sustitución por la mediana de cada columna
3. **Eliminación de duplicados**: `drop_duplicates()`
4. **Corrección de outliers**: Método IQR (rango intercuartílico) con factor 3.0
5. **Clip de valores**: Límites físicos reales por variable (ej. humedad 0-100%, nubosidad 0-8 oktas)
6. **Categorización**: Discretización de radiación en 4 clases para clasificación

## Modelos

### Árbol de Regresión (`DecisionTreeRegressor`)
| Hiperparámetro | Valor |
|---|---|
| `max_depth` | 6 |
| `min_samples_split` | 10 |
| `min_samples_leaf` | 5 |

| Métrica | Valor |
|---|---|
| R² Score | **0.7519** |
| MAE | **49.86** W/m² |
| RMSE | **64.31** W/m² |

### Árbol de Clasificación (`DecisionTreeClassifier`)
| Hiperparámetro | Valor |
|---|---|
| `max_depth` | 6 |
| `min_samples_split` | 10 |
| `min_samples_leaf` | 5 |

| Métrica | Valor |
|---|---|
| Accuracy | **91.82%** |
| Precision (macro) | **0.9107** |
| Recall (macro) | **0.9058** |
| F1 Score (macro) | **0.9078** |

## API Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/status` | Estado del servidor y features disponibles |
| `GET` | `/api/data/raw` | Dataset crudo paginado (errores visibles) |
| `GET` | `/api/data/cleaned` | Dataset limpio paginado |
| `GET` | `/api/data/stats` | Estadísticas de limpieza |
| `POST` | `/api/simulate/run` | Ejecuta pipeline completo y devuelve todos los resultados |
| `GET` | `/api/tree/regression` | Árbol de regresión en JSON |
| `GET` | `/api/tree/classification` | Árbol de clasificación en JSON |
| `GET` | `/api/metrics` | Métricas de ambos modelos |
| `GET` | `/api/features/importance` | Importancia de features para ambos modelos |

## Instalación y Ejecución

### Requisitos previos
- Python 3.10+
- Node.js 18+
- npm 9+

### Opción 1 — Script automático (Windows)
```bat
.\run.bat
```

### Opción 2 — Manual
```bash
# Backend
pip install -r backend/requirements.txt
python backend/generate_dataset.py

# Frontend
cd frontend
npm install
npm run build
cd ..

# Ejecutar
python backend/app.py
```

Abrir **http://localhost:8000** en el navegador.

### Desarrollo
```bash
# Terminal 1 — Backend (puerto 8000)
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend (puerto 3000, con proxy a backend)
cd frontend
npm run dev
```

Abrir **http://localhost:3000** para desarrollo con HMR.

## Interfaz

El dashboard sigue un diseño oscuro temático **"Solar Pulse"** con:

- **Fondo**: Navy espacial (`#0A0E1A`) con gradientes radiales solares
- **Acento principal**: Dorado solar (`#F59E0B`) para acciones y énfasis
- **Acento secundario**: Cian cielo (`#22D3EE`) para datos y métricas
- **Tipografía**: Inter (UI) + JetBrains Mono (datos/tablas)
- **Profundidad**: Sistema de bordes sutiles con elevación por color de superficie
- **Animación**: Anillos solares concéntricos que pulsan durante las transiciones

### Flujo de simulación
1. **Dataset crudo** → Tabla con errores resaltados (rojo: NaN/strings, ámbar: outliers)
2. **Limpieza** → Círculo SVG con porcentaje de datos conservados
3. **Métricas** → Cards de R², MAE, Accuracy + matriz de confusión
4. **Features** → Gráficos de barras horizontales con importancia
5. **Árboles** → SVG interactivo con nodos clickeables y ramas coloreadas
