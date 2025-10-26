import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    # Get the absolute path to the index.html file
    file_path = os.path.abspath('index.html')
    page.goto(f'file://{file_path}')
    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()