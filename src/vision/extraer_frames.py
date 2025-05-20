import cv2
import os

video_path = "carPark.mov"
output_folder = "frames_rf"
num_frames = 50  # Puedes cambiar este número

os.makedirs(output_folder, exist_ok=True)
cap = cv2.VideoCapture(video_path)

total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
step = total // num_frames

for i in range(num_frames):
    cap.set(cv2.CAP_PROP_POS_FRAMES, i * step)
    ret, frame = cap.read()
    if ret:
        filename = os.path.join(output_folder, f"frame_{i+1:03}.jpg")
        cv2.imwrite(filename, frame)
        print(f"✅ Guardado {filename}")
    else:
        print(f"⚠️ Falló en el frame {i}")
cap.release()