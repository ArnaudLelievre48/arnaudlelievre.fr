"""Local WebGL integration checks; requires Python Playwright and a Chromium binary."""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def near_vector(actual, expected, tolerance=1e-7):
    assert max(abs(a - b) for a, b in zip(actual, expected)) < tolerance, (actual, expected)


with sync_playwright() as p:
    executable = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('DOCKING_CHROMIUM')
    if not executable and not Path(p.chromium.executable_path).exists():
        cached = sorted((Path.home() / '.cache/ms-playwright').glob('chromium-*/chrome-linux64/chrome'))
        executable = str(cached[-1]) if cached else None
    browser = p.chromium.launch(headless=True, executable_path=executable, args=[
        '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'
    ])
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1, offline=True)
    page = context.new_page()
    errors, network = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.on('request', lambda request: network.append(request.url) if request.url.startswith(('http:', 'https:')) else None)
    page.goto((ROOT / 'sch_ma_cin_matique_3d_interactif.html').as_uri())
    page.wait_for_function('window.dockingDebug !== undefined')

    def snapshot():
        s = page.evaluate('dockingDebug.snapshot()')
        assert not s['metrics']['collision'], s
        assert s['metrics']['captureValid'] and s['metrics']['dockValid'], s
        near_vector(s['sceneTCP'], s['metrics']['tcp'])
        near_vector(s['sceneAxis'], s['metrics']['axis'])
        near_vector(s['sceneXAxis'], s['metrics']['xAxis'])
        near_vector(s['sceneReceiver'], s['metrics']['target'])
        for a, b in zip(s['scenePivots'], s['metrics']['points']):
            near_vector(a, b)
        # Fixed shared hinge and rigidly rotating jaw tips must agree with the scene.
        jaw_geometry = page.evaluate('opening => [0, 1].map(jaw => ({pose: DockingModel.jawPose(jaw, opening), tip: DockingModel.jawPoint(jaw, jaw ? 2 * Math.PI : 0, (DockingModel.C.jawInner + DockingModel.C.jawOuter) / 2, opening)}))', s['opening'])
        for jaw, geometry in enumerate(jaw_geometry):
            near_vector(s['sceneJawPivots'][jaw], geometry['pose']['pivot'])
            near_vector(s['sceneJawTips'][jaw], geometry['tip'])
            assert abs(s['jawAngles'][jaw] - geometry['pose']['angle']) < 1e-7
        return s

    def slider(selector, value):
        page.locator(selector).evaluate('(el, v) => {el.value = v; el.dispatchEvent(new Event("input", {bubbles:true}));}', value)

    initial = snapshot()
    assert initial['capture'] == 'OPEN' and initial['dock'] == 'OPEN' and not initial['running']
    page.screenshot(path='/tmp/docking-initial.png')
    # Inspect a half-closed pose as well as the end states of capture.
    slider('#timeline', 7.5)
    assert abs(snapshot()['opening'] - 0.5) < 1e-7
    page.screenshot(path='/tmp/docking-gripper-half-closed.png')
    for tick in range(105):
        slider('#timeline', tick / 4)
        s = snapshot()
        if s['dock'] == 'LOCKED':
            assert s['capture'] == 'ENGAGED' and s['metrics']['contact'], s
    assert snapshot()['dock'] == 'LOCKED'
    page.screenshot(path='/tmp/docking-connected.png')
    slider('#timeline', 22.99)
    s = snapshot()
    assert s['metrics']['contact'] and s['dock'] == 'OPEN', s

    # All independent transforms agree in manual mode, including tilted A4 and rotated A5.
    page.locator('#btn-reset').click()
    slider('#slide-j5', -15)
    manual = snapshot()
    assert manual['manual'] and not manual['running']
    near_vector(manual['sceneTCP'], initial['sceneTCP'])
    slider('#slide-j4', manual['joints'][3] + 5)
    assert snapshot()['metrics']['angle'] > 4.9
    slider('#slide-b1', 5.4)
    slider('#slide-b2', 0.2)
    slider('#slide-b3', 0.1)
    s = snapshot()
    near_vector(s['sceneReceiver'], [5.4, 0.2, 1.72])
    page.locator('#btn-align').click()
    assert 'hors du plan' in page.locator('#safety-message').inner_text()
    snapshot()

    # Full manual lifecycle: capture, residual yaw, contact, lock, unlock, clearance, release.
    page.locator('#btn-reset').click()
    page.locator('#btn-position').click()
    slider('#slide-opening', 0)
    assert snapshot()['metrics']['canCapture']
    page.locator('#btn-capture').click()
    assert snapshot()['capture'] == 'ENGAGED'
    assert page.locator('#slide-b1').is_disabled()
    assert page.locator('#slide-opening').is_disabled()
    slider('#slide-b4', 33)
    assert snapshot()['buoy']['heading'] == 33
    page.locator('#btn-align').click()
    s = snapshot()
    assert s['metrics']['aligned'] and s['metrics']['gap'] > 0.34, s
    page.locator('#btn-contact').click()
    assert snapshot()['metrics']['contact'] and snapshot()['dock'] == 'OPEN'
    page.locator('#btn-dock').click()
    assert snapshot()['dock'] == 'LOCKED'
    for selector in ['#slide-j1', '#slide-j5', '#slide-b4', '#btn-release', '#btn-retreat']:
        assert page.locator(selector).is_disabled(), selector
    page.locator('#btn-dock').click()
    assert snapshot()['dock'] == 'OPEN'
    page.locator('#btn-release').click()
    assert snapshot()['capture'] == 'ENGAGED'
    assert 'Reculer' in page.locator('#safety-message').inner_text()
    page.locator('#btn-retreat').click()
    near_vector(snapshot()['metrics']['tcp'], page.evaluate('DockingModel.C.homeTCP'))
    page.locator('#btn-release').click()
    assert snapshot()['capture'] == 'OPEN' and snapshot()['opening'] == 1
    assert page.locator('#slide-b1').is_enabled()

    # Manual sweep stops at a collision rather than crossing the platform.
    page.locator('#btn-reset').click()
    slider('#slide-j1', -20)
    guarded = snapshot()
    assert guarded['joints'][0] > -20
    assert 'Butée virtuelle' in page.locator('#safety-message').inner_text()

    page.locator('#btn-reset').click()
    page.locator('#btn-auto-play').click()
    page.wait_for_timeout(650)
    page.locator('#btn-auto-play').click()
    paused = snapshot()
    assert paused['time'] > 0 and not paused['running']
    page.wait_for_timeout(200)
    assert snapshot()['time'] == paused['time']
    page.locator('#btn-reset').click()
    page.locator('[data-speed="2"]').click()
    page.locator('#btn-auto-play').click()
    page.wait_for_function('dockingDebug.snapshot().time >= DockingModel.duration', timeout=60000)
    assert snapshot()['dock'] == 'LOCKED' and not snapshot()['running']

    page.locator('[data-view="front"]').click()
    page.wait_for_timeout(150)
    page.screenshot(path='/tmp/docking-front.png')
    page.locator('[data-view="top"]').click()
    page.wait_for_timeout(150)
    page.screenshot(path='/tmp/docking-top.png')
    page.locator('[data-view="perspective"]').click()
    page.locator('#btn-toggle-mode').click()
    page.locator('#btn-water').click()
    page.wait_for_timeout(150)
    page.screenshot(path='/tmp/docking-schematic.png')
    page.locator('#btn-labels').click()
    assert page.locator('#labels-layer').is_hidden()
    page.locator('#btn-labels').click()
    page.get_by_role('button', name='Comprendre le système').click()
    assert page.locator('#model-dialog').evaluate('(el) => el.open')
    page.screenshot(path='/tmp/docking-diagram.png')
    page.keyboard.press('Escape')
    assert not page.locator('#model-dialog').evaluate('(el) => el.open')
    page.locator('#btn-toggle-mode').click()
    page.locator('#btn-water').click()
    page.set_viewport_size({'width': 390, 'height': 844})
    page.wait_for_timeout(200)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile horizontal overflow'
    tools = page.locator('.view-tools').bounding_box()
    legend = page.locator('.scene-legend').bounding_box()
    assert legend['y'] > tools['y'] + tools['height'], 'Mobile legend overlaps view buttons'
    page.screenshot(path='/tmp/docking-mobile.png', full_page=True)
    page.get_by_role('button', name='Comprendre le système').click()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.keyboard.press('Escape')
    snapshot()
    assert not errors, errors
    assert not network, network
    print(json.dumps({'result': 'passed', 'poses_checked': 105, 'manual_lifecycle': 'passed', 'offline': True,
                      'initial_tcp': initial['sceneTCP'], 'guarded_a1': guarded['joints'][0], 'errors': errors}, indent=2))
    browser.close()
