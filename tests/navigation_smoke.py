"""Exercise navigation joins, interrupted moves and responsive layout in a real browser."""

import argparse
import logging
import sys
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright
from werkzeug.serving import make_server

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend import app


GEOMETRY = """settled => {
    const root = document.querySelector('.page-wraper').getBoundingClientRect();
    const surface = document.querySelector('.navigation-surface');
    const shape = document.querySelector('.navigation-shape');
    const content = document.querySelector('.content.active');
    const panel = content.getBoundingClientRect();
    const tab = document.querySelector('.header-button-wraper.active').getBoundingClientRect();
    const button = document.querySelector('.header-button.active');
    const bounds = shape.getBBox();
    const radius = parseFloat(getComputedStyle(content).borderBottomLeftRadius);
    const inside = (x, y) => shape.isPointInFill(new DOMPoint(x, y));
    const joins = Array.from({length: 31}, (_, index) => {
        const x = radius + 1 + (root.width - 2 * radius - 2) * index / 30;
        return inside(x, panel.top - root.top + 0.5);
    });
    const tabMiddle = tab.left - root.left + tab.width / 2;
    const buttonBounds = button.getBoundingClientRect();
    return {
        continuousJoin: joins.every(Boolean),
        tabJoined: !settled || [-0.5, 0, 0.5].every(offset =>
            inside(tabMiddle, panel.top - root.top + offset)),
        tabFilled: !settled || inside(tabMiddle, tab.top - root.top + tab.height / 2),
        dimensionsMatch: Math.abs(bounds.width - root.width) < 0.1 &&
            Math.abs(bounds.height - root.height) < 0.1 &&
            Math.abs(surface.viewBox.baseVal.width - root.width) < 0.1,
        clickableLabel: document.elementFromPoint(
            buttonBounds.x + buttonBounds.width / 2,
            buttonBounds.y + buttonBounds.height / 2) === button,
        contentTransparent: getComputedStyle(content).backgroundColor === 'rgba(0, 0, 0, 0)',
        outlineMatches: shape.getAttribute('d') === document.querySelector('.navigation-trace').getAttribute('d'),
        finitePath: !/NaN|Infinity/.test(shape.getAttribute('d')),
        singleSelection: document.querySelectorAll('.content.active').length === 1 &&
            document.querySelectorAll('.header-button[aria-pressed="true"]').length === 1,
        accessiblePanels: [...document.querySelectorAll('.content')].every(el =>
            el.inert !== el.classList.contains('active') &&
            el.getAttribute('aria-hidden') === String(!el.classList.contains('active')))
    };
}"""


def check_geometry(page, settled=True):
    results = page.evaluate(GEOMETRY, settled)
    assert all(results.values()), results


def run(browser_name):
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    server = make_server('127.0.0.1', 0, app)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as playwright:
            browser = getattr(playwright, browser_name).launch(headless=True)
            try:
                for touch, scale in [(False, 1.25), (True, 2)]:
                    context = browser.new_context(
                        viewport={'width': 1440, 'height': 960},
                        has_touch=touch, device_scale_factor=scale,
                        reduced_motion='reduce',
                    )
                    try:
                        context.route('https://**/*', lambda route: route.abort())
                        page = context.new_page()
                        errors = []
                        page.on('pageerror', lambda error: errors.append(str(error)))
                        page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='networkidle')

                        for width, height in [(1440, 960), (997, 731), (761, 640),
                                              (760, 640), (320, 568), (390, 844),
                                              (844, 390), (820, 1180), (997, 997)]:
                            page.set_viewport_size({'width': width, 'height': height})
                            for section in ['home', 'projects', 'resume']:
                                page.locator(f'#{section}Btn').click()
                                page.wait_for_function('navigationFrame === null')
                                check_geometry(page)

                        page.emulate_media(reduced_motion='no-preference')
                        for section in ['home', 'projects', 'home', 'resume', 'projects', 'resume']:
                            page.locator(f'#{section}Btn').click()
                            page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
                            check_geometry(page, settled=False)
                        page.wait_for_function('navigationFrame === null')
                        check_geometry(page)

                        page.locator('#projectsBtn').click()
                        for width, height in [(997, 731), (390, 844), (844, 390)]:
                            page.set_viewport_size({'width': width, 'height': height})
                            page.wait_for_function('''() => {
                                const root = document.querySelector('.page-wraper').getBoundingClientRect();
                                const viewBox = document.querySelector('.navigation-surface').viewBox.baseVal;
                                return Math.abs(root.width - viewBox.width) < 0.1 && Math.abs(root.height - viewBox.height) < 0.1;
                            }''')
                            page.wait_for_function('navigationFrame === null')
                            check_geometry(page)

                        page.locator('.project-nav-next').click()
                        page.locator('.project-nav-next').click()
                        assert page.locator('.project-counter-current').inner_text() == '3'
                        expected = page.locator('.project-page.is-current .project-theme').get_attribute('data-theme-background')
                        assert page.locator('.page-wraper').evaluate('el => el.style.getPropertyValue("--panel-color")') == expected
                        check_geometry(page)

                        page.locator('#homeBtn').click()
                        page.emulate_media(reduced_motion='reduce')
                        page.wait_for_function('navigationFrame === null')
                        check_geometry(page)
                        assert page.locator('.navigation-trace').evaluate('el => getComputedStyle(el).animationName') == 'none'
                        page.locator('#resumeBtn').focus()
                        page.keyboard.press('Enter')
                        check_geometry(page)
                        assert page.locator('#resume-content').is_visible()
                        assert not errors, errors
                        print(f'PASS {browser_name}: touch={touch}, DPR={scale}; 9 sizes, continuous joins, rapid clicks, mid-animation resize, themes, keyboard and reduced motion.')
                    finally:
                        context.close()
            finally:
                browser.close()
    finally:
        server.shutdown()
        thread.join()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', choices=['chromium', 'firefox', 'webkit'], default='chromium')
    run(parser.parse_args().browser)
