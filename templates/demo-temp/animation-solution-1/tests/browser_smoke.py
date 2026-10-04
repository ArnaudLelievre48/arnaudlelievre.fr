"""Verify actual Three.js transforms, interaction guards, cycle and small screens."""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    executable = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('DOCKING_CHROMIUM')
    browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.goto((ROOT / 'sch_ma_cin_matique_3d_interactif.html').as_uri())
    page.wait_for_function('window.dockingDebug !== undefined')

    def slider(selector, value):
        page.locator(selector).evaluate('(el, value) => {el.value=value; el.dispatchEvent(new Event("input", {bubbles:true}));}', value)

    def snapshot():
        s = page.evaluate('dockingDebug.snapshot()')
        assert not s['metrics']['collision'], s
        for key, metric in [('sceneTCP', 'tcp'), ('sceneAxis', 'axis'), ('sceneXAxis', 'xAxis'), ('sceneShoulder', 'shoulder'), ('sceneElbow', 'elbow'), ('sceneWrist', 'wrist')]:
            assert max(abs(a-b) for a,b in zip(s[key], s['metrics'][metric])) < 1e-7, (key, s)
        target = s['metrics']['target']
        assert abs(s['sceneSocket'][0] - target[0]) < 1e-7
        assert abs(s['sceneSocket'][1] + .0075 - target[1]) < 1e-7
        assert abs(s['sceneSocket'][2] - target[2]) < 1e-7
        assert len(s['lowerAnchors']) == 3
        return s

    initial = snapshot()
    assert not initial['running']
    page.screenshot(path='/tmp/docking-3verins-initial.png')
    for t in [0, 3, 5, 7, 8.5, 10, 11.5, 13, 15, 17, 18, 19, 20.5, 21, 23, 24, 26, 28, 30, 34]:
        slider('#timeline', t)
        s = snapshot()
        if t == 23:
            assert s['metrics']['captured'] and s['metrics']['connected'], s
            page.screenshot(path='/tmp/docking-3verins-connected.png')
        if t == 18:
            assert s['metrics']['captured'] and not s['metrics']['connected']
        if t == 34:
            assert s['metrics']['captureState'] == 'FREE'
    page.locator('#btn-reset').click()
    slider('#slide-s1', 300)
    manual = snapshot()
    assert manual['manual'] and not manual['running']
    assert abs(manual['pose']['roll'] - initial['pose']['roll']) > .01
    page.locator('#btn-level').click()
    level = snapshot()
    assert abs(level['pose']['pitch']) < 1e-7 and abs(level['pose']['roll']) < 1e-7
    slider('#timeline', 23)
    slider('#slide-s1', 1000)
    guarded = snapshot()
    assert 'libérer' in page.locator('#safety-message').inner_text()
    assert max(abs(a-b) for a,b in zip(guarded['strokes'], page.evaluate('DockingModel.trajectory(23).strokes'))) < 1e-6
    page.locator('#btn-release').click()
    assert snapshot()['metrics']['captureState'] == 'FREE'
    page.locator('#btn-reset').click()
    before = snapshot()
    slider('#slide-j4', -70)
    after = snapshot()
    assert max(abs(a-b) for a,b in zip(before['sceneTCP'], after['sceneTCP'])) < 1e-7
    assert abs(after['joints'][3] + 70) < 1e-7
    page.locator('#btn-reset').click()
    page.locator('#btn-auto-play').click()
    page.wait_for_timeout(600)
    page.locator('#btn-auto-play').click()
    paused = snapshot()
    assert paused['time'] > 0 and not paused['running']
    page.wait_for_timeout(150)
    assert snapshot()['time'] == paused['time']
    page.locator('#btn-reset').click()
    page.locator('[data-speed="2"]').click()
    page.locator('#btn-auto-play').click()
    page.wait_for_function('dockingDebug.snapshot().metrics.connected', timeout=45000)
    assert snapshot()['metrics']['captured']
    page.wait_for_function('dockingDebug.snapshot().time >= 34', timeout=45000)
    assert not snapshot()['running']
    page.locator('#btn-reset').click()
    page.locator('#btn-toggle-mode').click()
    page.screenshot(path='/tmp/docking-3verins-schematic.png')
    page.get_by_role('button', name='Comprendre le système').click()
    assert page.locator('#model-dialog').evaluate('(el) => el.open')
    page.screenshot(path='/tmp/docking-3verins-diagram.png')
    page.keyboard.press('Escape')
    assert not page.locator('#model-dialog').evaluate('(el) => el.open')
    page.locator('#btn-toggle-mode').click()
    for name in ['top', 'front', 'perspective']:
        page.locator(f'[data-view="{name}"]').click()
        page.screenshot(path=f'/tmp/docking-3verins-{name}.png')
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(250)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile horizontal overflow'
    page.screenshot(path='/tmp/docking-3verins-mobile.png', full_page=True)
    assert not errors, errors
    print(json.dumps({'result':'passed', 'initial_tcp':initial['sceneTCP'], 'manual_pose':manual['pose'], 'errors':errors}, indent=2))
    browser.close()
