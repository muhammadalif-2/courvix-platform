"""Courvix narrated sport x management films. See docs/MEDIA-KIT.md.
Original motion design, score and sound effects; sample product records only.
Run narrate-media.py first. No video/browser capture or application runtime deps.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance, ImageFilter
from fontTools.ttLib import TTFont
import math, subprocess, json, wave, shutil, argparse
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/media'; WORK=ROOT/'work/media-v2'; WORK.mkdir(parents=True,exist_ok=True)
FPS=30; RATE=24000
ORANGE='#ff641a'; AMBER='#ffab76'; INK='#191817'; PAPER='#f5f2ee'; MUTED='#807b75'; LINE='#dfd9d2'; SOFT='#eee9e2'; WHITE='#fffaf4'
f=TTFont(ROOT/'public/fonts/inter-variable.woff');f.flavor=None;f.save(WORK/'inter.ttf')
fonts={}
def font(size,bold=False):
 key=(int(size),bold)
 if key not in fonts:
  z=ImageFont.truetype(str(WORK/'inter.ttf'),int(size))
  try:z.set_variation_by_axes([32 if size>=28 else 14, 760 if bold else 450])
  except Exception:pass
  fonts[key]=z
 return fonts[key]
def txt(d,xy,s,size=24,color=INK,bold=False):d.text(tuple(map(int,xy)),str(s),font=font(size,bold),fill=color)
def rr(d,b,fill=PAPER,line=None,r=18,width=1):d.rounded_rectangle(tuple(map(int,b)),r,fill=fill,outline=line,width=width)
def wrap(d,s,width,size,bold=False):
 words=s.split();lines=[];line=''
 for word in words:
  new=(line+' '+word).strip()
  if d.textlength(new,font=font(size,bold))>width and line:lines.append(line);line=word
  else:line=new
 if line:lines.append(line)
 return lines
def para(d,x,y,s,width,size=24,color=MUTED,bold=False,leading=1.45):
 for line in wrap(d,s,width,size,bold):txt(d,(x,y),line,size,color,bold);y+=size*leading
 return y
def mark(d,x,y,size=50,color=ORANGE):
 k=size/678;lw=max(2,round(38*k));xy=lambda p:(x+p[0]*k,y+p[1]*k)
 d.ellipse((x+19*k,y+19*k,x+659*k,y+659*k),outline=color,width=lw)
 d.line([xy((25,339)),xy((653,339))],fill=color,width=lw)
 for pts in [[(89,142),(151,220),(279,257),(296,339),(279,420),(151,456),(89,535)],[(589,142),(527,220),(399,257),(382,339),(399,420),(527,456),(589,535)]]:
  pp=[]
  for a,b,c in [(pts[0],pts[1],pts[2]),(pts[2],pts[3],pts[4]),(pts[4],pts[5],pts[6])]:
   for j in range(17):
    t=j/16;pp.append(xy(((1-t)**2*a[0]+2*(1-t)*t*b[0]+t*t*c[0],(1-t)**2*a[1]+2*(1-t)*t*b[1]+t*t*c[1])))
  d.line(pp,fill=color,width=lw,joint='curve')
def logo(d,x,y,size=43):mark(d,x,y,size);txt(d,(x+size+14,y-1),'COURVIX',int(size*.74),ORANGE,True)
def tag(d,x,y,s,fill=SOFT,color=INK,size=17):
 w=d.textlength(s,font=font(size,True))+28;rr(d,(x,y,x+w,y+34),fill,r=8);txt(d,(x+14,y+6),s,size,color,True);return w

def check(d,x,y,color=ORANGE):
 d.ellipse((x,y,x+30,y+30),fill=color);d.line([(x+8,y+15),(x+13,y+20),(x+22,y+10)],fill=WHITE,width=3)
def arrow(d,x,y):d.line((x,y,x+40,y),fill=ORANGE,width=3);d.line([(x+30,y-8),(x+40,y),(x+30,y+8)],fill=ORANGE,width=3)
def ui_base(title,product='Club Management'):
 im=Image.new('RGBA',(1040,630),PAPER);d=ImageDraw.Draw(im)
 rr(d,(1,1,1038,628),PAPER,LINE,22,2)
 rr(d,(1,1,1038,62),'#e9e4dd',r=22);d.rectangle((2,35,1037,62),fill='#e9e4dd')
 for i in range(3):d.ellipse((22+i*19,25,31+i*19,34),fill=['#ff641a','#bcb3a8','#d0c6bb'][i])
 txt(d,(100,20),'COURVIX  /  '+product.upper(),16,MUTED,True)
 tag(d,862,15,'SAMPLE',fill='#fff0e6',color='#ad400a',size=14)
 txt(d,(30,89),title,29,INK,True)
 return im,d

def metric(d,x,y,w,label,value,note=''):
 rr(d,(x,y,x+w,y+125),'#ffffff',LINE,12)
 txt(d,(x+18,y+15),label,17,MUTED)
 size=37
 while d.textlength(value,font=font(size,True))>w-36:size-=1
 txt(d,(x+18,y+45),value,size,INK,True)
 if note:txt(d,(x+18,y+96),note,14,MUTED)
def row(d,x,y,w,name,sub,status='',highlight=False):
 rr(d,(x,y,x+w,y+78),'#fff1e7' if highlight else '#ffffff',ORANGE if highlight else LINE,10)
 d.ellipse((x+16,y+20,x+51,y+55),fill=ORANGE if highlight else '#e8e2db')
 txt(d,(x+25,y+26),name[0],17,WHITE if highlight else INK,True)
 txt(d,(x+67,y+13),name,21,INK,True);txt(d,(x+67,y+46),sub,16,MUTED)
 if status:tag(d,x+w-145,y+22,status,fill=SOFT,color=INK,size=14)
def section_title(d,x,y,t):txt(d,(x,y),t,18,MUTED,True)
def panel(kind,t,duration):
 pt=kind in ['offers','credits','booking','progress']
 names={'opening':'The system behind the session','products':'Choose your product','setup':'Workspace setup','club':'Club control room','member':'Member 360','roles':'Invite your team','dues':'Payment review & reminders','offers':'Visits & session packs','credits':'Session credits','booking':'Appointments & classes','progress':'Training control room','network':'Network overview','closing':'Find your workflow'}
 im,d=ui_base(names[kind], 'Personal Training' if pt else 'Club Management')
 q=min(1,max(0,t/duration))
 if kind=='opening':
  txt(d,(32,158),'THE WORK BEHIND THE WORKOUT',18,ORANGE,True)
  for i,(a,b) in enumerate([('People','Profiles, teams and role access'),('Sessions','Schedules, bookings and attendance'),('Payments','Dues, verification and session credits')]):
   yy=215+i*112;check(d,35,yy+12);txt(d,(88,yy),a,27,INK,True);txt(d,(88,yy+41),b,21,MUTED)
  rr(d,(30,566,1010,603),INK,r=7);txt(d,(48,574),'CLUB MANAGEMENT  +  PERSONAL TRAINING',16,WHITE,True)
 elif kind=='products':
  for i,(a,b,items) in enumerate([('01','Club Management',['Members & teams','Schedules & attendance','Recurring dues']),('02','Personal Training',['Clients & goals','Visits & session packs','Bookings & progress'])]):
   x=30+i*505;rr(d,(x,154,x+475,590),INK if i==0 else '#fff',LINE,16)
   txt(d,(x+24,180),a,64,ORANGE,True);txt(d,(x+24,272),b,26,WHITE if i==0 else INK,True)
   for j,z in enumerate(items):d.line((x+25,348+j*68,x+450,348+j*68),fill='#47413b' if i==0 else LINE);txt(d,(x+25,365+j*68),z,22,'#d4ccc3' if i==0 else MUTED)
 elif kind=='setup':
  for i,(a,b) in enumerate([('Product','Club Management'),('Sport','Basketball'),('Location','Jakarta / Indonesia'),('Currency & time zone','IDR / Asia/Jakarta')]):
   x=30+(i%2)*505;y=160+(i//2)*136;rr(d,(x,y,x+475,y+110),'#fff',LINE,10);txt(d,(x+20,y+15),a,17,MUTED);txt(d,(x+20,y+51),b,23,INK,True)
  rr(d,(30,465,1010,586),'#fff0e5',r=12);txt(d,(50,483),'Subscription verification',23,INK,True);para(d,50,523,'Submit your reference in Billing. Approval follows payment verification.',920,19)
 elif kind=='club':
  for i,(a,b,c) in enumerate([('Active members','128','Across 6 training groups'),('Upcoming training','4','Visible to your role'),('Needs review','5','Payment submissions')]):metric(d,30+i*337,151,315,a,b,c)
  section_title(d,30,300,'YOUR PEOPLE / NEXT ACTIONS')
  row(d,30,341,980,'Jamie Lee','U-16 Basketball / Coach Alex / Tuesday 16:00','Active',True)
  row(d,30,431,980,'Sam Taylor','Senior group / Dues submission to review','Review')
  txt(d,(30,551),'Roster  /  Training  /  Attendance  /  Finance',21,MUTED)
 elif kind=='member':
  d.ellipse((30,151,99,220),fill=ORANGE);txt(d,(52,166),'J',34,WHITE,True)
  txt(d,(120,151),'Jamie Lee',31,INK,True);txt(d,(120,195),'U-16 Basketball  /  Coach Alex',20,MUTED);tag(d,850,171,'ACTIVE',size=15)
  data=[('Profile & team','Photo, contact and group'),('Schedule & training','Tuesday / 16:00 / Court 1'),('Attendance','12 present / 14 recorded'),('Dues & payments','Submission awaiting review')]
  for i,(a,b) in enumerate(data):
   x=30+i%2*505;y=257+i//2*127;rr(d,(x,y,x+475,y+105),'#fff',ORANGE if i==int(q*4)%4 else LINE,12);txt(d,(x+20,y+18),a,22,INK,True);txt(d,(x+20,y+59),b,18,MUTED)
  rr(d,(30,548,1010,595),INK,r=9);txt(d,(52,560),'Open source detail',19,WHITE,True);txt(d,(700,560),'Edit with your role',19,AMBER,True)
 elif kind=='roles':
  labels=[('01','SEND','Invite with ChatGPT email'),('02','ACCEPT','Single-use invitation'),('03','WORK','Role-specific workspace')]
  for i,(a,b,c) in enumerate(labels):
   x=30+i*337;rr(d,(x,163,x+315,352),'#fff',ORANGE if i==min(2,int(q*3)) else LINE,13);txt(d,(x+22,183),a,43,ORANGE,True);txt(d,(x+22,245),b,24,INK,True);para(d,x+22,290,c,280,18)
  for i,(a,b) in enumerate([('Owner / Admin','Operations & verification'),('Coach / Trainer','Assigned sessions & people'),('Member / Client','Their own activity & records')]):
   y=390+i*64;txt(d,(36,y),a,21,INK,True);txt(d,(440,y),b,20,MUTED);check(d,958,y)
 elif kind=='dues':
  for i,(a,b,c) in enumerate([('Outstanding','IDR 1,250,000','Pending and review'),('To verify','2 submissions','Check actual receipt'),('Reminder status','Configured','Stops after paid / decline')]):metric(d,30+i*337,153,315,a,b,c)
  row(d,30,309,980,'Jamie Lee','Monthly dues / Submitted reference CV-1042','Review',True)
  rr(d,(30,415,1010,583),INK,r=13);txt(d,(50,436),'VERIFY AGAINST YOUR ACTUAL RECEIPT',21,AMBER,True)
  para(d,50,479,'An administrator records approval. Bank settlement is not automatic.',920,22,'#ded6cd')
 elif kind=='offers':
  for i,num in enumerate([1,4,8,16]):
   x=30+i*253;rr(d,(x,159,x+231,400),INK if i==2 else '#fff',ORANGE if i==2 else LINE,13)
   txt(d,(x+22,185),f'{num:02}',69,ORANGE,True);txt(d,(x+22,285),'VISIT' if num==1 else 'SESSIONS',19,WHITE if i==2 else INK,True);txt(d,(x+22,344),'Single visit' if num==1 else 'Session pack',18,'#d3c9be' if i==2 else MUTED)
  section_title(d,30,437,'CLEAR TERMS BEFORE PAYMENT')
  for i,z in enumerate(['Price & validity','Cancellation window','No-show policy']):check(d,33+i*337,496);txt(d,(78+i*337,500),z,20,INK,True)
 elif kind=='credits':
  phase=0 if q<.36 else 1 if q<.66 else 2
  vals=[('8','0','0'),('7','1','0'),('7','0','1')][phase]
  tag(d,30,152,['PAYMENT VERIFIED','BOOKING CONFIRMED','SESSION COMPLETED'][phase],fill=INK,color=AMBER,size=18)
  for i,(label,value) in enumerate(zip(['AVAILABLE','RESERVED','USED'],vals)):metric(d,30+i*337,217,315,label,value,'8 purchased sessions')
  for i in range(8):
   x=32+i*123;fill=ORANGE if i<7 else INK if phase else ORANGE
   rr(d,(x,383,x+105,475),fill,r=12);txt(d,(x+34,407),str(i+1),31,WHITE,True)
  txt(d,(30,517),'Verify payment',24,INK,True);arrow(d,310,535);txt(d,(384,517),'Reserve one',24,INK,True);arrow(d,646,535);txt(d,(728,517),'Use once',24,INK,True)
  txt(d,(30,573),'Terms and expiry remain attached to the purchase.',17,MUTED)
 elif kind=='booking':
  for i,z in enumerate(['MON','TUE','WED','THU']):
   x=30+i*253;txt(d,(x+20,154),z,20,MUTED,True)
   rr(d,(x,200,x+232,552),'#fff',LINE,12)
   if i in [0,2]:
    rr(d,(x+12,224,x+220,366),'#fff0e5',ORANGE,9);txt(d,(x+25,240),'09:00 - 10:00',19,INK,True);txt(d,(x+25,284),'1:1 Strength',20,INK,True);txt(d,(x+25,323),'Jamie / Alex',17,MUTED)
   else:
    rr(d,(x+12,330,x+220,495),INK,r=9);txt(d,(x+25,348),'16:00 - 17:00',19,WHITE,True);txt(d,(x+25,391),'Group class',20,WHITE,True);txt(d,(x+25,437),'3 / 6 booked',18,AMBER)
  txt(d,(30,582),'Trainer availability / Capacity / Purchased booking terms',19,MUTED)
 elif kind=='progress':
  row(d,30,153,980,'Jamie Lee','Goal: build strength and train consistently','Active',True)
  for i,(a,b) in enumerate([('Completed','3 sessions'),('Available','5 credits'),('Reserved','1 session')]):metric(d,30+i*337,255,315,a,b)
  section_title(d,30,410,'RECENT SESSION / RECORDED PROGRESS')
  rr(d,(30,449,1010,586),'#fff',LINE,12);txt(d,(51,469),'Strength fundamentals / Completed',23,INK,True);para(d,51,512,'Technique improved. Next session: continue controlled progressions.',900,21)
 elif kind=='network':
  rr(d,(30,153,1010,258),INK,r=12);txt(d,(50,174),'HEAD OFFICE / ALL WORKSPACES',20,AMBER,True);txt(d,(50,212),'One place for oversight. Local records stay scoped.',22,WHITE)
  for i,(a,b,c) in enumerate([('Central club','128 members','6 groups'),('North branch','64 members','3 groups'),('Training studio','24 clients','8-session packs')]):
   x=30+i*337;rr(d,(x,307,x+315,557),'#fff',LINE,13);mark(d,x+22,330,46);txt(d,(x+22,402),a,24,INK,True);txt(d,(x+22,447),b,22,MUTED);txt(d,(x+22,495),c,18,ORANGE,True)
 elif kind=='closing':
  mark(d,409,151,212);txt(d,(291,391),'FIND YOUR WORKFLOW.',36,INK,True)
  tag(d,265,475,'CLUB MANAGEMENT',fill=INK,color=WHITE,size=17);tag(d,526,475,'PERSONAL TRAINING',fill=ORANGE,color=WHITE,size=17)
  txt(d,(310,553),'Explore the interactive demo',24,MUTED)
 return im

photos={
 'basketball':Image.open(OUT/'source/basketball.jpg').convert('RGB'),
 'training':Image.open(OUT/'source/training.jpg').convert('RGB'),
 'track':Image.open(ROOT/'public/courvix-track.webp').convert('RGB')
}
def backdrop(sport,w,h,paper=False):
 if paper:
  im=Image.new('RGB',(w+100,h),PAPER);d=ImageDraw.Draw(im)
  for x in range(0,w+100,100):d.line((x,0,x,h),fill='#e8e1d8')
  for y in range(0,h,100):d.line((0,y,w+100,y),fill='#e8e1d8')
  d.arc((w*.15,h*.1,w*1.15,h*1.8),180,345,fill='#e0d4c6',width=3)
  return im
 im=ImageOps.fit(photos[sport],(w+100,h),method=Image.Resampling.LANCZOS)
 im=ImageEnhance.Color(im).enhance(.12);im=Image.blend(im,Image.new('RGB',im.size,'#100d0b'),.42)
 # A dark readability gradient retains the athletic image across the scene.
 mask=np.zeros((h,w+100),dtype=np.uint8)
 xx=np.arange(w+100)/(w+100)
 mask[:]=np.clip(120-60*np.sin(xx*np.pi),30,140).astype(np.uint8)
 shade=Image.new('RGB',im.size,'#100e0d');return Image.composite(shade,im,Image.fromarray(mask))

def timeline(story):
 allclips=[];cursor=0
 for scene in story:
  scene['start']=cursor;local=.65
  for clip in scene['clips']:
   clip['start']=cursor+local
   allclips.append(clip)
   local+=clip['duration']+.18
  cursor+=scene['duration']
 return allclips,cursor

def cues(clips,vertical=False):
 result=[]
 for clip in clips:
  words=clip['text'].split();limit=20 if vertical else 14
  count=math.ceil(len(words)/limit);chunks=[]
  for i in range(count):
   a=round(i*len(words)/count);b=round((i+1)*len(words)/count)
   chunks.append(' '.join(words[a:b]))
  elapsed=0
  for c in chunks:
   dur=clip['duration']*len(c.split())/len(words)
   result.append((clip['start']+elapsed,clip['start']+elapsed+dur,c));elapsed+=dur
 return result

def captions(im,subtitle,vertical):
 if not subtitle:return
 d=ImageDraw.Draw(im);w,h=im.size;size=31 if vertical else 29
 lines=wrap(d,subtitle,w-180,size)
 top=h-(220 if vertical else 199)
 height=30+len(lines)*42
 rr(d,(62,top,w-62,top+height),'#151311',r=12)
 d.rounded_rectangle((62,top,68,top+height),radius=3,fill=ORANGE)
 for i,line in enumerate(lines):
  tw=d.textlength(line,font=font(size));txt(d,((w-tw)/2,top+13+i*42),line,size,WHITE)

def ease(t):return 1-(1-max(0,min(1,t)))**3

PANEL_CACHE={}
SHADOW=Image.new('RGBA',(1120,710));rr(ImageDraw.Draw(SHADOW),(40,32,1080,662),(0,0,0,85),r=25);SHADOW=SHADOW.filter(ImageFilter.GaussianBlur(17))
def cached_panel(kind,t,duration):
 q=t/duration
 phase=min(3,int(q*4)) if kind=='member' else min(2,int(q*3)) if kind=='roles' else (0 if q<.36 else 1 if q<.66 else 2) if kind=='credits' else 0
 key=(kind,phase)
 if key not in PANEL_CACHE:
  sample=(phase+.3)/4 if kind=='member' else (phase+.3)/3 if kind=='roles' else [.1,.5,.8][phase] if kind=='credits' else .5
  PANEL_CACHE[key]=panel(kind,sample,1)
 return PANEL_CACHE[key].copy()
def frame(scene,t,index,count,elapsed,total,bg,vertical=False,subtitle=''):
 w,h=(1080,1350) if vertical else (1920,1080);q=t/scene['duration'];paper=scene['kind'] in ['products','credits','network'] and not vertical
 offset=int(45+40*math.sin(q*.8+index));im=bg.crop((offset,0,offset+w,h));d=ImageDraw.Draw(im)
 # Fine animated sport route: a court line becomes the connected workflow.
 route='#d9b798' if paper else '#6a4732'
 bx=w*.72;by=h*.45;radius=220 if vertical else 400
 d.arc((bx-radius,by-radius,bx+radius,by+radius),205,335,fill=route,width=2)
 angle=math.radians(205+130*q);xx=bx+radius*math.cos(angle);yy=by+radius*math.sin(angle)
 d.ellipse((xx-6,yy-6,xx+6,yy+6),fill=ORANGE)
 color=INK if paper else WHITE
 if not vertical:
  logo(d,76,52,45);txt(d,(1450,66),'PRODUCT WALKTHROUGH',16,MUTED if paper else '#c9bfb4',True)
  txt(d,(1740,62),f'{index+1:02} / {count:02}',21,ORANGE,True)
  rail=1768/count
  for i in range(count):d.rectangle((76+i*rail,128,76+(i+1)*rail-7,131),fill=ORANGE if i<=index else '#cfc4b7' if paper else '#4e4035')
  txt(d,(78,191),scene['label'],15,ORANGE,True)
  title_y=256+int(20*(1-ease(t/.65)))
  for j,line in enumerate(scene['title']):
   sz=min(75,int(620/max(1,ImageDraw.Draw(im).textlength(line,font=font(75,True)))*75))
   sz=min(75,max(48,sz));txt(d,(72,title_y+j*92),line,sz,ORANGE if j==len(scene['title'])-1 else color,True)
  # Large scene number and action stripe echo competition bibs and scoreboards.
  txt(d,(78,613),f'{index+1:02}',91,'#d9cabc' if paper else '#887462',True)
  d.line((80,742,620,742),fill=ORANGE,width=3)
  txt(d,(80,767),'CLUB MANAGEMENT' if scene['kind'] in ['club','member','dues'] else 'PERSONAL TRAINING' if scene['kind'] in ['offers','credits','booking','progress'] else 'THE SYSTEM BEHIND EVERY SESSION',16,MUTED if paper else '#d8cbbd',True)
  if scene['kind']=='credits':
   phase=2 if t>=scene['clips'][2]['start']-scene['start'] else 1 if t>=scene['clips'][1]['start']-scene['start'] else 0
   p=cached_panel('credits',[.1,.5,.8][phase],1)
  else:p=cached_panel(scene['kind'],t,scene['duration'])
  entrance=ease((t-.2)/.7)
  py=209+int((1-entrance)*65)+int(math.sin(q*math.pi)*-5)
  im=im.convert('RGBA');im.alpha_composite(SHADOW,(738,py-10))
  if entrance<1:p.putalpha(int(255*entrance))
  im.alpha_composite(p,(778,py));im=im.convert('RGB');d=ImageDraw.Draw(im)
  # Intentional reveal marker, not a simulated click or a claim of screen capture.
  if 1.3<t<3.1:
   r=12+int((t-1.3)*18);d.ellipse((1813-r,py+105-r,1813+r,py+105+r),outline=ORANGE,width=2)
  txt(d,(78,1023),'ILLUSTRATIVE PRODUCT TOUR  /  SAMPLE RECORDS',14,MUTED if paper else '#c8b9a9')
  txt(d,(1395,1023),'ENGLISH AI NARRATION + CAPTIONS',14,MUTED if paper else '#c8b9a9')
  d.rectangle((78,1062,78+int(1760*elapsed/total),1066),fill=ORANGE)
 else:
  logo(d,70,58,48);tag(d,826,65,f'{index+1:02} / {count:02}',fill='#211a15',color=AMBER,size=17)
  txt(d,(74,156),scene['label'],16,AMBER,True)
  for j,line in enumerate(scene['title']):
   size=81
   while d.textlength(line,font=font(size,True))>944:size-=1
   txt(d,(68,209+j*96+int(18*(1-ease(t/.5)))),line,size,ORANGE if j==1 else WHITE,True)
  # Compact content designed for 4:5, rather than cropping the landscape film.
  y=567+int(30*(1-ease((t-.25)/.6)))
  if scene['kind']=='products':
   for i,(a,b,c) in enumerate([('01','CLUB MANAGEMENT','Members / Teams / Dues'),('02','PERSONAL TRAINING','Clients / Packs / Bookings')]):
    rr(d,(72,y+i*185,1008,y+158+i*185),PAPER,r=17);txt(d,(98,y+26+i*185),a,54,ORANGE,True);txt(d,(202,y+30+i*185),b,28,INK,True);txt(d,(202,y+84+i*185),c,24,MUTED)
  elif scene['kind']=='closing':
   rr(d,(72,y,1008,y+365),ORANGE,r=20);mark(d,110,y+66,210,WHITE);txt(d,(370,y+92),'COURVIX',68,WHITE,True);txt(d,(374,y+194),'Explore the demo',32,WHITE)
  else:
   rr(d,(72,y,1008,y+365),PAPER,r=20)
   title='YOUR CONTROL ROOM' if scene['kind']=='club' else 'THE WORK BEHIND THE SESSION' if scene['kind']=='opening' else 'A CLEARER NEXT STEP'
   txt(d,(100,y+26),title,25,INK,True);d.line((100,y+82,980,y+82),fill=LINE,width=2)
   items=[('People','Profiles & role access'),('Sessions','Schedules & bookings'),('Payments','Reviews & session credits')]
   for i,(a,b) in enumerate(items):
    yy=y+110+i*78;check(d,103,yy+2);txt(d,(154,yy-2),a,28,INK,True);txt(d,(455,yy+1),b,24,MUTED)
  txt(d,(75,976),'BUILT FOR SPORT. DESIGNED FOR MANAGEMENT.',17,AMBER,True)
  txt(d,(74,1270),'COURVIX / ENGLISH AI NARRATION / SAMPLE RECORDS',14,'#d4c1ad')
  d.rectangle((73,1315,73+int(934*elapsed/total),1320),fill=ORANGE)
 captions(im,subtitle,vertical)
 return im

def audio_mix(scenes,clips,total,product):
 n=round(total*RATE);time=np.arange(n,dtype=np.float32)/RATE
 voice=np.zeros(n,dtype=np.float32)
 for c in clips:
  with wave.open(str(ROOT/c['file']),'rb') as f:a=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(np.float32)/32768
  a=a/(max(.15,float(np.max(np.abs(a)))))*.66
  start=round(c['start']*RATE);end=min(n,start+len(a));voice[start:end]+=a[:end-start]
 # Original low-key electro/percussion bed. No third-party samples or music.
 music=np.zeros(n,dtype=np.float32);beat=60/108;rng=np.random.default_rng(812)
 for k,sec in enumerate(np.arange(0,total,beat/2)):
  start=round(sec*RATE);length=min(n-start,round(.19*RATE));u=np.arange(length)/RATE
  if k%2==0:music[start:start+length]+=.06*np.sin(2*np.pi*(49*u+2.5*(1-np.exp(-u*30))))*np.exp(-u*24)
  length=min(n-start,round(.07*RATE));u=np.arange(length)/RATE;noise=rng.normal(size=length);noise=np.diff(noise,prepend=0)
  music[start:start+length]+=.009*noise*np.exp(-u*70)
  if k%4==2:
   length=min(n-start,round(.14*RATE));u=np.arange(length)/RATE
   music[start:start+length]+=.018*rng.normal(size=length)*np.exp(-u*42)
  if k%4==0:
   length=min(n-start,round(.6*RATE));u=np.arange(length)/RATE;freq=[110,130.8128,164.8138,146.8324][(k//16)%4]
   music[start:start+length]+=.025*(np.sin(2*np.pi*freq*u)+.3*np.sin(2*np.pi*freq*2*u))*np.exp(-u*7)
 # A measured duck envelope keeps narration in front of the rhythm.
 window=1200;blocks=int(math.ceil(n/window));env=np.array([np.sqrt(np.mean(voice[i*window:min(n,(i+1)*window)]**2)) for i in range(blocks)])
 duck=np.repeat(np.where(env>.015,.25,.65),window)[:n];music*=duck
 music*=np.minimum(1,time/.8)*np.minimum(1,(total-time)/1.2)
 sfx=np.zeros((n,2),dtype=np.float32)
 for scene in scenes:
  # Transition whoosh: short filtered noise sweep, stereo left-to-right.
  sec=scene['start'];a=max(0,round((sec-.12)*RATE));length=min(n-a,round(.42*RATE));u=np.arange(length)/RATE
  noise=rng.normal(size=length);filtered=np.convolve(noise,np.ones(5)/5,mode='same')
  shape=np.sin(np.pi*np.linspace(0,1,length))**2;sig=.065*filtered*shape
  pan=np.linspace(0,1,length);sfx[a:a+length,0]+=sig*(1-pan);sfx[a:a+length,1]+=sig*pan
  # Sport-inspired ball impact / soft UI confirmation at the reveal.
  a=round((sec+.9)*RATE);length=min(n-a,round(.20*RATE));u=np.arange(length)/RATE
  bounce=.065*np.sin(2*np.pi*(86*u+1.8*(1-np.exp(-u*45))))*np.exp(-u*30)
  sfx[a:a+length,:]+=bounce[:,None]
  for c in scene['clips'][1:]:
   a=round((c['start']-.10)*RATE);length=min(n-a,round(.05*RATE));u=np.arange(length)/RATE
   click=.022*np.sin(2*np.pi*960*u)*np.exp(-u*95)
   sfx[a:a+length,:]+=click[:,None]
 mixed=(voice+music)[:,None]+sfx
 output=WORK/(product+'-mix.wav')
 with wave.open(str(output),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE);f.writeframes((np.clip(mixed,-.97,.97)*32767).astype('<i2').tobytes())
 return output

def stamp(s):
 ms=round(s*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
def render(story,product,stills=False):
 scenes=story[product];vertical=product=='teaser';w,h=(1080,1350) if vertical else (1920,1080)
 clips,total=timeline(scenes);subs=cues(clips,vertical)
 name='courvix-teaser-4x5.mp4' if vertical else 'courvix-product-demo.mp4'
 if stills:
  for i,s in enumerate(scenes):
   paper=s['kind'] in ['products','credits','network'] and not vertical;bg=backdrop(s['sport'],w,h,paper)
   local=min(s['duration']*.45,4);ts=s['start']+local;cap=next((c for a,b,c in subs if a<=ts<b),'')
   frame(s,local,i,len(scenes),ts,total,bg,vertical,cap).save(WORK/(product+'-'+s['id']+'.jpg'),quality=92)
  return
 audio=audio_mix(scenes,clips,total,product);output=WORK/name;master=WORK/(product+'-master.mp4')
 proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(FPS),'-i','-','-i',str(audio),'-c:v','libx264','-preset','fast','-crf','21','-threads','2','-pix_fmt','yuv420p','-af','loudnorm=I=-16:TP=-1.5:LRA=7','-ar','48000','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',str(master)],stdin=subprocess.PIPE)
 previous=None
 try:
  for i,s in enumerate(scenes):
   print('RENDER',product,i+1,s['id'],s['duration'],flush=True)
   bg=backdrop(s['sport'],w,h,s['kind'] in ['products','credits','network'] and not vertical)
   for j in range(round(s['duration']*FPS)):
    local=j/FPS;ts=s['start']+local;cap=next((c for a,b,c in subs if a<=ts<b),'')
    im=frame(s,local,i,len(scenes),ts,total,bg,vertical,cap)
    if previous is not None and local<.26:
     # Match-cut with a travelling orange seam; the UI remains readable after .26s.
     progress=ease(local/.26);old=previous.copy();cut=int(w*progress);old.paste(im.crop((0,0,cut,h)),(0,0));dd=ImageDraw.Draw(old);dd.rectangle((cut-7,0,cut+2,h),fill=ORANGE);im=old
    if i==0 and local<.18:im=Image.blend(Image.new('RGB',im.size,INK),im,local/.18)
    if j==FPS*3:
     im.save(WORK/(product+'-'+s['id']+'.jpg'),quality=92)
     if i==0:im.save(OUT/('courvix-teaser-poster.jpg' if vertical else 'courvix-demo-poster.jpg'),quality=93)
    previous_frame=im
    proc.stdin.write(im.tobytes())
   previous=previous_frame
  proc.stdin.close();assert proc.wait()==0
 except BaseException:
  proc.kill();raise
 if master.stat().st_size<=23*1024*1024:shutil.copy2(master,output)
 else:
  rate=min(1800,int(22e6*8/total/1000-140))
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(master),'-c:v','libx264','-preset','slow','-crf','23','-maxrate',str(rate)+'k','-bufsize',str(rate*2)+'k','-threads','2','-c:a','aac','-b:a','128k','-movflags','+faststart',str(output)],check=True)
 assert output.stat().st_size<25*1024*1024,'Static media exceeds asset size limit'
 dest=Path('/workspace/outputs/courvix');dest.mkdir(parents=True,exist_ok=True)
 shutil.copy2(master,dest/('courvix-teaser-4x5-master.mp4' if vertical else 'courvix-product-demo-master.mp4'))
 shutil.copy2(output,OUT/name)
 vtt=['WEBVTT','']
 for i,(a,b,c) in enumerate(subs):vtt += [str(i+1),stamp(a)+' --> '+stamp(b),c,'']
 caption_file='courvix-teaser-captions.vtt' if vertical else 'courvix-demo-captions.vtt'
 (OUT/caption_file).write_text('\n'.join(vtt).rstrip()+'\n')
 return {'file':name,'duration':round(total,3),'width':w,'height':h,'aspect_ratio':'4:5' if vertical else '16:9','captions':caption_file,'chapters':[{'start':round(s['start'],3),'title':s.get('chapter',s['id'])} for s in scenes]}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--stills',action='store_true');parser.add_argument('--product',choices=['demo','teaser','both'],default='both');args=parser.parse_args()
 story=json.loads((WORK/'timed-storyboard.json').read_text())
 results=[]
 for p in ['demo','teaser']:
  if args.product in [p,'both']:results.append(render(story,p,args.stills))
 if not args.stills and args.product=='both':
  metadata={'revision':2,'concept':story['concept'],'format':'H.264 / AAC','fps':FPS,'primary_color':ORANGE,'audio':'English synthetic neural narration, original instrumental score and original sound effects','voice':story['voice'],'language':'English','records':'Illustrative sample records; not a screen recording or customer footage','videos':results}
  (OUT/'media-manifest.json').write_text(json.dumps(metadata,indent=2)+'\n')
  shutil.copy2(OUT/'courvix-teaser-4x5.mp4',OUT/'courvix-teaser-vertical.mp4')
  dest=Path('/workspace/outputs/courvix');dest.mkdir(parents=True,exist_ok=True)
  for p in OUT.iterdir():
   if p.is_file():shutil.copy2(p,dest/p.name)
  print(json.dumps(metadata),flush=True)
