# VISIO — Technical Explainer
### How Real-Time Object Detection Works (and Why It Looks This Good)

---

## 1. What Is Object Detection?

Object detection is a computer vision task where an AI model simultaneously answers
two questions about an image: **"What objects are here?"** and **"Where are they?"**

Unlike simple image classification (which gives one label per image), object detection
outputs a list of objects, each with:
- A **bounding box** (x, y coordinates of a rectangle around the object)
- A **class label** (e.g. "person", "car", "dog")
- A **confidence score** (0–100%, how certain the model is)

```
┌─────────────────────────────────┐
│                                 │
│   ┌─────────┐   ┌──────────┐   │
│   │ PERSON  │   │   CAR    │   │
│   │  94.2%  │   │  87.5%   │   │
│   └─────────┘   └──────────┘   │
│                                 │
└─────────────────────────────────┘
         One frame, two detections
```

In VISIO, this runs on every webcam frame — typically 15–30 times per second.

---

## 2. YOLO — You Only Look Once

Traditional detection pipelines had two stages: first find candidate regions,
then classify each one. That was slow.

**YOLO (2015, Joseph Redmon et al.)** flipped the paradigm: it treats detection
as a single regression problem. The image is divided into a grid; each cell
predicts bounding boxes and class probabilities **simultaneously** in one
forward pass through the neural network.

```
Image (640×640)
        │
        ▼
   CNN Backbone          ← extracts features (edges, textures, shapes)
        │
        ▼
   Neck (FPN/PAN)        ← combines features at multiple scales
        │
        ▼
   Detection Head        ← predicts boxes + classes for every grid cell
        │
        ▼
   NMS (Non-Max Suppression) ← removes duplicate boxes
        │
        ▼
   Final Detections
```

### YOLOv8 (Ultralytics, 2023)

VISIO uses **YOLOv8 nano** (`yolov8n.pt`), the fastest variant in the family.
It uses an anchor-free head, which means it directly predicts box centres and
sizes without needing pre-defined anchor templates — simpler, faster, and more
accurate than earlier versions.

| Version | Released | Key improvement |
|---------|----------|-----------------|
| YOLOv1 | 2015 | Grid-based single pass |
| YOLOv3 | 2018 | Multi-scale predictions |
| YOLOv5 | 2020 | PyTorch, easy deploy |
| YOLOv8 | 2023 | Anchor-free, unified API |

---

## 3. The COCO Dataset — What the Model Knows

YOLOv8n is pre-trained on **COCO (Common Objects in Context)**, a dataset of
~330,000 images with 80 object categories. That is why VISIO can detect things
like people, bicycles, cars, dogs, bottles, chairs, laptops, and so on — right
out of the box with no extra training needed.

Common classes (sample):
`person · bicycle · car · motorbike · aeroplane · bus · train · truck · boat ·
traffic light · fire hydrant · stop sign · parking meter · bench · bird · cat ·
dog · horse · sheep · cow · elephant · bear · zebra · giraffe · backpack ·
umbrella · handbag · tie · suitcase · frisbee · skis · snowboard · sports ball ·
kite · chair · sofa · diningtable · tv monitor · laptop · mouse · keyboard ·
mobile phone · microwave · oven · toaster · sink · refrigerator · book · clock ·
vase · scissors · teddy bear · hair drier · toothbrush`

---

## 4. The Real-Time Pipeline (How VISIO Works End to End)

```
Webcam → OpenCV → YOLOv8 → Draw Overlay → JPEG → MJPEG Stream → Browser
  │                                                                    │
  └─────────────────────── /status (JSON) ──────────────────── JS Poll┘
```

1. **OpenCV** captures frames from the webcam at up to 30 fps
2. Each frame is passed to the **YOLO model** (runs in the same Python thread)
3. Detected boxes are drawn with **neon corner brackets + labels** using OpenCV
4. The annotated frame is **JPEG-encoded** and emitted as an MJPEG stream via Flask
5. The browser `<img>` tag displays the MJPEG stream natively (no WebSocket needed)
6. Every 600 ms the JavaScript polls `/status` for the **detection list + FPS**
   and updates the sidebar in real time

---

## 5. Confidence Score — What It Means

The confidence score is a combination of:
- **Objectness** — probability that a bounding box contains any object
- **Class probability** — probability that object belongs to a specific class

VISIO uses a threshold of **40%** by default. Detections below this are
discarded to avoid noisy false positives. You can lower it to `0.25` for more
detections or raise it to `0.6` for higher precision.

```
Sidebar color legend:
  Cyan   ≥ 90%  — very high confidence
  Blue   ≥ 70%  — high confidence
  Violet ≥ 50%  — medium confidence
  Pink   < 50%  — low confidence (still above threshold)
```

---

## 6. Real-World Use Cases

| Domain | Application |
|--------|-------------|
| Retail | Shelf monitoring, checkout-free stores (Amazon Go) |
| Security | Perimeter intrusion detection, crowd analysis |
| Automotive | Pedestrian / obstacle detection for ADAS systems |
| Healthcare | Surgical instrument tracking, PPE compliance |
| Agriculture | Crop disease detection, livestock monitoring |
| Industrial | Defect detection on assembly lines |
| Sports | Player tracking, ball detection for analytics |
| Accessibility | Assistive tech for visually impaired navigation |

---

## 7. Performance Notes

### What affects FPS?
- **Model size** — nano (n) > small (s) > medium (m) > large (l) > x-large (x)
- **Resolution** — default input is 640×640; lower = faster
- **Hardware** — GPU (CUDA/MPS) can achieve 60–120+ fps; CPU is typically 10–25 fps
- **Confidence threshold** — higher threshold = fewer boxes to draw

### Improving accuracy without sacrificing speed
- Fine-tune YOLOv8n on a custom dataset (Ultralytics makes this straightforward)
- Apply test-time augmentation (TTA) — disabled by default in VISIO for speed
- Use a larger model variant on a GPU

---

## 8. Screenshots *(placeholders — replace after launch)*

```
[SCREENSHOT 1 — Full dashboard, detection active, person detected]
Caption: VISIO detecting a person with 94% confidence.

[SCREENSHOT 2 — Sidebar showing multiple object classes]
Caption: Simultaneous detection of 5 object classes.

[SCREENSHOT 3 — FPS counter showing 28 fps]
Caption: ~28 fps on a mid-range laptop CPU (Intel i7-12th gen).
```

---

## 9. Future Improvements

### Short term
- [ ] GPU/MPS acceleration toggle in the UI
- [ ] Adjustable confidence threshold slider
- [ ] Class filter checkboxes (show only "person", "car", etc.)
- [ ] Detection logging to CSV / SQLite

### Medium term
- [ ] Custom model upload (drop your `.pt` file into the UI)
- [ ] Multi-camera support (switch between camera indices)
- [ ] Object counting over time (person entered / exited frame)
- [ ] WebRTC stream for lower latency than MJPEG

### Long term
- [ ] Edge deployment (Raspberry Pi 4/5 with NCNN backend)
- [ ] Segmentation mode (YOLOv8-seg for pixel-level masks)
- [ ] Pose estimation mode (YOLOv8-pose for skeleton overlay)
- [ ] REST API with authentication for embedding in other products

---

## 10. References

- Redmon, J. et al. "You Only Look Once: Unified, Real-Time Object Detection." CVPR 2016.
- Ultralytics YOLOv8 Documentation: https://docs.ultralytics.com
- COCO Dataset: https://cocodataset.org
- OpenCV Python: https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html
- Flask: https://flask.palletsprojects.com

---

*VISIO Explainer v1.0 — Generated alongside the application source code.*
