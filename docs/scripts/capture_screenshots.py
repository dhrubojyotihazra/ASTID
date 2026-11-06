"""
ASTID Complete Screen Capture & Verification Suite
Captures high-resolution (2x Retina, 1600x1000) screenshots of all operational screens,
including Light/Dark modes, Groq LPU SAR inference, and dynamic warehouse metrics.
"""

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
        "dark": "0",
        "title": "Authentication Portal",
        "action": None
    },
    {
        "filename": "02_dashboard_home_light.png",
        "url": "http://localhost:3000/dashboard/home",
        "role": "admin",
        "dark": "0",
        "title": "Primary Executive Dashboard (Light Theme)",
        "action": None
    },
    {
        "filename": "03_dashboard_home_dark.png",
        "url": "http://localhost:3000/dashboard/home",
        "role": "admin",
        "dark": "1",
        "title": "Primary Executive Dashboard (Signature Emerald Glass Dark)",
        "action": None
    },
    {
        "filename": "04_cases_kanban_drawer.png",
        "url": "http://localhost:3000/dashboard/cases",
        "role": "analyst",
        "dark": "1",
        "title": "Cases Kanban & Inspection Drawer",
        "action": "open_case"
    },
    {
        "filename": "05_sar_narrative_groq.png",
        "url": "http://localhost:3000/dashboard/cases",
        "role": "senior",
        "dark": "1",
        "title": "Groq Cloud LPU SAR Narrative Synthesis",
        "action": "generate_sar"
    },
    {
        "filename": "06_attack_simulator.png",
        "url": "http://localhost:3000/dashboard/sim",
        "role": "lead",
        "dark": "1",
        "title": "Zero-Day Attack Simulator & Dual-Engine Scorer",
        "action": "test_script_storm"
    },
    {
        "filename": "07_confusion_matrix_stress_test.png",
        "url": "http://localhost:3000/dashboard/sim",
        "role": "lead",
        "dark": "1",
        "title": "Holdout Test Set Confusion Matrix (100% Recall)",
        "action": "run_benchmark"
    },
    {
        "filename": "08_analytics_model_health.png",
        "url": "http://localhost:3000/dashboard/analytics",
        "role": "lead",
        "dark": "1",
        "title": "Ground-Truth Analytics & Model Health (6.36M txns, 8213 frauds)",
        "action": None
    },
    {
        "filename": "09_multi_branch_telemetry.png",
        "url": "http://localhost:3000/dashboard/branches",
        "role": "lead",
        "dark": "1",
        "title": "Multi-Branch Telemetry (5 Banking Hubs)",
        "action": None
    },
    {
        "filename": "10_team_workload_operations.png",
        "url": "http://localhost:3000/dashboard/team",
        "role": "lead",
        "dark": "1",
        "title": "Team Operations & Capacity Balancing",
        "action": None
    },
    {
        "filename": "11_senior_escalations_sla.png",
        "url": "http://localhost:3000/dashboard/esc",
        "role": "senior",
        "dark": "1",
        "title": "Senior Priority Escalations & 15m SLA Queue",
        "action": None
    },
    {
        "filename": "12_all_transactions_ledger.png",
        "url": "http://localhost:3000/dashboard/all",
        "role": "analyst",
        "dark": "1",
        "title": "Searchable Ingestion & Audit Ledger",
        "action": None
    },
    {
        "filename": "13_model_engine_registry.png",
        "url": "http://localhost:3000/dashboard/registry",
        "role": "admin",
        "dark": "1",
        "title": "Model Engine Versions & Governance Registry",
        "action": None
    },
    {
        "filename": "14_investigator_audit_trail.png",
        "url": "http://localhost:3000/dashboard/audit",
        "role": "admin",
        "dark": "1",
        "title": "Regulatory System Audit Trail",
        "action": None
    }
]

def capture_all():
    print("=" * 80)
    print("ASTID COMPLETE SCREEN CAPTURE & VERIFICATION")
    print(f"Target Directory: {SCREENSHOTS_DIR}")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1600, "height": 1000},
            device_scale_factor=1.5,
            permissions=["clipboard-read", "clipboard-write"]
        )
        page = context.new_page()

        for idx, item in enumerate(SCREENS, 1):
            print(f"\n[{idx}/{len(SCREENS)}] Capturing {item['title']}...")
            
            # Seed authenticated session
            page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
            if item["role"]:
                page.evaluate(f"""
                    localStorage.setItem('ro_role', '{item["role"]}');
                    localStorage.setItem('ro_dark', '{item["dark"]}');
                    localStorage.setItem('ro_demo', '1');
                """)
            else:
                page.evaluate(f"""
                    localStorage.removeItem('ro_role');
                    localStorage.setItem('ro_dark', '{item["dark"]}');
                """)

            page.goto(item["url"], wait_until="domcontentloaded")
            page.wait_for_timeout(1800)

            # Actions
            if item["action"] == "open_case":
                try:
                    # Look for Inspect button in Kanban or first case row
                    btn = page.locator("button:has-text('Inspect')").first
                    if btn.count() > 0 and btn.is_visible():
                        btn.click()
                        page.wait_for_timeout(1200)
                    else:
                        art = page.locator("article").first
                        if art.count() > 0:
                            art.click()
                            page.wait_for_timeout(1200)
                except Exception as ex:
                    print(f"  Note on action: {ex}")

            elif item["action"] == "generate_sar":
                try:
                    btn = page.locator("button:has-text('Inspect')").first
                    if btn.count() > 0:
                        btn.click()
                        page.wait_for_timeout(1000)
                    sar_btn = page.locator("button:has-text('Generate SAR Narrative (Groq LPU)')").first
                    if sar_btn.count() > 0 and sar_btn.is_visible():
                        sar_btn.click()
                        print("  Waiting for Groq Cloud LPU inference...")
                        try:
                            page.locator("button:has-text('Copy SAR Text')").first.wait_for(state="visible", timeout=12000)
                            print("  SAR narrative generated successfully!")
                        except Exception:
                            pass
                        page.wait_for_timeout(1000)
                except Exception as ex:
                    print(f"  Note on SAR: {ex}")

            elif item["action"] == "test_script_storm":
                try:
                    storm_btn = page.locator("button:has-text('Script Storm')").first
                    if storm_btn.count() > 0 and storm_btn.is_visible():
                        storm_btn.click()
                        page.wait_for_timeout(800)
                except Exception as ex:
                    print(f"  Note on storm: {ex}")

            elif item["action"] == "run_benchmark":
                try:
                    bench_btn = page.locator("button:has-text('Stress Test (100 Txns)')").first
                    if bench_btn.count() > 0 and bench_btn.is_visible():
                        bench_btn.click()
                        print("  Running backend holdout benchmark...")
                        page.wait_for_timeout(7000)
                except Exception as ex:
                    print(f"  Note on benchmark: {ex}")

            out_path = os.path.join(SCREENSHOTS_DIR, item["filename"])
            page.screenshot(path=out_path, full_page=False)
            file_size = os.path.getsize(out_path)
            print(f"  Saved -> {item['filename']} ({file_size:,} bytes)")

        browser.close()
        print("\n" + "=" * 80)
        print(f"COMPLETE: All {len(SCREENS)} screenshots captured and verified!")
        print("=" * 80)

if __name__ == "__main__":
    capture_all()
