"""Blender 4.3 production device rig. Run: blender -b -t 2 -P scripts/launch-devices.py
Actual app captures can be supplied in work/launch-v1/captures/. Blank branded
screens are clearly marked when captures are missing; proofs are not final ads.
"""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/workspace/outputs/courvix/launch-production');OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color,metal=0,rough=.3):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
metal=material('Graphite anodized metal',(.09,.085,.08),.8,.25);edge=material('Edge highlight',(.24,.23,.22),.85,.23);black=material('Black glass bezel',(.008,.009,.01),.15,.12);rubber=material('Keyboard and feet',(.018,.017,.016),.03,.36);floor=material('Charcoal studio',(.024,.021,.019),.15,.35)
def box(name,loc,dim,mat,bevel=.05,parent=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  b=o.modifiers.new('Precision rounded edge','BEVEL');b.width=bevel;b.segments=5
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 o.data.materials.append(mat)
 if parent:o.parent=parent
 return o
def root(name,location,rotation=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=location;o.rotation_euler=rotation;return o
def screen(name,parent,width,height,centerz,y,capture,fallback):
 path=ROOT/'work/launch-v1/captures'/capture
 if not path.exists():path=ROOT/'work/launch-v1/placeholders'/fallback
 image=bpy.data.images.load(str(path),check_existing=True)
 # Image fit is preserved with UV letterboxing instead of stretching product UI.
 mat=bpy.data.materials.new(name+' image');mat.use_nodes=True;nodes=mat.node_tree.nodes;links=mat.node_tree.links
 bsdf=nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.16;bsdf.inputs['Metallic'].default_value=.0
 tex=nodes.new('ShaderNodeTexImage');tex.image=image;links.new(tex.outputs['Color'],bsdf.inputs['Base Color']);links.new(tex.outputs['Color'],bsdf.inputs['Emission Color']);bsdf.inputs['Emission Strength'].default_value=.55
 vertices=[(-width/2,y,centerz-height/2),(width/2,y,centerz-height/2),(width/2,y,centerz+height/2),(-width/2,y,centerz+height/2)]
 mesh=bpy.data.meshes.new(name+' mesh');mesh.from_pydata(vertices,[],[(0,1,2,3)]);mesh.uv_layers.new(name='UVMap')
 ratio=image.size[0]/image.size[1];target=width/height
 sx=max(1,target/ratio);sy=max(1,ratio/target)
 for i,uv in enumerate([(0,0),(1,0),(1,1),(0,1)]):mesh.uv_layers.active.data[i].uv=((uv[0]-.5)*sx+.5,(uv[1]-.5)*sy+.5)
 tex.extension='CLIP';o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(mat)
 return o
laptop=root('Laptop',(0,.1,0),(0,0,math.radians(-7)))
box('Laptop lower shell',(0,0,.12),(3.6,2.4,.18),edge,.065,laptop);box('Laptop deck',(0,0,.22),(3.55,2.35,.04),metal,.035,laptop)
box('Trackpad',(0,-.72,.248),(1.1,.58,.012),edge,.04,laptop)
for row in range(4):
 for col in range(12):box('Key %s %s'%(row,col),(-1.48+col*.267,.07+row*.20,.26),(.235,.17,.025),rubber,.018,laptop)
box('Spacebar',(0,-.16,.26),(1.22,.16,.025),rubber,.015,laptop)
for x in [-1.2,1.2]:box('Hinge',(x,.98,.29),(.6,.17,.12),edge,.06,laptop)
lid=root('Laptop display hinge',(0,.98,.26),(math.radians(-12),0,0));lid.parent=laptop
box('Laptop display casing',(0,0,1.11),(3.6,.1,2.22),edge,.065,lid);box('Laptop display bezel',(0,-.057,1.11),(3.51,.018,2.13),black,.05,lid)
screen('Actual Club control room',lid,3.31,1.862,1.12,-.071,'desktop-club-control.png','desktop.png')
box('Camera',(0,-.075,2.145),(.022,.006,.022),rubber,.01,lid)
tablet=root('Tablet',(2.25,.4,.05),(math.radians(-10),0,math.radians(-14)))
box('Tablet metal housing',(0,0,.96),(2.45,.10,1.88),edge,.095,tablet);box('Tablet black bezel',(0,-.058,.96),(2.39,.018,1.82),black,.085,tablet)
screen('Actual tablet attendance',tablet,2.23,1.6725,.96,-.074,'tablet-attendance.png','tablet.png')
phone=root('Phone',(-2.35,-.55,.04),(math.radians(-8),0,math.radians(13)))
box('Phone metal edge',(0,0,.96),(.94,.11,1.88),edge,.10,phone);box('Phone black bezel',(0,-.061,.96),(.89,.016,1.83),black,.095,phone)
screen('Actual mobile member view',phone,.79,1.71,.96,-.074,'mobile-member.png','mobile.png');box('Phone speaker',(0,-.08,1.79),(.20,.012,.026),rubber,.012,phone)
box('Studio floor',(0,0,-.055),(200,200,.08),floor,0)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.04,.035,.03,1);world.node_tree.nodes['Background'].inputs[1].default_value=.25
def area(name,loc,power,color,size):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,.2,1))-o.location).to_track_quat('-Z','Y').to_euler()
area('Soft key',(-3,-4,6),1400,(1,.90,.80),5);area('Courvix orange rim',(3,4,5),1700,(1,.24,.055),4);area('Neutral fill',(4,-3,3.5),900,(.86,.92,1),4)
bpy.ops.object.camera_add(location=(5.8,-8.8,4.8));camera=bpy.context.object;camera.name='Hero camera';bpy.context.scene.camera=camera;camera.data.lens=47;camera.data.dof.use_dof=False
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False;scene.cycles.max_bounces=6;scene.render.resolution_x=3840;scene.render.resolution_y=2160;scene.render.resolution_percentage=100;scene.render.fps=30;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
# Animation controls are saved for the final edit after actual screens are supplied.
for frame,loc in [(1,(5.8,-8.8,4.8)),(151,(4.9,-8.3,4.45)),(301,(4.0,-8.0,4.2))]:
 camera.location=loc;camera.rotation_euler=(Vector((0,.35,1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.keyframe_insert('location',frame=frame);camera.keyframe_insert('rotation_euler',frame=frame)
scene.frame_end=301;scene.frame_set(151)
for img in bpy.data.images:
 if img.source=='FILE':img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'COURVIX-device-rig.blend'))
scene.render.filepath=str(OUT/'COURVIX-devices-4K-proof.png');bpy.ops.render.render(write_still=True)
print('4K device proof complete. Final device screens still require actual app captures.')
