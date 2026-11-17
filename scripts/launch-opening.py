"""Render the 17-second 4K opening concept only. This is not the completed 85s ad.
Uses licensed Pexels source footage, original title graphics and prepared audio.
"""
from pathlib import Path
import subprocess
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'work/launch-v1';OUT=Path('/workspace/outputs/courvix/launch-production')
f=TTFont(ROOT/'public/fonts/inter-variable.woff');f.flavor=None;f=instantiateVariableFont(f,{'opsz':32,'wght':760});f.save(WORK/'inter-bold.ttf')
f=TTFont(ROOT/'public/fonts/inter-variable.woff');f.flavor=None;f=instantiateVariableFont(f,{'opsz':24,'wght':470});f.save(WORK/'inter-regular.ttf')
for name,text in [('a','THE WORK BEHIND'),('b','EVERY GREAT GAME.'),('c','TEAMS. SESSIONS.'),('d','PAYMENTS.'),('e','WHEN EVERYTHING'),('f','FEELS SCATTERED.'),('brand','COURVIX'),('tasks','People  /  Training  /  Payment records')]: (WORK/(name+'.txt')).write_text(text)
base='scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,fps=30,setsar=1,eq=contrast=1.04:saturation=0.75:brightness=-0.07,colorbalance=rs=0.025:bs=-0.015'
filters=[f'[0:v]trim=start=0:end=4.4,setpts=PTS-STARTPTS,{base}[a]',f'[1:v]trim=start=0.4:end=5,setpts=PTS-STARTPTS,{base}[b]',f'[0:v]trim=start=7:end=15,setpts=PTS-STARTPTS,{base}[c]','[a][b][c]concat=n=3:v=1:a=0,drawbox=x=0:y=0:w=iw:h=ih:color=black@0.19:t=fill[v0]']
current='v0';i=0
for text,x,y,size,color,enable in [('brand',160,140,66,'0xff641a','1'),('a',160,620,112,'white','lt(t,4.4)'),('b',160,770,128,'0xff641a','lt(t,4.4)'),('c',160,620,112,'white','between(t,4.4,9)'),('d',160,770,128,'0xff641a','between(t,4.4,9)'),('e',160,620,112,'white','gte(t,9)'),('f',160,770,128,'0xff641a','gte(t,9)'),('tasks',164,1830,43,'white','gte(t,9)')]:
 i+=1;following='v'+str(i);filters.append(f"[{current}]drawtext=fontfile={WORK/'inter-bold.ttf'}:textfile={WORK/(text+'.txt')}:x={x}:y={y}:fontsize={size}:fontcolor={color}:shadowcolor=black@0.35:shadowx=2:shadowy=3:enable='{enable}'[{following}]");current=following
filters.append(f'[{current}]fade=t=in:st=0:d=0.35,fade=t=out:st=16.7:d=0.3[video]')
filters.append('[2:a]atrim=0:17,asetpts=PTS-STARTPTS,afade=t=out:st=16.7:d=0.3[audio]')
cmd=['ffmpeg','-v','error','-y','-i',str(WORK/'footage/basketball-coach.mp4'),'-i',str(WORK/'footage/personal-trainer.mp4'),'-i',str(OUT/'COURVIX-launch-mix.wav'),'-filter_complex',';'.join(filters),'-map','[video]','-map','[audio]','-t','17','-c:v','libx264','-preset','fast','-crf','21','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(OUT/'COURVIX-launch-opening-CONCEPT-4K.mp4')]
subprocess.run(cmd,check=True);print('Rendered 17-second opening concept, not the complete launch film.',flush=True)
