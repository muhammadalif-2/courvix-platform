"""Prepare the 85-second launch film's English narration and original audio stems.
Final picture composites await actual UI captures. No human voice clone is used.
"""
from pathlib import Path
import json, wave, math, hashlib, subprocess
import numpy as np
import onnxruntime as rt
from kokoro_onnx import Kokoro
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'work/launch-v1';WORK.mkdir(parents=True,exist_ok=True)
OUT=Path('/workspace/outputs/courvix/launch-production');OUT.mkdir(parents=True,exist_ok=True)
s=json.loads((ROOT/'docs/launch/storyboard.json').read_text());rate=24000;length=s['duration']*rate
opts=rt.SessionOptions();opts.intra_op_num_threads=2;opts.inter_op_num_threads=1
sess=rt.InferenceSession(str(ROOT/'work/media-models/kokoro-v1.0.int8.onnx'),sess_options=opts,providers=['CPUExecutionProvider'])
engine=Kokoro.from_session(sess,str(ROOT/'work/media-models/voices-v1.0.bin'))
def save(path,samples):
 with wave.open(str(path),'wb') as f:
  f.setnchannels(1 if samples.ndim==1 else samples.shape[1]);f.setsampwidth(2);f.setframerate(rate);f.writeframes((np.clip(samples,-.98,.98)*32767).astype('<i2').tobytes())
voice=np.zeros(length,dtype=np.float32);timing=[]
for shot in s['shots']:
 spoken=shot['narration'].replace('Courvix','Core vix')
 key=hashlib.sha256((spoken+s['voice']+str(s['speed'])).encode()).hexdigest()[:12];p=WORK/(key+'.wav')
 if not p.exists():
  a,sr=engine.create(spoken,voice=s['voice'],speed=s['speed'],lang='en-us');assert sr==rate;save(p,a)
 with wave.open(str(p),'rb') as f:a=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(np.float32)/32768
 natural=len(a)/rate;available=shot['duration']-1.1;factor=max(1,natural/available)
 if factor>1.30:raise ValueError('Rewrite this shot; narration is too long: '+shot['id'])
 if factor>1:
  data=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-af','atempo='+str(factor),'-ar',str(rate),'-f','f32le','-'])
  a=np.frombuffer(data,dtype='<f4').copy()
 a=a/max(.15,float(np.max(np.abs(a))))*.65
 at=round((shot['start']+.5)*rate);end=min(length,at+len(a));voice[at:end]=a[:end-at]
 timing.append({'id':shot['id'],'start':shot['start']+.5,'end':end/rate,'text':shot['narration'],'tempo':round(factor,3)})
 print(shot['id'],'voice',round(natural,2),'tempo',round(factor,3),flush=True)
time=np.arange(length,dtype=np.float32)/rate;music=np.zeros(length,dtype=np.float32);rng=np.random.default_rng(218)
# Original warm harmonic bed: minor tension opens into a major progression.
for start,notes in [(0,[146.83,174.61,220]),(9,[130.81,164.81,196]),(17,[174.61,220,261.63]),(25,[174.61,220,261.63]),(35,[146.83,174.61,220]),(45,[130.81,164.81,196]),(55,[174.61,220,261.63]),(65,[196,246.94,293.66]),(75,[174.61,220,261.63])]:
 dur=min(10,s['duration']-start);n=round(dur*rate);u=np.arange(n)/rate;envelope=np.minimum(1,u/1.4)*np.minimum(1,(dur-u)/1.8)
 pad=sum(np.sin(2*np.pi*f*u)+.16*np.sin(2*np.pi*f*2.001*u) for f in notes)/len(notes)
 music[start*rate:start*rate+n]+=(.022 if start<17 else .032)*pad*envelope
 # Harmonic piano-like attacks, created from damped partials.
 for offset,freq in enumerate(notes):
  at=round((start+.8+offset*.34)*rate);n=min(length-at,rate*2);u=np.arange(n)/rate
  piano=sum(np.sin(2*np.pi*freq*(k+1)*u)*np.exp(-u*(2.5+k*.9))/(k+1)**1.7 for k in range(5))
  music[at:at+n]+=.018*piano*np.minimum(1,u/.012)
