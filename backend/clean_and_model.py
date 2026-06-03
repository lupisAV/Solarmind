import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier, export_text
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import json
# Columnas utilizadas como variables predictoras (features) para ambos modelos
FEATURE_COLS = [
    "hora_numerica", "temperatura", "humedad", "presion_atmosferica",
    "velocidad_viento", "nubosidad", "angulo_zenital", "precipitacion"
]

# Variable objetivo para el modelo de regresión
TARGET_COL = "radiacion_solar"

# Bins para discretizar la radiación solar y generar la variable de clasificación
RADIATION_BINS = [0, 250, 500, 750, 1300]
RADIATION_LABELS = ["Baja", "Media", "Alta", "Muy Alta"]


def load_dataset(path="data/solar_radiation_dataset.csv"):
    df = pd.read_csv(path)
    return df


# Pipeline de limpieza de datos: convierte columnas a numérico, imputa nulos con la mediana,
# elimina duplicados, corrige outliers con IQR y recorta valores a rangos físicos válidos.
# También crea la columna 'radiacion_categoria' discretizando la variable objetivo.
def clean_dataset(df):
    df = df.copy()
    stats = {"original_rows": len(df), "original_cols": len(df.columns)}

    # Paso 1: Forzar conversión a numérico (los strings y errores se convierten en NaN)
    numeric_cols = [c for c in FEATURE_COLS + [TARGET_COL] if c in df.columns]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Paso 2: Imputar los NaN con la mediana de cada columna
    nulls_before = df[numeric_cols].isnull().sum().sum()
    stats["nulls_found"] = int(nulls_before)

    for col in numeric_cols:
        median_val = df[col].median()
        df[col] = df[col].fillna(median_val)

    # Paso 3: Eliminar filas duplicadas
    stats["duplicates_removed"] = int(df.duplicated().sum())
    df = df.drop_duplicates().reset_index(drop=True)

    # Paso 4: Detectar y corregir outliers usando el rango intercuartílico (IQR × 3)
    # Reemplaza los valores extremos con la mediana de la columna.
    outlier_count = 0
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 3 * iqr
        upper = q3 + 3 * iqr
        mask = (df[col] < lower) | (df[col] > upper)
        outlier_count += mask.sum()
        df.loc[mask, col] = df[col].median()

    stats["outliers_fixed"] = int(outlier_count)

    # Paso 5: Recortar valores a rangos físicamente plausibles para cada variable
    for col in numeric_cols:
        if col == "nubosidad":
            df[col] = df[col].clip(0, 8)
        elif col == "humedad":
            df[col] = df[col].clip(0, 100)
        elif col == "angulo_zenital":
            df[col] = df[col].clip(0, 90)
        elif col == "precipitacion":
            df[col] = df[col].clip(0, None)
        elif col == "radiacion_solar":
            df[col] = df[col].clip(0, 1300)
        elif col == "velocidad_viento":
            df[col] = df[col].clip(0, 50)

    # Crear variable categórica discretizando la radiación solar en 4 niveles
    df["radiacion_categoria"] = pd.cut(
        df[TARGET_COL], bins=RADIATION_BINS, labels=RADIATION_LABELS, include_lowest=True
    )
    df["radiacion_categoria"] = df["radiacion_categoria"].fillna("Baja")

    stats["cleaned_rows"] = len(df)
    stats["cleaned_cols"] = len(df.columns)

    return df, stats


# Entrena un árbol de decisión para regresión (predicción de W/m² continuos).
# Retorna el modelo entrenado, métricas (R², MAE, RMSE), texto del árbol e importancia de features.
def train_regression(df):
    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    # División 80/20 con semilla fija para reproducibilidad
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Árbol de regresión con profundidad y tamaño mínimo de hoja limitados para evitar overfitting
    # Árbol de regresión con profundidad y tamaño mínimo de hoja limitados para evitar overfitting
    model = DecisionTreeRegressor(max_depth=6, min_samples_split=10, min_samples_leaf=5, random_state=42)
    model.fit(X_train, y_train)

    # Métricas de regresión sobre el conjunto de test
    y_pred = model.predict(X_test)

    metrics = {
        "r2": round(r2_score(y_test, y_pred), 4),
        "mae": round(mean_absolute_error(y_test, y_pred), 2),
        "rmse": round(np.sqrt(mean_squared_error(y_test, y_pred)), 2),
        "mse": round(mean_squared_error(y_test, y_pred), 2),
        "samples_train": len(X_train),
        "samples_test": len(X_test),
    }

    tree_text = export_text(model, feature_names=FEATURE_COLS, max_depth=3)

    feature_importance = {
        name: round(imp, 4)
        for name, imp in zip(FEATURE_COLS, model.feature_importances_)
    }
    feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))

    return model, metrics, tree_text, feature_importance


