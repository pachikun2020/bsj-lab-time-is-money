"""Render the MCC social card using BSJ brand colors and local system fonts."""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
WIDTH,HEIGHT,SCALE=1200,630,2
NAVY=(10,23,49)
NAVY2=(18,37,76)
GOLD=(244,185,66)
ORANGE=(232,114,42)
INK=(247,242,232)
SUB=(180,192,216)

def render(destination):
    fonts=Path('/System/Library/Fonts')
    mincho=next(fonts.glob('*明朝 ProN.ttc'))
    serif=fonts/'Supplemental/Georgia Bold.ttf'
    sans=fonts/'ヒラギノ角ゴシック W6.ttc'
    def font(source,size,index=0):return ImageFont.truetype(str(source),int(size*SCALE),index=index)
    canvas=Image.new('RGB',(WIDTH*SCALE,HEIGHT*SCALE),NAVY)
    draw=ImageDraw.Draw(canvas,'RGBA')
    for row in range(HEIGHT*SCALE):
        blend=row/(HEIGHT*SCALE)
        color=tuple(round(NAVY[channel]+(NAVY2[channel]-NAVY[channel])*blend) for channel in range(3))
        draw.line((0,row,WIDTH*SCALE,row),fill=color)
    for offset in range(-600,1800,64):
        draw.line((offset*SCALE,0,(offset-300)*SCALE,HEIGHT*SCALE),fill=GOLD+(11,),width=SCALE)
    draw.rectangle((48*SCALE,48*SCALE,1152*SCALE,582*SCALE),outline=GOLD+(60,),width=SCALE)
    draw.line((540*SCALE,48*SCALE,660*SCALE,48*SCALE),fill=GOLD,width=3*SCALE)
    for center in (130,1070):
        draw.ellipse(((center-170)*SCALE,190*SCALE,(center+170)*SCALE,530*SCALE),outline=GOLD+(17,),width=2*SCALE)
        draw.line((center*SCALE,360*SCALE,center*SCALE,267*SCALE),fill=GOLD+(22,),width=2*SCALE)
        draw.line((center*SCALE,360*SCALE,(center+70)*SCALE,400*SCALE),fill=ORANGE+(27,),width=3*SCALE)
    def centered(top,value,face,color):
        position=(600*SCALE,top*SCALE)
        bounds=draw.textbbox(position,value,font=face,anchor='mt')
        if bounds[0]<300*SCALE or bounds[2]>900*SCALE or bounds[1]<48*SCALE or bounds[3]>582*SCALE:
            raise ValueError('Text outside central safe area: '+value)
        draw.text(position,value,font=face,fill=color,anchor='mt')
    centered(68,'BSJ LAB #001',font(sans,21),GOLD)
    centered(120,'Time is Money',font(serif,43),INK)
    centered(181,'MCC',font(serif,144),ORANGE)
    centered(331,'ミーティングコストカウンター',font(mincho,36,2),INK)
    centered(405,'会議の値段を、その場で。',font(mincho,36,2),GOLD)
    draw.line((550*SCALE,475*SCALE,650*SCALE,475*SCALE),fill=ORANGE,width=3*SCALE)
    centered(503,'mcc.meryds.com',font(sans,20),SUB)
    centered(549,'MERYDS',font(serif,21),INK)
    destination=Path(destination)
    destination.parent.mkdir(parents=True,exist_ok=True)
    canvas.resize((WIDTH,HEIGHT),Image.Resampling.LANCZOS).save(destination,format='PNG',optimize=True)
    if destination.stat().st_size>=1_000_000:raise ValueError('OGP image exceeds 1 MB')
    print(destination)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path,default=ROOT/'ogp.png')
    arguments=parser.parse_args()
    render(arguments.output)
