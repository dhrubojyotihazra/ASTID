import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.abspath(r"screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

SCREENS = [
    {
        "filename": "01_login_portal.png",
        "url": "http://localhost:3000/login",
        "role": None,
        "title": "Authentication Portal",
        "action": None
    },
    {
        "filename": "02_dashboard_home.png",
        "url": "http://localhost:3000/dashboard/home",
        "role": "analyst",
        "title": "Analyst Dashboard (Home)",
        "action": None
    },
    {
        "filename": "03_cases_kanban_inspection.png",
        "url": "http://localhost:3000/dashboard/cases",
        "role": "analyst",
        "title": "Cases Kanban & Investigation Drawer",
        "action": "open_case"
    },
    {
        "filename": "04_analytics_model_health.png",
        "url": "http://localhost:3000/dashboard/analytics",
        "role": "lead",
        "title": "Analytics & Model Health",
        "action": None
    },
    {
        "filename": "05_team_operations.png",
        "url": "http://localhost:3000/dashboard/team",
        "role": "lead",
        "title": "Team Workload & Operations",
        "action": None
    },
    {
        "filename": "06_all_transactions_ledger.png",
        "url": "http://localhost:3000/dashboard/all",
        "role": "analyst",
        "title": "All Transactions Search Queue",
        "action": None
    },
    {
        "filename": "07_priority_escalations_sla.png",
        "url": "http://localhost:3000/dashboard/esc",
        "role": "senior",
        "title": "Senior Escalations & 15m SLA Queue",
        "action": None
    },
    {
        "filename": "08_threshold_simulator.png",
        "url": "http://localhost:3000/dashboard/sim",
        "role": "lead",
        "title": "Threshold Simulator",
        "action": None
    },
    {
        "filename": "09_model_engine_registry.png",
        "url": "http://localhost:3000/dashboard/registry",
        "role": "admin",
        "title": "Model Engine Versions & Registry",
        "action": None
    },
    {
        "filename": "10_system_audit_trail.png",
        "url": "http://localhost:3000/dashboard/audit",
        "role": "admin",
        "title": "Governance & System Audit Trail",
        "action": None
    }
]

def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use 1600x1000 viewport for clear desktop layout
        context = browser.new_context(
            viewport={"width": 1600, "height": 1000},
            device_scale_factor=2
        )
        page = context.new_page()

        for idx, item in enumerate(SCREENS, 1):
            print(f"[{idx}/10] Capturing {item['title']}...")
            
            # Set role in localStorage if specified
            if item["role"]:
                page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
                page.evaluate(f"""
                    localStorage.setItem('ro_role', '{item["role"]}');
                    localStorage.setItem('ro_dark', '0');
                """)
            else:
                page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
                page.evaluate("""
                    localStorage.removeItem('ro_role');
                    localStorage.setItem('ro_dark', '0');
                """)

            page.goto(item["url"], wait_until="networkidle")
            
            # Dismiss any preloader if present
            page.keyboard.press("Escape")
            time.sleep(1.2)

            if item["action"] == "open_case":
                try:
                    # Click first card in Kanban board
                    card = page.locator("article").first
                    if card.is_visible():
                        card.click()
                        time.sleep(0.8)
                except Exception as e:
                    print(f"  Note on action: {e}")

            out_path = os.path.join(SCREENSHOTS_DIR, item["filename"])
            page.screenshot(path=out_path, full_page=False)
            print(f"  Saved -> {out_path} ({os.path.getsize(out_path)} bytes)")

        browser.close()
        print("\nAll 10 screenshots captured successfully!")

if __name__ == "__main__":
    capture_all()
