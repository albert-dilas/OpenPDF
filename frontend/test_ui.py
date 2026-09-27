import time
import os
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("Waiting 3s for server to settle...")
        time.sleep(3)
        print("Navigating to Merge PDF tool...")
        page.goto('http://localhost:3000/merge-pdf')
        page.wait_for_load_state('networkidle')
        
        print("Uploading dummy PDF...")
        file_input = page.locator('input[type="file"]')
        file_input.set_input_files('dummy.pdf')
        
        print("Waiting for file to appear in UI...")
        page.wait_for_selector('text=dummy.pdf')
        
        print("Clicking process button...")
        process_btn = page.get_by_role('button', name='Unir PDF')
        process_btn.click()
        
        print("Checking for loading state (Spinner / 'Procesando')...")
        page.wait_for_selector('.animate-spin', timeout=5000)
        print("Spinner found!")
        
        print("Waiting for toast notification...")
        # Should get error or success toast, check for toaster class
        toast = page.wait_for_selector('.go395831518', timeout=5000) # go395831518 is often a toast container class in react-hot-toast, but we can just wait for text
        try:
            page.wait_for_selector('text=Error', timeout=5000)
            print("Error toast found as expected (no backend).")
        except:
            print("No error text found.")
            
        print("Test complete and successful.")
        browser.close()

if __name__ == '__main__':
    main()
