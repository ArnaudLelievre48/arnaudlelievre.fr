"""Offline WebGL integration checks for docking solution 2."""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
def near_vector(actual, expected, tolerance=1e-7):
    assert max(abs(a-b) for a,b in zip(actual,expected)) < tolerance, (actual,expected)

with sync_playwright() as p:
    executable = sys.argv[1] if len(sys.argv)>1 else os.environ.get('DOCKING_CHROMIUM')
    if not executable and not Path(p.chromium.executable_path).exists():
        cached=sorted((Path.home()/'.cache/ms-playwright').glob('chromium-*/chrome-linux64/chrome'))
        executable=str(cached[-1]) if cached else None
    browser=p.chromium.launch(headless=True,executable_path=executable,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,offline=True)
    page=context.new_page(); errors=[]; network=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('console',lambda message:errors.append(message.text) if message.type=='error' else None)
    page.on('request',lambda request:network.append(request.url) if request.url.startswith(('http:','https:')) else None)
    page.goto((ROOT/'sch_ma_cin_matique_3d_interactif.html').as_uri())
    page.wait_for_function('window.dockingDebug !== undefined')
    def snapshot():
        s=page.evaluate('dockingDebug.snapshot()');m=s['metrics'];support=m['support']
        assert not m['collision'],s
        assert m['captureValid'] and m['dockValid'],s
        near_vector(s['sceneTCP'],m['tcp']);near_vector(s['sceneAxis'],m['axis']);near_vector(s['sceneXAxis'],m['xAxis'])
        near_vector(s['sceneReceiver'],m['target'])
        for a,b in zip(s['scenePivots'],m['points']):near_vector(a,b)
        for key,model in [('sceneFixedMount','mount'),('sceneG4','g4'),('sceneD1','d1'),('sceneD2','d2')]:near_vector(s[key],support[model])
        near_vector(s['sceneFixedMount'],page.evaluate('DockingModel.C.carrierMount'))
        near_vector(s['sceneCarrierAxis'],[0,0,-1])
        near_vector(s['sceneLongeronCenter'],page.evaluate('DockingModel.C.longeronCenter'))
        assert s['sceneFixedToLongeron'],'Le bras fixe et D1 doivent appartenir au longeron.'
        near_vector(s['sceneG4'],page.evaluate('DockingModel.supportForward().g4'))
        near_vector(s['sceneD1'],page.evaluate('DockingModel.C.damperD1'))
        direction=[(b-a)/support['length'] for a,b in zip(support['d1'],support['d2'])]
        near_vector(s['sceneDamperAxis'],direction)
        geometry=page.evaluate('s=>[0,1].map(jaw=>({pose:DockingModel.jawPose(jaw,s.opening,s.supportAngles),tip:DockingModel.jawPoint(jaw,jaw?2*Math.PI:0,(DockingModel.C.jawInner+DockingModel.C.jawOuter)/2,s.opening,s.supportAngles)}))',s)
        for jaw,g in enumerate(geometry):
            near_vector(s['sceneJawPivots'][jaw],g['pose']['pivot']);near_vector(s['sceneJawTips'][jaw],g['tip'])
            assert abs(s['jawAngles'][jaw]-g['pose']['angle'])<1e-7
        return s
    def slider(selector,value):
        page.locator(selector).evaluate('(el,v)=>{el.value=v;el.dispatchEvent(new Event("input",{bubbles:true}));}',value)
    initial=snapshot();assert initial['capture']=='OPEN' and initial['dock']=='OPEN'
    page.screenshot(path='/tmp/docking-initial.png')
    slider('#timeline',7.5);assert abs(snapshot()['opening']-.5)<1e-7
    page.screenshot(path='/tmp/docking-gripper-half-closed.png')
    for tick in range(121):
        slider('#timeline',tick/4);s=snapshot()
        if s['dock']=='LOCKED':assert s['capture']=='ENGAGED' and s['metrics']['contact']
    page.screenshot(path='/tmp/docking-connected.png')
    slider('#timeline',11);stabilized=snapshot()
    assert abs(stabilized['supportAngles'][0])>1
    assert abs(stabilized['metrics']['support']['extension'])>.01
    assert abs(stabilized['buoy']['x']-3.43)>.02
    page.screenshot(path='/tmp/docking-damped-stabilization.png')
    slider('#timeline',26.99);assert snapshot()['metrics']['contact'] and snapshot()['dock']=='OPEN'
    print('Cycle et cinématique scène/modèle : 121 poses vérifiées.',flush=True)

    page.locator('#btn-reset').click()
    slider('#slide-j5',-15);manual=snapshot();near_vector(manual['sceneTCP'],initial['sceneTCP'])
    slider('#slide-j4',manual['joints'][3]+5);assert snapshot()['metrics']['angle']>4.9
    slider('#slide-b1',5.9);slider('#slide-b2',.2);slider('#slide-b3',.1)
    near_vector(snapshot()['sceneReceiver'],[5.9,.2,2.6])
    page.locator('#btn-align').click();assert 'hors du plan' in page.locator('#safety-message').inner_text()
    snapshot()
    page.locator('#btn-reset').click()
    free=snapshot()['buoy']
    slider('#slide-g1',5)
    assert page.locator('#slide-g2').count()==0,'G1 ne doit plus être une mobilité.'
    assert snapshot()['buoy']==free,'La pince mobile ne doit pas entraîner une bouée libre.'

    page.locator('#btn-reset').click();page.locator('#btn-position').click();slider('#slide-opening',0)
    assert snapshot()['metrics']['canCapture'];page.locator('#btn-capture').click()
    assert snapshot()['capture']=='ENGAGED'
    assert page.locator('#slide-b1').is_disabled() and page.locator('#slide-opening').is_disabled()
    slider('#slide-g1',2)
    carried=snapshot();assert abs(carried['buoy']['tilt']-2)<1e-7
    assert carried['buoy']['x']!=3.43
    assert page.locator('#slide-g1').is_enabled(),'La capture conserve la mobilité du support.'
    slider('#slide-b4',33);assert snapshot()['buoy']['heading']==33
    page.locator('#btn-align').click();s=snapshot()
    assert s['metrics']['aligned'] and s['metrics']['gap']>.34,s
    page.locator('#btn-contact').click();assert snapshot()['metrics']['contact'] and snapshot()['dock']=='OPEN'
    page.locator('#btn-dock').click();assert snapshot()['dock']=='LOCKED'
    for selector in ['#slide-j1','#slide-j5','#slide-b4','#slide-g1','#btn-release','#btn-retreat']:
        assert page.locator(selector).is_disabled(),selector
    page.locator('#btn-dock').click();page.locator('#btn-release').click()
    assert snapshot()['capture']=='ENGAGED' and 'Reculer' in page.locator('#safety-message').inner_text()
    page.locator('#btn-retreat').click();near_vector(snapshot()['metrics']['tcp'],page.evaluate('DockingModel.C.homeTCP'))
    page.locator('#btn-release').click();assert snapshot()['capture']=='OPEN' and snapshot()['opening']==1
    assert page.locator('#slide-b1').is_enabled()
    print('Parcours manuel, porte-pince encastré, pince amortie et boîtes inclinées : vérifiés.',flush=True)

    page.locator('#btn-reset').click();slider('#slide-j2',-170);guarded=snapshot()
    assert guarded['joints'][1]>-170 and 'Butée virtuelle' in page.locator('#safety-message').inner_text()
    page.locator('#btn-reset').click();page.locator('#btn-auto-play').click();page.wait_for_timeout(650)
    page.locator('#btn-auto-play').click();paused=snapshot();assert paused['time']>0 and not paused['running']
    page.wait_for_timeout(200);assert snapshot()['time']==paused['time']
    page.locator('#btn-reset').click();page.locator('[data-speed="2"]').click();page.locator('#btn-auto-play').click()
    page.wait_for_function('dockingDebug.snapshot().time>=DockingModel.duration',timeout=60000)
    assert snapshot()['dock']=='LOCKED' and not snapshot()['running']
    print('Cycle automatique, pause et reprise : vérifiés.',flush=True)
    for view in ['front','top','perspective']:
        page.locator(f'[data-view="{view}"]').click();page.wait_for_timeout(150)
        page.screenshot(path=f'/tmp/docking-{view}.png')
    slider('#timeline',11);page.locator('#btn-toggle-mode').click();page.locator('#btn-water').click()
    page.wait_for_timeout(150);page.screenshot(path='/tmp/docking-schematic.png')
    page.locator('#btn-labels').click();assert page.locator('#labels-layer').is_hidden();page.locator('#btn-labels').click()
    page.get_by_role('button',name='Comprendre le système').click();assert page.locator('#model-dialog').evaluate('(el)=>el.open')
    page.screenshot(path='/tmp/docking-diagram.png');page.keyboard.press('Escape')
    assert not page.locator('#model-dialog').evaluate('(el)=>el.open')
    page.locator('#btn-toggle-mode').click();page.locator('#btn-water').click()
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    tools=page.locator('.view-tools').bounding_box();legend=page.locator('.scene-legend').bounding_box()
    assert legend['y']>tools['y']+tools['height']
    page.screenshot(path='/tmp/docking-mobile.png',full_page=True)
    snapshot();assert not errors,errors;assert not network,network
    print(json.dumps({'result':'passed','poses_checked':121,'manual_lifecycle':'passed','mobile_support':'passed','offline':True,'errors':errors},indent=2),flush=True)
    browser.close()
