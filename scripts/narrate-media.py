"""Generate English neural narration locally. Models stay in ignored work/.
Setup and model/license URLs: docs/MEDIA-KIT.md. No cloned or named-person voice.
"""
from pathlib import Path
import json, wave, hashlib, numpy as np
import onnxruntime as rt
from kokoro_onnx import Kokoro
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'work/media-v2'; WORK.mkdir(parents=True,exist_ok=True)
story=json.loads((ROOT/'scripts/media-storyboard.json').read_text())
opts=rt.SessionOptions();opts.intra_op_num_threads=2;opts.inter_op_num_threads=1
session=rt.InferenceSession(str(ROOT/'work/media-models/kokoro-v1.0.int8.onnx'),sess_options=opts,providers=['CPUExecutionProvider'])
engine=Kokoro.from_session(session,str(ROOT/'work/media-models/voices-v1.0.bin'))
rate=24000
for product in ['demo','teaser']:
 for scene in story[product]:
  clips=[]
  for i,line in enumerate(scene['lines']):
   # Pronunciation guide affects speech only; captions keep the Courvix spelling.
   spoken=line.replace('Courvix','Core vix').replace('ChatGPT','Chat G P T')
   key=hashlib.sha256((spoken+story['voice']+str(story['speed'])).encode()).hexdigest()[:12]
   p=WORK/(key+'.wav')
   if not p.exists():
    samples,sr=engine.create(spoken,voice=story['voice'],speed=story['speed'],lang='en-us')
    assert sr==rate
    with wave.open(str(p),'wb') as f:
     f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())
   with wave.open(str(p),'rb') as f: duration=f.getnframes()/f.getframerate()
   clips.append({'file':str(p.relative_to(ROOT)),'duration':duration,'text':line})
   print(product,scene['id'],i+1,round(duration,2),flush=True)
  scene['clips']=clips
  scene['duration']=round((.65+sum(c['duration']+.18 for c in clips)+.65)*30)/30
(WORK/'timed-storyboard.json').write_text(json.dumps(story,indent=2)+'\n')
script=['COURVIX — THE SYSTEM BEHIND EVERY SESSION','English narration scripts / Revision 2','']
for product in ['demo','teaser']:
 script += [product.upper(),'']
 for i,scene in enumerate(story[product]):script += [str(i+1)+'. '+scene.get('chapter',scene['id']).upper(),' '.join(scene['lines']),'']
(ROOT/'public/media/courvix-video-scripts.txt').write_text('\n'.join(script)+'\n')
print('TOTALS',[(p,round(sum(s['duration'] for s in story[p]),2)) for p in ['demo','teaser']],flush=True)
