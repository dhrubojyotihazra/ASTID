import os
import time
from playwright.sync_api import sync_playwright

OUT_DIR = os.path.abspath("screenshots/user_workflow")
os.makedirs(OUT_DIR, exist_ok=True)
CUSTOM_CSV_PATH = os.path.abspath("test_data/custom_fraud_attack_vector.csv")

def capture_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1600, "height": 1000},
            device_scale_factor=1.5
        )
        page = context.new_page()

        def set_session(role='lead', dark='1'):
            page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
            page.evaluate(f"""
                localStorage.setItem('ro_role', '{role}');
                localStorage.setItem('ro_dark', '{dark}');
                localStorage.setItem('ro_demo', '1');
            """)

        # 1. Primary Dashboard: Live DuckDB Weekly Activity & Dynamic Progress Arc
        print("1. Capturing Primary Dashboard...")
        set_session(role='lead', dark='1')
        page.goto("http://localhost:3000/dashboard/home", wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(OUT_DIR, "01_dashboard_live_duckdb_connected.png"))

        # 2. Team View: Real Members & Caseloads
        print("2. Capturing Team View...")
        page.goto("http://localhost:3000/dashboard/team", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(OUT_DIR, "02_team_view_live_database.png"))

        # 3. Analytics View: 20-Week DuckDB Heatmap & Top Reviewers
        print("3. Capturing Analytics View...")
        page.goto("http://localhost:3000/dashboard/analytics", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(OUT_DIR, "03_analytics_20week_heatmap_connected.png"))

        # 4. Standalone Simulation Studio Window (/simulation)
        print("4. Capturing Standalone Simulation Studio (/simulation)...")
        page.goto("http://localhost:3000/simulation", wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(OUT_DIR, "04_standalone_simulation_studio_window.png"))

        # Click Script Storm Attack preset inside the standalone studio
        print("   Testing Script Storm preset in standalone window...")
        storm_preset = page.locator("button:has-text('Script Storm')").first
        if storm_preset.count() > 0:
            storm_preset.click()
            page.wait_for_timeout(2000)
            page.screenshot(path=os.path.join(OUT_DIR, "05_standalone_simulation_storm_scored.png"))

        # 5. Batch CSV Upload with Custom Fraud Data
        print("5. Capturing Batch Upload Test...")
        page.goto("http://localhost:3000/dashboard/upload", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        file_input = page.locator("input[type='file']").first
        if file_input.count() > 0:
            file_input.set_input_files(CUSTOM_CSV_PATH)
            page.wait_for_timeout(3500)
            page.screenshot(path=os.path.join(OUT_DIR, "06_batch_csv_custom_fraud_scored.png"))

        browser.close()
        print("All verification screenshots successfully captured!")

if __name__ == "__main__":
    capture_verification()

