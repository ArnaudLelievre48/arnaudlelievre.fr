"""Check home bounds with iPhone-sized visual viewports and reserved browser space."""

import argparse
import logging
import sys
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright
from werkzeug.serving import make_server

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend import app


CASES = [
    (393, 852, '59px 8px 34px', 'iPhone 15 Pro'),
    (393, 700, '20px 8px 20px', 'browser bars visible'),
    (393, 640, '20px 8px 20px', 'shorter visual viewport'),
    (393, 570, '20px 8px 20px', 'compact visual viewport'),
    (320, 568, '8px', 'small phone'),
    (320, 480, '8px', 'small short phone'),
    (852, 393, '8px 59px 21px', 'iPhone landscape'),
    (667, 320, '8px 20px 21px', 'small landscape'),
]


def run(browser_name):
    logging.getLogger('werkzeug').setLevel(logging.ERROR)
    server = make_server('127.0.0.1', 0, app)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as playwright:
            browser = getattr(playwright, browser_name).launch(headless=True)
            try:
                device = dict(playwright.devices['iPhone 15 Pro'])
                if browser_name == 'firefox':
                    device.pop('is_mobile')
                context = browser.new_context(**device)
                try:
                    # Also exercise the font fallback when external fonts cannot load.
                    context.route('https://**/*', lambda route: route.abort())
                    page = context.new_page()
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='networkidle')
                    for width, height, padding, name in CASES:
                        page.set_viewport_size({'width': width, 'height': height})
                        page.evaluate('(padding) => document.body.style.padding = padding', padding)
                        page.locator('#homeBtn').click()
                        page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
                        results = page.locator('#home-content').evaluate('''home => {
                            const pane = home.getBoundingClientRect();
                            const intro = home.querySelector('.right-hero').getBoundingClientRect();
                            const inside = (rect, bounds) => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1 &&
                                rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1;
                            home.scrollTop = 1000;
                            return {
                                noOverflow: home.scrollHeight <= home.clientHeight + 1 && home.scrollWidth <= home.clientWidth + 1,
                                noScroll: home.scrollTop === 0,
                                textVisible: [...home.querySelectorAll('p')].every(el =>
                                    inside(el.getBoundingClientRect(), pane) &&
                                    (!el.closest('.right-hero') || inside(el.getBoundingClientRect(), intro))),
                                readableSize: [...home.querySelectorAll('.right-hero-text')].every(el =>
                                    parseFloat(getComputedStyle(el).fontSize) >= 14),
                                touchTargets: [...home.querySelectorAll('a')].every(el => {
                                    const rect = el.getBoundingClientRect(); return rect.width >= 44 && rect.height >= 44;
                                }),
                                particlesVisible: (() => {
                                    const canvas = document.getElementById('fluidCanvas');
                                    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
                                    return pixels.some((value, index) => index % 4 === 3 && value > 0);
                                })()
                            };
                        }''')
                        assert all(results.values()), (name, results)
                    page.locator('#projectsBtn').click()
                    page.set_viewport_size({'width': 393, 'height': 700})
                    page.locator('#homeBtn').click()
                    page.wait_for_function('''() => {
                        const canvas = document.getElementById('fluidCanvas');
                        return canvas.width === Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 2));
                    }''')
                    assert not errors, errors
                    print(f'PASS {browser_name}: all text visible without scrolling in 8 layouts, readable type, touch targets, particles and resize after tab switching.')
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
