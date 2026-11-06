"""
ASTID Deterministic Rules Engine
Evaluates fast-path blacklists, velocity thresholds, and Indian UPI limits.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List

# Seed blacklisted mule and fraud account identifiers
DEFAULT_BLACKLIST = {
    "C1234567890", "C9876543210", "M1122334455", "M9988776655",
    "mule.scam@okaxis", "hacker@ybl", "fraudster@paytm",
    "M_OFFSHORE_BET", "M_CRYPTO_EXCH"
}

@dataclass
class RuleResult:
    is_blacklisted: bool = False
    critical_hit: bool = False
    soft_flag_boost: float = 0.0
    matched_rules: List[str] = field(default_factory=list)
    primary_reason: str = "Clean Transaction"

class RulesEngine:
    def __init__(self, blacklist: set = None, upi_cap: float = 100000.0):
        self.blacklist = blacklist if blacklist is not None else DEFAULT_BLACKLIST
        self.upi_cap = upi_cap

    def evaluate(self, tx: Dict[str, Any], account_state: Dict[str, Any] = None) -> RuleResult:
        result = RuleResult()
        orig = str(tx.get("nameOrig", ""))
        dest = str(tx.get("nameDest", ""))
        amount = float(tx.get("amount", 0.0))
        tx_type = str(tx.get("type", "")).upper()
        step = int(tx.get("step", 1))
        hour = step % 24

        state = account_state or {}
        velocity_1h = float(state.get("velocity_1h", 1.0))

        # 1. Critical Hard Rule: Blacklist Check
        if orig in self.blacklist or dest in self.blacklist:
            result.is_blacklisted = True
            result.critical_hit = True
            result.primary_reason = f"Confirmed Fraud Blacklist Match: {orig if orig in self.blacklist else dest}"
            result.matched_rules.append("CRITICAL_BLACKLIST_MATCH")
            return result

        # 2. Critical Rule: Single UPI Transaction Limit Exceeded (NPCI limit: ₹1,00,000)
        if "UPI" in tx_type and amount > self.upi_cap:
            result.critical_hit = True
            result.primary_reason = f"NPCI UPI Ceiling Breached (₹{amount:,.0f} > ₹{self.upi_cap:,.0f})"
            result.matched_rules.append("UPI_LIMIT_BREACH")

        # 3. Soft Flag: High Velocity Burst in 1-hour window
        if velocity_1h >= 5.0:
            result.soft_flag_boost += 0.20
            result.matched_rules.append(f"HIGH_VELOCITY_BURST_{int(velocity_1h)}_TX_1H")
            if not result.critical_hit:
                result.primary_reason = f"Velocity Anomaly: {int(velocity_1h)} transactions in trailing hour"

        # 4. Soft Flag: Late Night / Off-Hours Transaction (01:00 AM - 04:00 AM)
        if 1 <= hour <= 4:
            result.soft_flag_boost += 0.10
            result.matched_rules.append("OFF_HOURS_MIDNIGHT_DRAIN")
            if not result.critical_hit and result.primary_reason == "Clean Transaction":
                result.primary_reason = f"Off-Hours Activity ({hour:02d}:00 AM window)"

        # 5. Soft Flag: High-Risk Category Transfer
        if tx_type == "TRANSFER" and amount >= 200000.0:
            result.soft_flag_boost += 0.15
            result.matched_rules.append("HIGH_VALUE_WIRE_TRANSFER")
            if not result.critical_hit and result.primary_reason == "Clean Transaction":
                result.primary_reason = f"High-Value Outbound Transfer (₹{amount:,.0f})"

        # 6. Soft Flag: Near-Total Account Depletion (> 90% balance drained on significant outbound amounts)
        old_org = float(tx.get("oldbalanceOrg", 0.0))
        if tx_type != "CASH_IN" and old_org > 0 and (amount / old_org) >= 0.90 and amount >= 50000.0:
            result.soft_flag_boost += 0.25
            result.matched_rules.append("CRITICAL_BALANCE_DRAIN_RATIO")
            if not result.critical_hit and result.primary_reason == "Clean Transaction":
                result.primary_reason = f"Near-Total Account Liquidation ({min(100.0, amount / old_org * 100):.1f}% balance drained)"

        return result
