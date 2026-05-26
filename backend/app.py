from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pandas as pd
import json
import os

from clean_and_model import (
    FEATURE_COLS, TARGET_COL, RADIATION_LABELS,
    load_dataset, clean_dataset,
    train_regression, train_classification,
    tree_to_json
)

app = FastAPI(title="Solarmind Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASET_PATH = os.path.join("data", "solar_radiation_dataset.csv")

result_cache = None


def get_pipeline_results():
    global result_cache
    if result_cache is None:
        from clean_and_model import run_full_pipeline
        result_cache = run_full_pipeline(DATASET_PATH)
    return result_cache


@app.get("/api/status")
def status():
    return {
        "status": "online",
        "dataset_exists": os.path.exists(DATASET_PATH),
        "feature_cols": FEATURE_COLS,
        "target_col": TARGET_COL,
        "radiation_labels": RADIATION_LABELS,
    }


@app.get("/api/data/raw")
def raw_data(page: int = 1, per_page: int = 50):
    df = load_dataset(DATASET_PATH)
    total = len(df)
    start = (page - 1) * per_page
    end = start + per_page
    data = df.iloc[start:end].to_dict(orient="records")

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
def cleaned_data(page: int = 1, per_page: int = 50):
    df = load_dataset(DATASET_PATH)
    df_clean, stats = clean_dataset(df)
    total = len(df_clean)
    start = (page - 1) * per_page
    end = start + per_page
    data = df_clean.iloc[start:end].to_dict(orient="records")

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
