# arnaudlelievre.fr

"dev" branch of my website : arnaudlelievre.fr, where I am re-making the website from scratch because I did not like what I have done in the main branch.

Navigation regression checks (requires Flask, Playwright and its browser binaries):

```sh
python tests/navigation_smoke.py --browser chromium
```

The same checks can run with `--browser firefox` or `--browser webkit`.