beat=60/108
for i,start in enumerate(np.arange(0,s['duration'],beat/2)):
 at=round(start*rate);n=min(length-at,round(.2*rate));u=np.arange(n)/rate
 energy=.14 if start<17 else .4 if start<25 else .7 if start<55 else .9 if start<75 else .6
 if i%2==0:music[at:at+n]+=.06*energy*np.sin(2*np.pi*(48*u+1.8*(1-np.exp(-u*30))))*np.exp(-u*23)
 if start>=25:
  n=min(length-at,round(.065*rate));u=np.arange(n)/rate;noise=rng.normal(size=n);noise=np.diff(noise,prepend=0)
  music[at:at+n]+=.008*energy*noise*np.exp(-u*80)
  if i%4==2:
   n=min(length-at,round(.12*rate));u=np.arange(n)/rate;music[at:at+n]+=.014*energy*rng.normal(size=n)*np.exp(-u*40)
# A low stadium-like air texture is synthesized, not a sampled crowd.
noise=rng.normal(size=length);air=np.convolve(noise,np.ones(100)/100,mode='same')*.008;music+=air
music*=np.minimum(1,time/1.2)*np.minimum(1,(s['duration']-time)/1.5)
window=1200;env=np.repeat([np.sqrt(np.mean(voice[i:i+window]**2)) for i in range(0,length,window)],window)[:length]
music*=np.where(env>.014,.27,.8)
sfx=np.zeros((length,2),dtype=np.float32)
for shot in s['shots'][1:]:
 at=round((shot['start']-.18)*rate);n=min(length-at,round(.48*rate));u=np.linspace(0,1,n)
 sig=.07*np.convolve(rng.normal(size=n),np.ones(6)/6,mode='same')*np.sin(np.pi*u)**2
 sfx[at:at+n,0]+=sig*(1-u);sfx[at:at+n,1]+=sig*u
 at=round((shot['start']+.1)*rate);n=min(length-at,round(.23*rate));u=np.arange(n)/rate
 impact=.055*np.sin(2*np.pi*(53*u+2*(1-np.exp(-u*35))))*np.exp(-u*20)
 sfx[at:at+n]+=impact[:,None]
for sec in [29,33,39,49,53,59,68,72]:
 at=round(sec*rate);n=round(.055*rate);u=np.arange(n)/rate
 tick=.023*np.sin(2*np.pi*1100*u)*np.exp(-u*90);sfx[at:at+n]+=tick[:,None]
# Original three-note sonic mark at the final Courvix reveal.
for j,freq in enumerate([523.25,659.25,783.99]):
 at=round((77.6+j*.18)*rate);n=min(length-at,round(2.1*rate));u=np.arange(n)/rate
 chime=.05*(np.sin(2*np.pi*freq*u)+.15*np.sin(2*np.pi*freq*3*u))*np.exp(-u*2.8)*np.minimum(1,u/.01)
 sfx[at:at+n]+=chime[:,None]
score=np.column_stack((music,music*.97));mix=voice[:,None]+score+sfx
save(OUT/'COURVIX-launch-narration.wav',voice);save(OUT/'COURVIX-launch-score.wav',score);save(OUT/'COURVIX-launch-sound-effects.wav',sfx);save(WORK/'mix.wav',mix)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'mix.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=7','-ar','48000',str(OUT/'COURVIX-launch-mix.wav')],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(OUT/'COURVIX-launch-mix.wav'),'-c:a','libmp3lame','-b:a','192k',str(OUT/'COURVIX-launch-audio-preview.mp3')],check=True)
(OUT/'narration-timing.json').write_text(json.dumps(timing,indent=2)+'\n')
print('Prepared 85-second launch audio and original stems.',flush=True)
