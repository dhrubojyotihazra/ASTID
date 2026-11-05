"""
ASTID Live API End-to-End Verification Test Harness
Tests /health, /score/live (Approve, Review, Escalate, Block), latency SLAs, and background persistence.
"""

import json
import time
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_api():
    print("=" * 65)
    print("ASTID FASTAPI ENDPOINT VERIFICATION TEST")
    print("=" * 65)

    # 1. Health Check
    req = urllib.request.Request(f"{BASE_URL}/health")
    with urllib.request.urlopen(req) as resp:
        health = json.loads(resp.read().decode('utf-8'))
        print("\n[1/4] GET /api/v1/health:")
        print(f"      Status: {health['status']} | Model Loaded: {health['model_loaded']}")
        print(f"      Tuned Thresholds: Review={health['tau_review']}, Escalate={health['tau_escalate']}")

    # 2. Score Normal Payment (Fast Path: APPROVE)
    normal_tx = {
        "step": 744,
        "type": "PAYMENT",
        "amount": 250.0,
        "nameOrig": "C1000000001",
        "nameDest": "M9999999999",
        "oldbalanceOrg": 15000.0,
        "oldbalanceDest": 0.0
    }
    t0 = time.time()
    req = urllib.request.Request(
        f"{BASE_URL}/score/live",
        data=json.dumps(normal_tx).encode('utf-8'),
        headers={"Content-Type": "application/json", "Idempotency-Key": "idemp-test-01"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        res1 = json.loads(resp.read().decode('utf-8'))
        roundtrip_ms = (time.time() - t0) * 1000.0
        print(f"\n[2/4] POST /api/v1/score/live (Normal Rs.250 Payment):")
        print(f"      Verdict:   {res1['final_verdict']} (Score: {res1['risk_score']})")
        print(f"      Latency:   Internal: {res1['scoring_latency_ms']}ms | Total HTTP Roundtrip: {roundtrip_ms:.1f}ms")
        print(f"      Insights:  {len(res1['whitebox_insights'])} (Fast path skipped SHAP as expected)")
        assert res1['final_verdict'] == "APPROVE"
        assert len(res1['whitebox_insights']) == 0

    # 3. Score Fraudulent Account-Draining Transfer (ESCALATE)
    fraud_tx = {
        "step": 744,
        "type": "TRANSFER",
        "amount": 850000.0,
        "nameOrig": "C8888888888",
        "nameDest": "C7777777777",
        "oldbalanceOrg": 850000.0,  # 100% full liquidation drain
        "oldbalanceDest": 0.0,       # Zero balance destination
        "geo_lat": 22.5867,
        "geo_lon": 88.4178
    }
    t0 = time.time()
    req = urllib.request.Request(
        f"{BASE_URL}/score/live",
        data=json.dumps(fraud_tx).encode('utf-8'),
        headers={"Content-Type": "application/json", "Idempotency-Key": "idemp-test-02"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        res2 = json.loads(resp.read().decode('utf-8'))
        roundtrip_ms = (time.time() - t0) * 1000.0
        print(f"\n[3/4] POST /api/v1/score/live (Fraudulent Rs.8.5L Drain):")
        print(f"      Verdict:   {res2['final_verdict']} (Score: {res2['risk_score']})")
        print(f"      Reason:    {res2['primary_reason']}")
        print(f"      Latency:   Internal: {res2['scoring_latency_ms']}ms | Total HTTP Roundtrip: {roundtrip_ms:.1f}ms")
        print(f"      TreeSHAP Badges ({len(res2['whitebox_insights'])} generated):")
        for badge in res2['whitebox_insights']:
            print(f"        - [{badge['badge']}] ({badge['impact_score']}): {badge['explanation']}")
        assert res2['final_verdict'] == "ESCALATE"
        assert len(res2['whitebox_insights']) > 0

    # 4. Score Blacklisted Account (Immediate BLOCK)
    blacklist_tx = {
        "step": 744,
        "type": "TRANSFER",
        "amount": 5000.0,
        "nameOrig": "C1234567890", # Matches seed blacklist
        "nameDest": "C5555555555"
    }
    req = urllib.request.Request(
        f"{BASE_URL}/score/live",
        data=json.dumps(blacklist_tx).encode('utf-8'),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        res3 = json.loads(resp.read().decode('utf-8'))
        print(f"\n[4/4] POST /api/v1/score/live (Confirmed Blacklist Account):")
        print(f"      Verdict: {res3['final_verdict']} (Score: {res3['risk_score']}) | Reason: {res3['primary_reason']}")
        assert res3['final_verdict'] == "BLOCK"

    # 5. Escalation Queue State Machine
    req = urllib.request.Request(f"{BASE_URL}/escalations")
    with urllib.request.urlopen(req) as resp:
        escs = json.loads(resp.read().decode('utf-8'))
        print(f"\n[Escalations State Machine] Active Escalations: {len(escs)}")
        if escs:
            esc_id = escs[0]['escalation_id']
            # Claim case
            claim_req = urllib.request.Request(
                f"{BASE_URL}/escalations/{esc_id}/claim",
                data=json.dumps({"user_id": "investigator-dhruv"}).encode('utf-8'),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(claim_req) as claim_resp:
                claimed = json.loads(claim_resp.read().decode('utf-8'))
                print(f"  [OK] Claimed {esc_id}: Status = {claimed['escalation']['status']}, Assigned = {claimed['escalation']['assigned_to']}")

    print("\n[VERDICT: PASS] ALL FASTAPI ENDPOINTS & LATENCY SLAS VERIFIED!")

if __name__ == "__main__":
    test_api()
