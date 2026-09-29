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
    page.screenshot(path='/tmp/docking-initial.png')
    initial = page.evaluate('dockingDebug.snapshot()')
    assert not initial['metrics']['collision'], initial
    assert not initial['running']
    for t in [0, 3, 5, 8, 10, 12, 15, 18]:
        page.locator('#timeline').evaluate('(el, t) => {el.value = t; el.dispatchEvent(new Event("input", {bubbles:true}));}', t)
        snapshot = page.evaluate('dockingDebug.snapshot()')
        assert not snapshot['metrics']['collision'], snapshot
        assert max(abs(a-b) for a,b in zip(snapshot['sceneTCP'], snapshot['metrics']['tcp'])) < 1e-7, snapshot
        assert max(abs(a-b) for a,b in zip(snapshot['sceneAxis'], snapshot['metrics']['axis'])) < 1e-7, snapshot
        if t == 12:
            assert snapshot['metrics']['connected'], snapshot
            page.screenshot(path='/tmp/docking-connected.png')
    page.locator('#btn-reset').click()
    page.locator('#slide-s1').evaluate('(el) => {el.value = 120; el.dispatchEvent(new Event("input", {bubbles:true}));}')
    manual = page.evaluate('dockingDebug.snapshot()')
    assert manual['manual'] and not manual['running']
    assert abs(manual['pose']['roll']) > 0.001
    assert max(abs(a-b) for a,b in zip(manual['sceneTCP'], manual['metrics']['tcp'])) < 1e-7, manual
    page.locator('#btn-level').click()
    level = page.evaluate('dockingDebug.snapshot()')
    assert abs(level['pose']['pitch']) < 1e-6 and abs(level['pose']['roll']) < 1e-6, level
    page.locator('#btn-reset').click()
    page.locator('#compensated').uncheck()
    rigid = page.evaluate('dockingDebug.snapshot()')
    assert max(abs(a-b) for a,b in zip(rigid['sceneTCP'], rigid['metrics']['tcp'])) < 1e-7, rigid
    page.locator('#btn-reset').click()
    page.locator('#btn-auto-play').click()
    page.wait_for_timeout(700)
    page.locator('#btn-auto-play').click()
    paused = page.evaluate('dockingDebug.snapshot()')
    assert paused['time'] > 0 and not paused['running']
    page.wait_for_timeout(200)
    assert page.evaluate('dockingDebug.snapshot().time') == paused['time']
    page.locator('#btn-reset').click()
    page.locator('#slide-j2').evaluate('(el) => {el.value = 120; el.dispatchEvent(new Event("input", {bubbles:true}));}')
    guarded = page.evaluate('dockingDebug.snapshot()')
    assert not guarded['metrics']['collision']
    assert guarded['joints'][1] < 120
    assert 'Butée virtuelle' in page.locator('#safety-message').inner_text()
    page.locator('#btn-reset').click()
    page.locator('[data-speed="2"]').click()
    page.locator('#btn-auto-play').click()
    page.wait_for_function('dockingDebug.snapshot().time >= 18', timeout=60000)
    assert not page.evaluate('dockingDebug.snapshot().running')
    page.locator('#btn-reset').click()
    page.locator('#btn-toggle-mode').click()
    page.screenshot(path='/tmp/docking-schematic.png')
    page.get_by_role('button', name='Comprendre le système').click()
    assert page.locator('#model-dialog').evaluate('(el) => el.open')
    page.screenshot(path='/tmp/docking-diagram.png')
    page.keyboard.press('Escape')
    assert not page.locator('#model-dialog').evaluate('(el) => el.open')
    for name in ['top', 'front', 'perspective']:
        page.locator(f'[data-view="{name}"]').click()
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_timeout(200)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile horizontal overflow'
    page.screenshot(path='/tmp/docking-mobile.png', full_page=True)
    assert not errors, errors
    print(json.dumps({'result':'passed', 'initial_tcp': initial['sceneTCP'], 'manual_pose':manual['pose'], 'errors':errors}, indent=2))
    browser.close()
