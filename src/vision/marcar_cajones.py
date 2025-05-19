import cv2

# Cargar el primer frame del video
video = cv2.VideoCapture("carPark.mov")
ret, frame = video.read()
video.release()

coordenadas = {}
actual = [0, 0]
contador = 1
marcando = False

# Callback para dibujar con el mouse
def marcar_cajon(event, x, y, flags, param):
    global actual, contador, marcando

    if event == cv2.EVENT_LBUTTONDOWN:
        actual = [x, y]
        marcando = True

    elif event == cv2.EVENT_LBUTTONUP:
        marcando = False
        x1, y1 = actual
        x2, y2 = x, y
        cajon_id = str(contador)
        coordenadas[cajon_id] = (min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2))
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, cajon_id, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
        contador += 1

cv2.namedWindow("Marca los 72 cajones")
cv2.setMouseCallback("Marca los 72 cajones", marcar_cajon)

while True:
    cv2.imshow("Marca los 72 cajones", frame)
    key = cv2.waitKey(1)

    if key == 27:  # ESC
        break
    elif key == ord('s'):
        with open("zonas72.json", "w") as f:
            import json
            json.dump(coordenadas, f, indent=4)
        print("✅ Coordenadas guardadas en zonas72.json")
        break

cv2.destroyAllWindows()