# Entrena un árbol de decisión para clasificación (predicción de nivel de radiación: Baja/Media/Alta/Muy Alta).
# Usa estratificación para mantener la proporción de clases en train/test.
# Retorna el modelo, métricas (accuracy, precision, recall, F1, matriz de confusión), texto e importancia.
def train_classification(df):
    X = df[FEATURE_COLS].values
    y = df["radiacion_categoria"].values

    # División estratificada 80/20 para preservar la distribución de clases
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Árbol de clasificación con los mismos hiperparámetros que el regresor
    model = DecisionTreeClassifier(max_depth=6, min_samples_split=10, min_samples_leaf=5, random_state=42)
    model.fit(X_train, y_train)

    # Métricas de clasificación sobre el conjunto de test
    y_pred = model.predict(X_test)

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision_macro": round(precision_score(y_test, y_pred, average="macro", zero_division=0), 4),
        "recall_macro": round(recall_score(y_test, y_pred, average="macro", zero_division=0), 4),
        "f1_macro": round(f1_score(y_test, y_pred, average="macro", zero_division=0), 4),
        "samples_train": len(X_train),
        "samples_test": len(X_test),
        "classes": RADIATION_LABELS,
    }
    metrics["class_distribution"] = {
        label: int((y == label).sum())
        for label in RADIATION_LABELS
    }

    # Matriz de confusión: filas = clase real, columnas = clase predicha
    cm = confusion_matrix(y_test, y_pred, labels=RADIATION_LABELS)
    metrics["confusion_matrix"] = cm.tolist()

    tree_text = export_text(model, feature_names=FEATURE_COLS, max_depth=3)

    feature_importance = {
        name: round(imp, 4)
        for name, imp in zip(FEATURE_COLS, model.feature_importances_)
    }
    feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))

    return model, metrics, tree_text, feature_importance


# Convierte un árbol de decisión de scikit-learn en un objeto JSON anidado.
# Cada nodo contiene: id, is_leaf, samples, impurity.
# Nodos internos: feature, threshold, left, right.
# Hojas de regresión: prediction (valor numérico en W/m²).
# Hojas de clasificación: class_probs (probabilidades por clase), predicted_class (índice).
def tree_to_json(model, feature_names):
    # Extrae las estructuras internas del árbol de scikit-learn
    tree = model.tree_
    children_left = tree.children_left.tolist()
    children_right = tree.children_right.tolist()
    threshold = tree.threshold.tolist()
    feature = tree.feature.tolist()
    value = tree.value.tolist()
    n_node_samples = tree.n_node_samples.tolist()
    impurity = tree.impurity.tolist()

    # Construye el JSON recursivamente desde la raíz (nodo 0)
    def build_node(node_id):
        # Un nodo es hoja si no tiene hijo izquierdo (children_left[node_id] == -1)
        is_leaf = children_left[node_id] == -1

        node = {
            "id": node_id,
            "is_leaf": is_leaf,
            "samples": n_node_samples[node_id],
            "impurity": round(impurity[node_id], 4),
        }

        if is_leaf:
            # Hoja de regresión: value[i][0] es un escalar (W/m²)
            # Hoja de clasificación: value[i] es un array de probabilidades por clase
            vals = value[node_id][0]
            if len(vals) == 1:
                node["prediction"] = round(float(vals[0]), 2)
            else:
                node["class_probs"] = [round(float(v), 4) for v in vals]
                node["predicted_class"] = int(np.argmax(vals))
        else:
            node["feature"] = feature_names[feature[node_id]]
            node["threshold"] = round(threshold[node_id], 2)
            node["left"] = build_node(children_left[node_id])
            node["right"] = build_node(children_right[node_id])

        return node

    return build_node(0)


# Pipeline completo: carga el dataset, lo limpia, entrena ambos modelos
# (regresión y clasificación) y serializa los árboles a JSON. Todo en una sola llamada.
def run_full_pipeline(path="data/solar_radiation_dataset.csv"):
    df_raw = load_dataset(path)

    df_clean, clean_stats = clean_dataset(df_raw)

    reg_model, reg_metrics, reg_tree_text, reg_feat_imp = train_regression(df_clean)
    cls_model, cls_metrics, cls_tree_text, cls_feat_imp = train_classification(df_clean)

    reg_tree_json = tree_to_json(reg_model, FEATURE_COLS)
    cls_tree_json = tree_to_json(cls_model, FEATURE_COLS)

    return {
        "cleaning_stats": clean_stats,
        "regression": {
            "metrics": reg_metrics,
            "tree_text": reg_tree_text,
            "tree_json": reg_tree_json,
            "feature_importance": reg_feat_imp,
        },
        "classification": {
            "metrics": cls_metrics,
            "tree_text": cls_tree_text,
            "tree_json": cls_tree_json,
            "feature_importance": cls_feat_imp,
        },
    }


if __name__ == "__main__":
    result = run_full_pipeline()
    print(json.dumps(result["cleaning_stats"], indent=2))
    print("\n--- Regression ---")
    print(json.dumps(result["regression"]["metrics"], indent=2))
    print("\n--- Classification ---")
    print(json.dumps(result["classification"]["metrics"], indent=2))
