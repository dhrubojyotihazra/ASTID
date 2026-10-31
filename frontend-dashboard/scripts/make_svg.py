import cv2
import numpy as np
from PIL import Image

img = Image.open('frontend-dashboard/public/astid-wordmark-hd.png')
arr = np.array(img)
alpha = arr[:, :, 3]
h, w = alpha.shape

# Threshold alpha to find exact shape
_, thresh = cv2.threshold(alpha, 127, 255, cv2.THRESH_BINARY)
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_KCOS)

print(f'Found {len(contours)} contours')

# Generate SVG
svg_paths = []
for i, c in enumerate(contours):
    # Epsilon = 0.6 for smooth, lightweight vector curves
    epsilon = 0.6
    approx = cv2.approxPolyDP(c, epsilon, True)
    pts = approx.squeeze()
    if len(pts) < 3:
        continue
    d = f'M {pts[0][0]},{pts[0][1]} '
    for p in pts[1:]:
        d += f'L {p[0]},{p[1]} '
    d += 'Z'
    svg_paths.append(d)

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <defs>
    <linearGradient id="astid-green-grad" x1="0%" y1="30%" x2="100%" y2="70%">
      <stop offset="0%" stop-color="#005a2b" />
      <stop offset="30%" stop-color="#0f7a3d" />
      <stop offset="60%" stop-color="#1db954" />
      <stop offset="85%" stop-color="#0d5f30" />
      <stop offset="100%" stop-color="#053318" />
    </linearGradient>
    <filter id="glossy-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.25" />
    </filter>
  </defs>
  <!-- Vector Wordmark Paths -->
  <g fill="url(#astid-green-grad)" fill-rule="evenodd" filter="url(#glossy-shadow)">
'''

for p in svg_paths:
    svg_content += f'    <path d="{p}" />\n'

svg_content += '''  </g>
</svg>'''

with open('frontend-dashboard/public/astid-wordmark.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

# Also generate a crisp transparent PNG at 2x and 1x
img.save('frontend-dashboard/public/astid-wordmark.png', format='PNG')
print('Successfully generated frontend-dashboard/public/astid-wordmark.svg and astid-wordmark.png!')
