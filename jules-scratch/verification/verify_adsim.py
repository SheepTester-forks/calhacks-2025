from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3001/upload")

    # Upload a file
    page.set_input_files('input[type="file"]', 'README.md')

    # Click the analyze button
    page.get_by_role("button", name="Analyze Ad").click()

    # Wait for a while to let the chat render
    time.sleep(10)

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)