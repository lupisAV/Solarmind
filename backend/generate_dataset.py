import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

N = 5500
start_date = datetime(2024, 1, 1)

dates = [start_date + timedelta(hours=i) for i in range(N)]

hora_num = np.array([d.hour + d.minute / 60.0 for d in dates])

temp_base = 22 + 8 * np.sin(np.pi * (hora_num - 6) / 12)
temp = np.round(temp_base + np.random.normal(0, 3, N), 1)

nubosidad = np.random.randint(0, 9, N)

# Seasonal effect: day length varies through year
dias_transcurridos = np.array([(d - start_date).days for d in dates])
day_of_year = dias_transcurridos % 365
season_factor = 0.5 + 0.5 * np.sin(2 * np.pi * (day_of_year - 80) / 365)

hora_efectiva = np.clip(hora_num - 6, 0, 12)
radiacion_base = 1000 * np.sin(np.pi * hora_efectiva / 12) * season_factor
radiacion_base *= (1 - nubosidad * 0.08)
radiacion_base += np.random.normal(0, 25, N)
radiacion = np.clip(np.round(radiacion_base, 1), 0, 1200)

humedad = np.round(np.clip(
    85 - radiacion / 15 - temp * 0.3 + np.random.normal(0, 8, N), 10, 100
), 1)

presion = np.round(np.clip(1013 + np.random.normal(0, 5, N), 990, 1040), 1)

viento = np.round(np.clip(np.random.weibull(1.8, N) * 5, 0, 25), 1)

angulo_zenital = np.round(np.clip(
    90 * np.cos(np.pi * (hora_num - 12) / 12) + np.random.normal(0, 3, N), 0, 90
), 1)

precip = np.round(np.clip(
    np.where(nubosidad > 5, np.random.exponential(3, N), np.random.exponential(0.5, N)),
    0, 50
), 1)

data = {
    "fecha": [d.strftime("%Y-%m-%d") for d in dates],
    "hora": [d.strftime("%H:%M:%S") for d in dates],
    "hora_numerica": np.round(hora_num, 2),
    "temperatura": temp,
    "humedad": humedad,
    "presion_atmosferica": presion,
    "velocidad_viento": viento,
    "nubosidad": nubosidad.astype(int),
    "radiacion_solar": radiacion,
    "angulo_zenital": angulo_zenital,
    "precipitacion": precip,
}

df = pd.DataFrame(data)

cols_numeric = [
    "hora_numerica", "temperatura", "humedad", "presion_atmosferica",
    "velocidad_viento", "nubosidad", "radiacion_solar",
    "angulo_zenital", "precipitacion"
]

for col in cols_numeric:
    df[col] = df[col].astype(object)

error_indices = np.random.choice(N, size=int(N * 0.12), replace=False)

for i in error_indices:
    col = np.random.choice(cols_numeric)
    error_type = np.random.choice(["nan", "outlier", "string", "negative"])
    if col == "nubosidad":
        error_type = np.random.choice(["nan", "outlier", "string"])
    if error_type == "nan":
        df.loc[i, col] = np.nan
    elif error_type == "outlier":
        df.loc[i, col] = float(np.random.choice([9999, -999, 99999]))
    elif error_type == "string":
        df.loc[i, col] = np.random.choice(["ERR", "N/A", "---", "null"])
    elif error_type == "negative" and col not in ["temperatura", "hora_numerica"]:
        df.loc[i, col] = -abs(float(df.loc[i, col]))

duplicate_count = 18
dup_indices = np.random.choice(N, size=duplicate_count, replace=False)
dupes = df.loc[dup_indices].copy()
df = pd.concat([df, dupes], ignore_index=True)

extra_blank = np.random.choice(N, size=35, replace=False)
for i in extra_blank:
    col = np.random.choice(cols_numeric)
    df.loc[i, col] = ""

print(f"Dataset generado: {len(df)} registros")
print(f"Errores inyectados: {len(error_indices)} celdas + {duplicate_count} filas duplicadas + {len(extra_blank)} celdas vacias")
print(f"Columnas: {list(df.columns)}")
print(f"Nulos totales (NaN): {df.isnull().sum().sum()}")
str_errors = 0
for col in cols_numeric:
    s = pd.to_numeric(df[col], errors="coerce")
    str_errors += (s.isnull() & df[col].notnull() & (df[col] != "")).sum()
print(f"Celdas con strings invalidos: {str_errors}")

output_path = "data/solar_radiation_dataset.csv"
df.to_csv(output_path, index=False)
print(f"Guardado en: {output_path}")
