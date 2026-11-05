"""
ASTID Geo-Velocity & Impossible Travel Detector
Calculates spherical Haversine distance between sequential transaction coordinates.
Flags supersonic travel (>900 km/h commercial flight speed) indicative of credential sharing or credential stuffing.
"""

import math
from typing import Tuple, Dict, Any, Optional

# Indian Commercial Banking Hub Coordinates (Lat, Lon)
BRANCH_COORDINATES = {
    "Kolkata-SaltLake": (22.5867, 88.4178),
    "Mumbai-BKC": (19.0662, 72.8687),
    "Bengaluru-HSR": (12.9116, 77.6389),
    "Delhi-Connaught": (28.6315, 77.2167),
    "Chennai-Guindy": (13.0067, 80.2025)
}

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance in kilometers using the Haversine formula."""
    r = 6371.0  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c

class GeoVelocityChecker:
    def __init__(self, max_speed_kmh: float = 900.0):
        self.max_speed_kmh = max_speed_kmh

    def check(
        self,
        current_loc: Tuple[float, float],
        previous_loc: Optional[Tuple[float, float]],
        hours_elapsed: float
    ) -> Tuple[bool, float, float, str]:
        """
        Calculates travel speed and flags impossible travel.
        Returns: (is_anomaly: bool, speed_kmh: float, risk_boost: float, badge_text: str)
        """
        if not previous_loc or hours_elapsed <= 0.0:
            return False, 0.0, 0.0, ""

        dist_km = haversine_km(previous_loc[0], previous_loc[1], current_loc[0], current_loc[1])
        # Minimum time quantum = 3 minutes (0.05 hr) to prevent division-by-zero spikes on identical timestamps
        eff_hours = max(0.05, float(hours_elapsed))
        speed_kmh = dist_km / eff_hours

        if speed_kmh > self.max_speed_kmh:
            badge = f"⚡ Impossible Travel: {speed_kmh:,.0f} km/h ({dist_km:,.0f} km in {eff_hours*60:.0f}m)"
            return True, speed_kmh, 0.35, badge

        return False, speed_kmh, 0.0, ""
