"""Prepare clearly labelled production-only screen placeholders and edit documents.
Final footage must use actual Courvix captures; this script does not invent UI.
"""
from pathlib import Path
import importlib.util,json,csv,shutil
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/workspace/outputs/courvix/launch-production');OUT.mkdir(parents=True,exist_ok=True)
WORK=ROOT/'work/launch-v1/placeholders';WORK.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('courvix_media',ROOT/'scripts/render-media.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
for name,w,h in [('desktop',1920,1080),('tablet',1280,960),('mobile',780,1688)]:
 im=Image.new('RGB',(w,h),'#191817');d=ImageDraw.Draw(im);sz=int(min(w,h)*.29);m.mark(d,(w-sz)/2,h*.18,sz)
 text='COURVIX';fs=int(min(w*.09,h*.12));tw=d.textlength(text,font=m.font(fs,True));m.txt(d,((w-tw)/2,h*.18+sz+50),text,fs,m.WHITE,True)
 for j,text in enumerate(['ACTUAL APP CAPTURE','REQUIRED FOR FINAL FILM']):
  fs=int(w*.026);tw=d.textlength(text,font=m.font(fs,True));m.txt(d,((w-tw)/2,h*.75+j*fs*1.6),text,fs,'#ac9f92',True)
 im.save(WORK/(name+'.png'))
s=json.loads((ROOT/'docs/launch/storyboard.json').read_text());lines=[s['title'],'85-second launch film / English narration','']
for shot in s['shots']:lines += [f"{shot['start']:02}–{shot['start']+shot['duration']:02} seconds | {shot['emotion']} | {shot['headline']}",shot['narration'],'']
(OUT/'COURVIX-launch-script.txt').write_text('\n'.join(lines)+'\n')
for name in ['PRODUCTION.md','storyboard.json','footage-sources.json']:shutil.copy2(ROOT/'docs/launch'/name,OUT/name)
with (OUT/'COURVIX-launch-shot-list.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['start','duration','emotion','headline','narration','screen','camera','sound'])
 for shot in s['shots']:w.writerow([shot[k] for k in ['start','duration','emotion','headline','narration','screen','camera','sound']])
print('Prepared launch proof placeholders and edit documents; actual UI captures remain required.')
