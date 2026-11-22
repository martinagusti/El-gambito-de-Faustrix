"""Render an original fallback scene for the Golden Library theme."""
from math import sin, pi
from pathlib import Path
from random import Random
from PIL import Image, ImageDraw, ImageFilter

rng = Random(14)
w, h = 1440, 900
im = Image.new("RGB", (w, h))
for y in range(h):
    for x in range(w):
        glow = max(0, 1 - ((x-600)/695)**2 - ((y-235)/700)**2)
        grain = rng.randrange(-3, 4)
        im.putpixel((x,y), tuple(max(0, c+int(glow*k)+grain) for c,k in [(18,44),(13,38),(13,28)]))
paint = ImageDraw.Draw(im)

def window(cx, top, radius, bottom):
    shoulder = top + radius
    paint.polygon([(cx-radius-14,bottom+12),(cx-radius-14,shoulder),(cx,top-18),(cx+radius+14,shoulder),(cx+radius+14,bottom+12)], fill="#36271c")
    mask = Image.new("L",(w,h))
    outline = ImageDraw.Draw(mask)
    outline.polygon([(cx-radius,bottom),(cx-radius,shoulder),(cx,top),(cx+radius,shoulder),(cx+radius,bottom)], fill=255)
    glass = Image.new("RGB",(w,h),"#172a39")
    pattern = ImageDraw.Draw(glass)
    colors = ["#377e96","#3b6176","#76a3a3","#cb934e","#986748","#4d8e9b","#78555e","#e7bf77"]
    d=35
    for yy in range(top-2*d,bottom+2*d,d):
        for xx in range(cx-radius-2*d,cx+radius+2*d,d):
            x=xx+(d//2 if yy//d%2 else 0)
            pattern.polygon([(x,yy-d),(x+d//2,yy),(x,yy+d),(x-d//2,yy)],fill=rng.choice(colors),outline="#293338",width=2)
    for delta in [-radius//2,0,radius//2]:
        pattern.line([(cx+delta, shoulder),(cx+delta,bottom)],fill="#161e20",width=7)
    for yy in range(shoulder,bottom,81):
        pattern.line([(cx-radius,yy),(cx+radius,yy)],fill="#252522",width=7)
    im.paste(glass,(0,0),mask)

window(344, -33, 81, 700)
window(638, -53, 136, 725)
for x0,x1 in [(0,213),(896,1440)]:
    paint.rectangle((x0,0,x1,758),fill="#241910")
    for yy in range(20,766,116):
        paint.rectangle((x0,yy,x1,yy+11),fill="#865737")
        xx=x0+3
        while xx<x1-8:
            bw=rng.randrange(9,23)
            bh=rng.randrange(53,93)
            tone=rng.choice(["#382125","#4c2f23","#61442d","#343c33","#39313b","#34241b"])
            paint.rounded_rectangle((xx,yy+112-bh,min(xx+bw,x1),yy+113),radius=2,fill=tone)
            paint.line((xx+1,yy+125-bh,min(xx+bw-1,x1),yy+125-bh),fill="#ac7949",width=2)
            xx+=bw+2
    for xx in range(x0,x1+1,100):
        paint.rectangle((xx,0,xx+6,781),fill="#61402a")
for xx in [221,442,469,804,855]:
    paint.rectangle((xx,0,xx+15,780),fill="#593c26")
    paint.line((xx+2,0,xx+2,782),fill="#aa784a",width=2)
for yy in range(777,h):
    glow=max(0,1-abs(yy-816)/85)
    for xx in range(w):
        grain=sin(xx/53+yy*6)*3+rng.randrange(-3,4)
        hue=glow*(.46+.52*max(0,1-abs(xx-425)/900))
        im.putpixel((xx,yy), tuple(int(c+k*hue+grain) for c,k in [(42,91),(25,57),(17,29)]))
im = im.filter(ImageFilter.GaussianBlur(2.4))
target = Path("public/themes/golden-library")
target.mkdir(parents=True, exist_ok=True)
im.save(target/"library-fallback.webp",quality=83)

