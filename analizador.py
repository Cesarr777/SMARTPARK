import cv2
from ultralytics import YOLO
import requests
import json

# === CONFIGURACIÓN ===
VIDEO_PATH = "carPark.mov"
ZONAS_PATH = "zonas72.json"
ENDPOINT = "http://192.168.1.71:5000/actualizar"  # Cambia IP si es necesario

# === CARGAR CAJONES ===
with open(ZONAS_PATH) as f:
    zonas = json.load(f)
zonas = {str(k): v for k, v in zonas.items() if str(k) != "72"}

# === CARGAR MODELO ===
model = YOLO("best.pt")
cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    print("❌ No se pudo abrir el video.")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, conf=0.019, iou=0.5)[0]
    ocupados = set()

    for cajon_id, (zx1, zy1, zx2, zy2) in zonas.items():
        # Centro del cajón
        cx = (zx1 + zx2) // 2
        cy = (zy1 + zy2) // 2

        # Tolerancia: caja interior simulada (20% más pequeña)
        margin_x = (zx2 - zx1) // 6
        margin_y = (zy2 - zy1) // 6
        caja_virtual = (zx1 + margin_x, zy1 + margin_y, zx2 - margin_x, zy2 - margin_y)

        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            # Revisar si centro del cajón cae dentro de la detección
            if x1 <= cx <= x2 and y1 <= cy <= y2:
                # También verifica que el bbox del auto intersecte la zona interior del cajón
                if not (x2 < caja_virtual[0] or x1 > caja_virtual[2] or
                        y2 < caja_virtual[1] or y1 > caja_virtual[3]):
                    ocupados.add(cajon_id)
                    break

        # Visualizar centro del cajón
        cv2.circle(frame, (cx, cy), 3, (255, 255, 0), -1)

    # === CONSTRUIR SIMULACIÓN ===
    simulacion = [
        {"id": cajon_id, "status": "occupied" if cajon_id in ocupados else "available"}
        for cajon_id in zonas.keys()
    ]

    # === ENVIAR A APP ===
    try:
        requests.post(ENDPOINT, json=simulacion)
    except Exception as e:
        print("❌ Error al enviar datos:", e)

    # === VISUAL EN PANTALLA ===
    for cajon_id, (zx1, zy1, zx2, zy2) in zonas.items():
        color = (0, 0, 255) if cajon_id in ocupados else (0, 255, 0)
        cv2.rectangle(frame, (zx1, zy1), (zx2, zy2), color, 2)
        cv2.putText(frame, cajon_id, (zx1 + 2, zy1 + 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 1)

    # Info rápida
    print(f"🔴 Ocupados: {len(ocupados)} | 🟢 Libres: {len(zonas) - len(ocupados)}")

    cv2.imshow("SMARTPARK: Visual", frame)
    if cv2.waitKey(120) == 27:
        break

cap.release()
cv2.destroyAllWindows()