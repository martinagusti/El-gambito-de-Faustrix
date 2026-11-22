"""Render original chess sprites. Requires Pillow only."""
from math import sin, cos, pi, sqrt
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path("public/themes/golden-library")
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 240

PLINTH = [(0, .76), (.08, .91), (.18, .94), (.24, .93), (.30, .79),
          (.38, .80), (.43, .71), (.49, .56), (.60, .48)]
PROFILES = {
    "P": [(.80,.40),(1.10,.32),(1.31,.35),(1.39,.46),(1.48,.48),
          (1.55,.34),(1.62,.27),(1.65,.10)],
    "B": [(.90,.43),(1.42,.27),(1.70,.34),(1.77,.55),(1.86,.56),
          (1.95,.30),(2.07,.43),(2.25,.48),(2.45,.37),(2.66,.07),
          (2.72,.12),(2.81,.09),(2.86,.01)],
    "R": [(.76,.57),(1.06,.50),(1.73,.50),(1.87,.58),(2.01,.70),
          (2.20,.70),(2.21,.51),(2.03,.50),(2.03,.02)],
    "N": [(.70,.55),(.83,.51),(.85,.01)],
    "Q": [(.91,.48),(1.58,.29),(1.96,.36),(2.03,.53),(2.11,.58),
          (2.18,.44),(2.46,.69),(2.50,.55),(2.39,.34),(2.38,.11),
          (2.61,.10),(2.69,.19),(2.77,.18),(2.85,.07),(2.87,.01)],
    "K": [(.93,.49),(1.59,.31),(1.90,.42),(2.01,.59),(2.10,.60),
          (2.18,.42),(2.29,.51),(2.48,.54),(2.62,.37),(2.69,.20),(2.72,.01)],
}

def lathe(faces, profile):
    for i, ((z0,r0),(z1,r1)) in enumerate(zip(profile, profile[1:])):
        for j in range(76):
            a, b = j*2*pi/76, (j+1)*2*pi/76
            pts = [(r0*cos(a),r0*sin(a),z0),(r0*cos(b),r0*sin(b),z0),
                   (r1*cos(b),r1*sin(b),z1),(r1*cos(a),r1*sin(a),z1)]
            angle = (a+b)/2
            length = sqrt((z1-z0)**2 + (r1-r0)**2) or 1
            normal = (cos(angle)*(z1-z0)/length, sin(angle)*(z1-z0)/length, (r0-r1)/length)
            faces.append((pts,normal,i in {1,3,5,7} or (i > 10 and z1-z0 < .09 and z1-z0 > .015)))

def solid(faces, shape, thickness, gold=False):
    for y, direction in [(-thickness,-1),(thickness,1)]:
        faces.append(([(x,y,z) for x,z in shape], (0,direction,0), gold))
    for (x,z),(u,v) in zip(shape, shape[1:]+shape[:1]):
        length = sqrt((v-z)**2 + (u-x)**2) or 1
        faces.append(([(x,-thickness,z),(u,-thickness,v),(u,thickness,v),(x,thickness,z)],
                      ((z-v)/length,0,(u-x)/length),gold))

def box(faces, x, z, w, h, d, gold=True):
    solid(faces, [(x-w,z),(x+w,z),(x+w,z+h),(x-w,z+h)],d,gold)

def bead(faces, x, y, z, radius, gold=True):
    sphere = []
    lathe(sphere, [(z-radius*cos(i*pi/12), radius*sin(i*pi/12)) for i in range(13)])
    faces.extend(([(u+x,v+y,w) for u,v,w in points], normal, gold) for points,normal,_ in sphere)

def render(color, kind):
    faces = []
    lathe(faces, PLINTH + PROFILES[kind])
    if kind == "P":
        bead(faces, 0, 0, 2.00, .46, False)
    if kind == "N":
        solid(faces, [(-.55,.80),(.57,.80),(.60,1.30),(.42,1.94),(.20,2.39),
            (.21,2.69),(.00,2.52),(-.19,2.72),(-.28,2.48),(-.79,1.91),
            (-.72,1.69),(-.54,1.63),(-.20,1.79),(-.27,1.43),(-.48,1.09)],.25)
        solid(faces, [(0,2.22),(-.18,2.21),(-.12,2.11),(-.03,2.13)],.255,True)
        solid(faces, [(.26,2.39),(.45,2.02),(.61,1.58),(.62,1.20),
            (.49,1.27),(.43,1.65),(.31,2.01),(.14,2.28)],.267,True)
    if kind == "R":
        for j in range(6):
            a = j*pi/3
            pts = [(r*cos(a+t), r*sin(a+t)) for r,t in [(.49,-.21),(.71,-.21),(.71,.21),(.49,.21)]]
            faces.append(([(x,y,2.43) for x,y in pts],(0,0,1),True))
            for (x,y),(u,v) in zip(pts,pts[1:]+pts[:1]):
                faces.append(([(x,y,2.19),(u,v,2.19),(u,v,2.43),(x,y,2.43)],
                    (cos(a),sin(a),.1),False))
    if kind == "K":
        box(faces,0,2.61,.10,.58,.12)
        box(faces,0,2.93,.27,.15,.14)
    if kind == "Q":
        for j in range(8):
            angle = j*pi/4
            bead(faces, .57*cos(angle), .57*sin(angle), 2.55, .097)
    if kind == "B":
        solid(faces,[(.09,2.60),(.21,2.56),(-.06,2.22),(-.15,2.26)],.42,True)
    im = Image.new("RGBA",(SIZE,SIZE))
    draw = ImageDraw.Draw(im)
    draw.ellipse((51,185,205,222),fill=(17,8,4,136))
    im = im.filter(ImageFilter.GaussianBlur(7))
    contact = Image.new("RGBA", im.size)
    ImageDraw.Draw(contact).ellipse((65,195,172,222),fill=(12,5,3,150))
    im.alpha_composite(contact.filter(ImageFilter.GaussianBlur(3)))
    draw = ImageDraw.Draw(im)
    def camera(p):
        x,y,z=p
        h = .96*x+.28*y
        d = -.28*x+.96*y
        return (120+65*h,204-55*z+24*d, .93*d+.37*z)
    for points,normal,gold in sorted(faces,key=lambda face:sum(camera(p)[2] for p in face[0])/len(face[0])):
        nx,ny,nz = normal
        light = max(0, -.51*nx + .49*ny + .69*nz)
        key = max(0, -.42*nx + .84*ny + .34*nz) ** (23 if gold else 32)
        rim = max(0, .85*nx + .19*ny + .49*nz) ** 9
        window = max(0, -.82*nx - .16*ny + .55*nz) ** 8
        base = (176, 93, 25) if gold else ((236, 208, 163) if color=="w" else (29, 24, 24))
        shading = .34 + .66*light
        rgb = tuple(min(255, int(c*shading + key*k + rim*r + window*s)) for c,k,r,s in
                    zip(base, (222,187,126), (89,75,58), (43,54,65)))
        draw.polygon([camera(p)[:2] for p in points],fill=(*rgb,255))
    im.resize((192,192),Image.Resampling.LANCZOS).save(OUT/(color+kind+".webp"),quality=94,method=6)

for color in "wb":
    for piece in PROFILES:
        render(color,piece)

