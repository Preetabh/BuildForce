import sys, re
sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
import pymupdf as fitz
from rapidocr_onnxruntime import RapidOCR

engine = RapidOCR()
doc = fitz.open('C:/Users/Vishu/Downloads/DSR_Vol_1_Civil_compressed.pdf')
page = doc[13]
pix = page.get_pixmap(dpi=120)
result, elapse = engine(pix.tobytes('png'))

boxes = []
for r in result:
    box, txt, conf = r[0], r[1].strip(), float(r[2])
    y_center = (box[0][1] + box[2][1]) / 2.0
    x_center = (box[0][0] + box[1][0]) / 2.0
    boxes.append({
        'y': y_center,
        'x': x_center,
        'txt': txt,
        'conf': conf,
        'box': box
    })

boxes.sort(key=lambda b: b['y'])

code_pattern = re.compile(r'^\d{3,5}[A-Za-z]?$|^\d+\.\d+(\.[A-Za-z0-9]+)*$')
code_boxes = [b for b in boxes if code_pattern.match(b['txt']) and b['x'] < 220 and b['y'] > 220]
code_boxes.sort(key=lambda b: b['y'])

rows = []
for i, cb in enumerate(code_boxes):
    code = cb['txt']
    y_start = cb['y'] - 12
    y_end = code_boxes[i+1]['y'] - 10 if i+1 < len(code_boxes) else cb['y'] + 35
    
    # Elements in this Y slice
    row_boxes = [b for b in boxes if y_start <= b['y'] < y_end and b != cb]
    
    # Description boxes: 150 < x < 680
    desc_boxes = [b for b in row_boxes if 150 < b['x'] < 680]
    desc_boxes.sort(key=lambda b: (b['y'], b['x']))
    desc = ' '.join([b['txt'] for b in desc_boxes])
    
    # Unit boxes: 660 <= x < 780
    unit_boxes = [b for b in row_boxes if 660 <= b['x'] < 780]
    unit = ' '.join([b['txt'] for b in unit_boxes])
    
    # Rate boxes: x >= 780
    rate_boxes = [b for b in row_boxes if b['x'] >= 780]
    rate_str = rate_boxes[0]['txt'] if rate_boxes else ''
    rate_clean = re.sub(r'[^\d.]', '', rate_str)
    
    confs = [cb['conf']] + [b['conf'] for b in row_boxes]
    avg_conf = sum(confs) / len(confs) if confs else 0.5
    
    rows.append({
        'code': code,
        'desc': desc,
        'unit': unit,
        'rate': rate_clean,
        'conf': round(avg_conf, 2)
    })

print(f'Extracted {len(rows)} complete rows from page 13:')
for r in rows[:15]:
    print(f"[{r['code']}] {r['desc']} | Unit: {r['unit']} | Rate: ₹{r['rate']} (conf: {r['conf']})")
