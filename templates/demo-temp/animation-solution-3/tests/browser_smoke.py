"""Local file:// browser and layout check. Needs Playwright and Chromium."""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

def snapshot(page):
    return page.evaluate('dockingDebug.snapshot()')

def slider(page, selector, value):
    page.locator(selector).evaluate('(el, v) => {el.value = v; el.dispatchEvent(new Event("input", {bubbles:true}));}', value)

def check_geometry(s):
    for scene_key, model_key in [('sceneTCP', 'tcp'), ('sceneAxis', 'axis'), ('sceneX', 'xAxis'), ('sceneReceiver', 'receiver')]:
        assert max(abs(a-b) for a,b in zip(s[scene_key], s['metrics'][model_key])) < 1e-7, s

with sync_playwright() as p:
    executable = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('DOCKING_CHROMIUM')
    browser = p.chromium.launch(headless=True, executable_path=executable, args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width':1440, 'height':1000}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.goto((ROOT / 'sch_ma_cin_matique_3d_interactif.html').as_uri())
    page.wait_for_function('window.dockingDebug !== undefined')
    page.screenshot(path='/tmp/docking-platforms-initial.png')
    initial = snapshot(page)
    assert not initial['running'] and not initial['manual']
    assert initial['cylinderCount'] == 3 and initial['dock'] == 'OPEN'
    for t in [0, 2, 5, 9, 11, 12.5, 14, 17, 20, 21, 22, 24, 25, 28, 30, 32]:
        slider(page, '#timeline', t)
        s = snapshot(page)
        assert not s['metrics']['collision'], s
        check_geometry(s)
        assert abs(s['sceneReceiver'][1] - initial['sceneReceiver'][1]) < 1e-7
        if t == 11:
            assert s['pose']['h'] < initial['pose']['h']
            assert all(b > a for a,b in zip(initial['strokes'], s['strokes']))
        if t == 12.5:
            assert 0 < s['clamp'] < 1 and s['buoy']['x'] > 0
            page.screenshot(path='/tmp/docking-platforms-centering.png')
        if 14 <= t <= 28:
            assert s['metrics']['capture']['centered']
        if t == 22:
            assert s['dock'] == 'LOCKED' and s['metrics']['contact']
            assert page.locator('#slide-fine-z').is_disabled()
            assert page.locator('#slide-clamp').is_disabled()
            page.screenshot(path='/tmp/docking-platforms-locked.png')
    slider(page, '#timeline', 22)
    page.locator('#btn-lock').click()
    assert snapshot(page)['dock'] == 'OPEN'
    slider(page, '#slide-fine-z', 0)
    page.locator('#btn-clamp').click()
    assert abs(snapshot(page)['sceneReceiver'][1] - 0.65) < 1e-7
    page.locator('#btn-reset').click()
    slider(page, '#slide-s1', 150)
    s = snapshot(page)
    assert s['manual'] and abs(s['pose']['roll']) > 0.001
    check_geometry(s)
    page.locator('#btn-level').click()
    s = snapshot(page)
    assert abs(s['pose']['pitch']) < 1e-6 and abs(s['pose']['roll']) < 1e-6
    check_geometry(s)
    slider(page, '#timeline', 17)
    slider(page, '#slide-fine-z', 400)
    s = snapshot(page)
    assert not s['metrics']['collision'] and s['fine']['z'] < 400
    assert 'Butée virtuelle' in page.locator('#safety-message').inner_text()
    page.locator('#btn-reset').click()
    page.locator('#btn-auto-play').click()
    page.wait_for_timeout(500)
    page.locator('#btn-auto-play').click()
    paused = snapshot(page)
    assert paused['time'] > 0 and not paused['running']
    page.wait_for_timeout(100)
    assert snapshot(page)['time'] == paused['time']
    slider(page, '#timeline', 31.5)
    page.locator('#btn-auto-play').click()
    page.wait_for_function('dockingDebug.snapshot().time >= 32')
    assert not snapshot(page)['running']
    page.locator('#btn-reset').click()
    page.locator('#btn-toggle-mode').click()
    assert snapshot(page)['schematic']
    page.locator('#btn-dimensions').click()
    page.screenshot(path='/tmp/docking-platforms-schematic.png')
    page.locator('[data-open-model]').first.click()
    assert page.locator('#model-dialog').evaluate('(el) => el.open')
    page.screenshot(path='/tmp/docking-platforms-diagram.png')
    page.keyboard.press('Escape')
    assert not page.locator('#model-dialog').evaluate('(el) => el.open')
    for name in ['top', 'front', 'perspective', 'centering', 'docking']:
        page.locator(f'[data-view="{name}"]').click()
        page.wait_for_timeout(150)
        page.screenshot(path=f'/tmp/docking-platforms-{name}.png')
    for width, height in [(1024,768), (390,844)]:
        page.set_viewport_size({'width':width, 'height':height})
        page.wait_for_timeout(200)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal overflow'
    page.screenshot(path='/tmp/docking-platforms-mobile.png', full_page=True)
    assert not errors, errors
    print(json.dumps({'result':'passed', 'cylinders':3, 'duration':32, 'errors':errors}, indent=2))
    browser.close()
