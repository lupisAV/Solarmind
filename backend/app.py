from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
import pandas as pd
import numpy as np
import json
import os
import io
import re
from uuid import uuid4

from clean_and_model import (
    FEATURE_COLS, TARGET_COL, RADIATION_LABELS,
    load_dataset, clean_dataset,
    train_regression, train_classification,
    tree_to_json
)

app = FastAPI(title="Solarmind Analytics API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8000").split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_DATASET_PATH = os.path.join("data", "solar_radiation_dataset.csv")
UPLOAD_DIR = os.path.join("data", "uploads")
DATASET_PATH = DEFAULT_DATASET_PATH
dataset_filename = None
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

os.makedirs(UPLOAD_DIR, exist_ok=True)

result_cache = None


def validate_dataset_columns(df):
    required_cols = FEATURE_COLS + [TARGET_COL]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"El CSV no contiene las columnas requeridas: {', '.join(missing_cols)}",
        )


def safe_upload_name(filename):
    base = os.path.basename(filename or "dataset.csv")
    stem, ext = os.path.splitext(base)
    clean_stem = re.sub(r"[^A-Za-z0-9_.-]+", "_", stem).strip("._") or "dataset"
    return f"uploaded_{clean_stem}_{uuid4().hex[:8]}{ext.lower()}"


def set_active_dataset(path, filename=None):
    global DATASET_PATH, dataset_filename, result_cache
    DATASET_PATH = path
    dataset_filename = filename
    result_cache = None


def json_safe_records(df):
    safe_df = df.replace({np.nan: None})
    return safe_df.to_dict(orient="records")


def get_pipeline_results():
    global result_cache
    if result_cache is None:
        from clean_and_model import run_full_pipeline
        result_cache = run_full_pipeline(DATASET_PATH)
    return result_cache


@app.get("/api/status")
def status():
    ds_exists = os.path.exists(DATASET_PATH)
    info = {
        "status": "online",
        "dataset_exists": ds_exists,
        "dataset_loaded": ds_exists,
        "dataset_filename": dataset_filename or (os.path.basename(DATASET_PATH) if ds_exists else None),
        "feature_cols": FEATURE_COLS,
        "target_col": TARGET_COL,
        "radiation_labels": RADIATION_LABELS,
    }
    if ds_exists:
        try:
            df = pd.read_csv(DATASET_PATH, nrows=1)
            info["dataset_columns"] = list(df.columns)
        except Exception:
            info["dataset_columns"] = []
    return info


@app.post("/api/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos CSV (.csv)")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="El archivo excede el limite de 10 MB")

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="No se pudo leer el archivo CSV. Verifica el formato.") from exc

    validate_dataset_columns(df)

    safe_name = safe_upload_name(file.filename)
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    set_active_dataset(file_path, file.filename)

    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "size_bytes": len(contents),
    }


@app.post("/api/dataset/example")
def use_example_dataset():
    if not os.path.exists(DEFAULT_DATASET_PATH):
        raise HTTPException(status_code=404, detail="No existe el dataset de ejemplo")

    df = pd.read_csv(DEFAULT_DATASET_PATH)
    validate_dataset_columns(df)
    set_active_dataset(DEFAULT_DATASET_PATH, "solar_radiation_dataset.csv")

    return {
        "filename": "solar_radiation_dataset.csv",
        "rows": len(df),
        "columns": list(df.columns),
        "size_bytes": os.path.getsize(DEFAULT_DATASET_PATH),
        "generated": True,
    }


@app.get("/api/dataset/generate")
def generate_dataset():
    import generate_dataset as gendata
    df = gendata.generate_dataframe()

    output_path = os.path.join(UPLOAD_DIR, "generated_dataset.csv")
    df.to_csv(output_path, index=False)

    set_active_dataset(output_path, "generated_dataset.csv")

    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=solar_radiation_dataset.csv",
            "X-Dataset-Rows": str(len(df)),
            "X-Dataset-Columns": ",".join(df.columns),
        },
    )


@app.get("/api/dataset/info")
def dataset_info():
    if not os.path.exists(DATASET_PATH):
        return {
            "loaded": False,
            "filename": None,
            "rows": 0,
            "columns": [],
            "size_bytes": 0,
        }

    df = pd.read_csv(DATASET_PATH)
    size_bytes = os.path.getsize(DATASET_PATH)

    return {
        "loaded": True,
        "filename": dataset_filename or os.path.basename(DATASET_PATH),
        "rows": len(df),
        "columns": list(df.columns),
        "size_bytes": size_bytes,
    }


@app.get("/api/data/raw")
def raw_data(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    df = load_dataset(DATASET_PATH)
    validate_dataset_columns(df)
    total = len(df)
    start = (page - 1) * per_page
    end = start + per_page
    data = json_safe_records(df.iloc[start:end])

    nulls_per_col = df[FEATURE_COLS + [TARGET_COL]].isnull().sum().to_dict()
    string_errors = 0
    for col in FEATURE_COLS + [TARGET_COL]:
        try:
            pd.to_numeric(df[col], errors="coerce")
        except Exception:
            pass

    return {
        "data": data,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "columns": list(df.columns),
        "nulls_per_column": {k: int(v) for k, v in nulls_per_col.items()},
    }


@app.get("/api/data/cleaned")
def cleaned_data(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    df = load_dataset(DATASET_PATH)
    validate_dataset_columns(df)
    df_clean, stats = clean_dataset(df)
    total = len(df_clean)
    start = (page - 1) * per_page
    end = start + per_page
    data = json_safe_records(df_clean.iloc[start:end])

    return {
        "data": data,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
        "columns": list(df_clean.columns),
        "cleaning_stats": stats,
    }


@app.get("/api/data/stats")
def data_stats():
    df = load_dataset(DATASET_PATH)
    validate_dataset_columns(df)
    _, stats = clean_dataset(df)
    return stats


@app.post("/api/simulate/run")
def run_simulation():
    results = get_pipeline_results()
    return results


@app.get("/api/tree/regression")
def regression_tree():
    results = get_pipeline_results()
    return {
        "tree_json": results["regression"]["tree_json"],
        "tree_text": results["regression"]["tree_text"],
        "feature_names": FEATURE_COLS,
    }


@app.get("/api/tree/classification")
def classification_tree():
    results = get_pipeline_results()
    return {
        "tree_json": results["classification"]["tree_json"],
        "tree_text": results["classification"]["tree_text"],
        "feature_names": FEATURE_COLS,
        "class_names": RADIATION_LABELS,
    }


@app.get("/api/metrics")
def metrics():
    results = get_pipeline_results()
    return {
        "regression": results["regression"]["metrics"],
        "classification": results["classification"]["metrics"],
    }


@app.get("/api/features/importance")
def feature_importance():
    results = get_pipeline_results()
    return {
        "regression": results["regression"]["feature_importance"],
        "classification": results["classification"]["feature_importance"],
    }


FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
