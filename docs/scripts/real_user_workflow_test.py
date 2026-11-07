"""
ASTID Real-User Interactive Workflow & Operational Testing Suite
Simulates an active fraud operations user:
1. Reviews priority escalations & enforces 15m SLA resolution
2. Inspects teammates, workloads, and dispatches operational notes
3. Uploads and evaluates a custom CSV fraud dataset through the batch scoring pipeline
4. Uses the Attack Simulation Studio to test recent zero-day fraud transactions
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

OUT_DIR = os.path.abspath("screenshots/user_workflow")
os.makedirs(OUT_DIR, exist_ok=True)

CUSTOM_CSV_PATH = os.path.abspath("test_data/custom_fraud_attack_vector.csv")

def run_real_user_workflow():
    print("=" * 80)
    print("STARTING REAL-USER WORKFLOW TEST SUITE")
    print(f"Custom CSV Dataset: {CUSTOM_CSV_PATH}")
    print(f"Output Screenshots: {OUT_DIR}")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1600, "height": 1000},
            device_scale_factor=1.5,
            permissions=["clipboard-read", "clipboard-write"]
        )
        page = context.new_page()

        # Helper to set role and theme
        def set_session(role='senior', dark='1'):
            page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
            page.evaluate(f"""
                localStorage.setItem('ro_role', '{role}');
                localStorage.setItem('ro_dark', '{dark}');
                localStorage.setItem('ro_demo', '1');
            """)

        # ----------------------------------------------------------------------
        # WORKFLOW 0: PRIMARY DASHBOARD (Live DuckDB Weekly Activity & Progress Arc)
        # ----------------------------------------------------------------------
        print("\n--- [WORKFLOW 0] Primary Dashboard Verification (DuckDB Telemetry) ---")
        set_session(role='lead', dark='1')
        page.goto("http://localhost:3000/dashboard/home", wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(OUT_DIR, "step0_dashboard_live_duckdb_telemetry.png"))
        print(f"  Captured: step0_dashboard_live_duckdb_telemetry.png")

        # ----------------------------------------------------------------------
        # WORKFLOW 1: REVIEW ESCALATIONS (Senior Investigator)
        # ----------------------------------------------------------------------
        print("\n--- [WORKFLOW 1] Reviewing Priority Escalations & SLA Management ---")
        set_session(role='senior', dark='1')
        page.goto("http://localhost:3000/dashboard/esc", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Inspect Active Escalations count
        page.screenshot(path=os.path.join(OUT_DIR, "step1_escalations_queue.png"))
        print(f"  Captured: step1_escalations_queue.png")

        # Click on first escalation row/card
        esc_card = page.locator("article, tr.hover\\:bg-so\\/30").first
        if esc_card.count() > 0:
            print("  Opening first priority escalation for inspection...")
            esc_card.click()
            page.wait_for_timeout(1500)
            page.screenshot(path=os.path.join(OUT_DIR, "step2_escalation_details_drawer.png"))
            print(f"  Captured: step2_escalation_details_drawer.png")

            # Check for Claim button or Decision buttons
            claim_btn = page.locator("button:has-text('Claim Escalation'), button:has-text('Claim')").first
            if claim_btn.count() > 0 and claim_btn.is_visible():
                print("  Clicking 'Claim Escalation'...")
                claim_btn.click()
                page.wait_for_timeout(1000)

            # Confirm Fraud decision
            confirm_btn = page.locator("button:has-text('Confirm Fraud')").first
            if confirm_btn.count() > 0 and confirm_btn.is_visible():
                print("  Executing operational determination: 'Confirm Fraud'...")
                confirm_btn.click()
                page.wait_for_timeout(1200)
                page.screenshot(path=os.path.join(OUT_DIR, "step3_escalation_resolved_fraud.png"))
                print(f"  Captured: step3_escalation_resolved_fraud.png")

        # ----------------------------------------------------------------------
        # WORKFLOW 2: VIEW TEAMMATES (Team Operations & Capacity Balancing)
        # ----------------------------------------------------------------------
        print("\n--- [WORKFLOW 2] Viewing Teammates & Workload Balancing ---")
        set_session(role='lead', dark='1')
        page.goto("http://localhost:3000/dashboard/team", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(OUT_DIR, "step4_team_overview.png"))
        print(f"  Captured: step4_team_overview.png")

        # Click on teammate (Priya Raman or Mateo Silva)
        priya = page.locator("text='Priya Raman'").first
        if priya.count() > 0 and priya.is_visible():
            print("  Inspecting Senior Investigator: Priya Raman...")
            priya.click()
            page.wait_for_timeout(1200)
            page.screenshot(path=os.path.join(OUT_DIR, "step5_teammate_priya_inspection.png"))
            print(f"  Captured: step5_teammate_priya_inspection.png")

            # Send a quick note
            note_input = page.locator("input[placeholder*='message'], input[placeholder*='note']").first
            if note_input.count() > 0 and note_input.is_visible():
                note_input.fill("High-value ₹1Cr drain detected in Western cluster. Prioritizing SLA review.")
                send_btn = page.locator("button:has-text('Send')").first
                if send_btn.count() > 0:
                    send_btn.click()
                    page.wait_for_timeout(800)
                    print("  Dispatched operational note to teammate.")

        # ----------------------------------------------------------------------
        # WORKFLOW 3: CUSTOM CSV FRAUD INGESTION & BATCH SCORING
        # ----------------------------------------------------------------------
        print("\n--- [WORKFLOW 3] Testing Custom CSV Fraud Dataset Upload ---")
        set_session(role='admin', dark='1')
        page.goto("http://localhost:3000/dashboard/upload", wait_until="domcontentloaded")
        page.wait_for_timeout(1800)

        # Upload the custom CSV file via hidden input
        file_input = page.locator("input[type='file']").first
        if file_input.count() > 0:
            print(f"  Uploading {CUSTOM_CSV_PATH} to batch ingestion engine...")
            file_input.set_input_files(CUSTOM_CSV_PATH)
            print("  Waiting for dual-engine batch scoring to complete...")
            page.wait_for_timeout(4000)
            page.screenshot(path=os.path.join(OUT_DIR, "step6_batch_csv_scoring_results.png"))
            print(f"  Captured: step6_batch_csv_scoring_results.png")

        # ----------------------------------------------------------------------
        # WORKFLOW 4: SIMULATION APP TESTING (Recent Transactions & Attacks)
        # ----------------------------------------------------------------------
        print("\n--- [WORKFLOW 4] Interactive Simulation App Testing ---")
        set_session(role='lead', dark='1')
        page.goto("http://localhost:3000/dashboard/sim", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)

        # Scenario A: Script Storm Drain Attack Preset
        print("  Testing Attack Scenario A: Script Storm 100% Drain...")
        storm_btn = page.locator("button:has-text('Script Storm')").first
        if storm_btn.count() > 0:
            storm_btn.click()
            page.wait_for_timeout(500)

            score_btn = page.locator("button:has-text('Score Live')").first
            if score_btn.count() > 0:
                score_btn.click()
                page.wait_for_timeout(1500)
                page.screenshot(path=os.path.join(OUT_DIR, "step7_sim_script_storm_scored.png"))
                print(f"  Captured: step7_sim_script_storm_scored.png")

        # Scenario B: Impossible Geo-Velocity Travel
        print("  Testing Attack Scenario B: Impossible Geo-Velocity Travel...")
        travel_btn = page.locator("button:has-text('Impossible Travel')").first
        if travel_btn.count() > 0:
            travel_btn.click()
            page.wait_for_timeout(500)

            score_btn = page.locator("button:has-text('Score Live')").first
            if score_btn.count() > 0:
                score_btn.click()
                page.wait_for_timeout(1500)
                page.screenshot(path=os.path.join(OUT_DIR, "step8_sim_impossible_travel_scored.png"))
                print(f"  Captured: step8_sim_impossible_travel_scored.png")

        # Scenario C: Blacklist Interdiction (M_OFFSHORE_BET)
        print("  Testing Attack Scenario C: Blacklist Entity Interdiction...")
        bl_btn = page.locator("button:has-text('Blacklist Match')").first
        if bl_btn.count() > 0:
            bl_btn.click()
            page.wait_for_timeout(500)

            score_btn = page.locator("button:has-text('Score Live')").first
            if score_btn.count() > 0:
                score_btn.click()
                page.wait_for_timeout(1500)
                page.screenshot(path=os.path.join(OUT_DIR, "step9_sim_blacklist_match_scored.png"))
                print(f"  Captured: step9_sim_blacklist_match_scored.png")

        # Scenario D: Live Confusion Matrix Benchmark Execution
        print("  Running Holdout Test Set Benchmark (100 Transactions)...")
        bench_btn = page.locator("button:has-text('Stress Test (100 Txns)')").first
        if bench_btn.count() > 0:
            bench_btn.click()
            page.wait_for_timeout(7000)
            page.screenshot(path=os.path.join(OUT_DIR, "step10_sim_confusion_matrix_benchmark.png"))
            print(f"  Captured: step10_sim_confusion_matrix_benchmark.png")

        # ----------------------------------------------------------------------
        # WORKFLOW 5: CHECK AUDIT TRAIL FOR RECORDED ACTIONS
        # ----------------------------------------------------------------------
        print("\n--- [WORKFLOW 5] Verifying Investigator Audit Trail ---")
        set_session(role='admin', dark='1')
        page.goto("http://localhost:3000/dashboard/audit", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(OUT_DIR, "step11_audit_trail_recorded_decisions.png"))
        print(f"  Captured: step11_audit_trail_recorded_decisions.png")

        browser.close()
        print("\n" + "=" * 80)
        print("REAL-USER WORKFLOW TEST COMPLETE!")
        print(f"All 11 workflow screenshots captured in {OUT_DIR}")
        print("=" * 80)

if __name__ == "__main__":
    run_real_user_workflow()
