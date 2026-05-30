# Solarmind Analytics

> Pipeline de minería de datos para análisis de radiación solar mediante árboles de decisión.

![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![React](https://img.shields.io/badge/react-18.3-61DAFB)

Proyecto final de la asignatura de **Minería de Datos**. El sistema genera o recibe un dataset CSV de radiación solar, limpia errores comunes, entrena modelos de regresión y clasificación con árboles de decisión, y presenta los resultados en un dashboard web.

---

## Arquitectura

```text
solarmind/
├── data/
│   └── solar_radiation_dataset.csv
├── backend/
│   ├── generate_dataset.py
│   ├── clean_and_model.py
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── components/
│   ├── vite.config.js
│   └── package.json
└── run.bat
```

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| Backend API | FastAPI + Uvicorn | Servicio REST |
| Procesamiento | Pandas + NumPy | Limpieza, imputación y normalización |
| Machine Learning | Scikit-learn | Árboles de decisión |
| Frontend | React + Vite | Dashboard SPA |
| Visualización | Recharts + SVG | Gráficas, matriz de confusión y árboles |

## Dataset

El dataset simula datos horarios de radiación solar con errores inyectados para demostrar el proceso de limpieza.

### Variables

| Variable | Descripción |
|---|---|
| `hora_numerica` | Hora del día en formato decimal |
| `temperatura` | Temperatura ambiente |
| `humedad` | Humedad relativa |
| `presion_atmosferica` | Presión barométrica |
| `velocidad_viento` | Velocidad del viento |
| `nubosidad` | Cobertura de nubes |
| `angulo_zenital` | Ángulo solar zenital |
| `precipitacion` | Precipitación acumulada |
| `radiacion_solar` | Target de regresión en W/m² |
| `radiacion_categoria` | Target de clasificación: Baja, Media, Alta, Muy Alta |

## Pipeline de Limpieza

1. Conversión de columnas numéricas con `pd.to_numeric(..., errors='coerce')`.
2. Imputación de nulos con la mediana.
3. Eliminación de duplicados.
4. Corrección de outliers con IQR.
5. Clip de valores a rangos físicos.
6. Categorización de radiación solar en 4 clases.

## Resultados Actuales

Resultados obtenidos con `python backend\clean_and_model.py` después de regenerar el dataset.

### Limpieza

| Métrica | Valor |
|---|---:|
| Registros originales | 5,518 |
| Registros limpios | 5,500 |
| Nulos/errores imputados | 396 |
| Duplicados eliminados | 18 |
| Outliers corregidos | 518 |

### Árbol de Regresión

| Métrica | Valor |
|---|---:|
| R² Score | 0.9054 |
| MAE | 42.70 W/m² |
| RMSE | 82.69 W/m² |
| MSE | 6,837.96 |

### Árbol de Clasificación

| Métrica | Valor |
|---|---:|
| Accuracy | 87.36% |
| Precision macro | 0.7637 |
| Recall macro | 0.7778 |
| F1 macro | 0.7704 |

### Distribución de Clases

| Clase | Registros |
|---|---:|
| Baja | 3,573 |
| Media | 929 |
| Alta | 653 |
| Muy Alta | 345 |

## API Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/status` | Estado del servidor y columnas disponibles |
| `POST` | `/api/dataset/upload` | Carga un CSV validado |
| `GET` | `/api/dataset/generate` | Genera y descarga un dataset de ejemplo |
| `GET` | `/api/dataset/info` | Información del dataset activo |
| `GET` | `/api/data/raw` | Dataset crudo paginado |
| `GET` | `/api/data/cleaned` | Dataset limpio paginado |
| `GET` | `/api/data/stats` | Estadísticas de limpieza |
| `POST` | `/api/simulate/run` | Ejecuta el pipeline completo |
| `GET` | `/api/tree/regression` | Árbol de regresión en JSON |
| `GET` | `/api/tree/classification` | Árbol de clasificación en JSON |
| `GET` | `/api/metrics` | Métricas de ambos modelos |
| `GET` | `/api/features/importance` | Importancia de variables |

## Instalación y Ejecución

### Requisitos

- Python 3.10+
- Node.js 18+
- npm 9+

### Windows

```bat
.\run.bat
```

### Manual

```bash
pip install -r backend/requirements.txt
python backend/generate_dataset.py

cd frontend
npm install
npm run build
cd ..

python backend/app.py
```

Abrir `http://localhost:8000`.

### Desarrollo

```bash
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend
npm run dev
```

Abrir `http://localhost:3000`.

## Mejoras Incluidas

- Validación de columnas requeridas al subir CSV.
- Límite de 10 MB para uploads.
- Sanitización de nombres de archivo subidos.
- Paginación protegida con límites.
- CORS configurable con `CORS_ORIGINS`.
- Dataset regenerado con presencia real de las 4 clases.
- Lazy loading en vistas pesadas del frontend.
- Manejo de errores HTTP más claro en la interfaz.
- `.gitignore` para dependencias, builds y archivos generados.
