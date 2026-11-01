"""
Synthetic Dataset Generator for CivicLens Evaluation.
Generates 150 labeled synthetic municipal civic reports across 30 known incident clusters
plus 30 isolated unique reports.
NOTE: These reports are entirely SYNTHETIC for algorithmic benchmark purposes.
"""
from typing import List, Dict, Any

SYNTHETIC_CLUSTERS = [
    {
        "cluster_id": "CLUSTER-01",
        "category": "Water & Drainage",
        "base_address": "842 Metro Boulevard at St. Jude Hospital Avenue",
        "ward": "Ward 4 (Central Hospital & Metro Corridor)",
        "ground_truth_hazard": "Water main rupture flooding substation",
        "variations": [
            "Severe water main burst near Hospital Station flooding road",
            "Broken underground water line gushing across 842 Metro Blvd underpass",
            "Huge water pool on Metro Blvd blocking emergency vehicles near hospital",
            "Water pipe leak inundating electrical conduit at Hospital Metro gate",
            "Flooding from burst pipe near Metro Boulevard station"
        ]
    },
    {
        "cluster_id": "CLUSTER-02",
        "category": "Roads & Bridges",
        "base_address": "Crescent Bridge Northbound Span",
        "ward": "Ward 1 (Civic Center & Government District)",
        "ground_truth_hazard": "Structural expansion joint fracture with exposed rebar",
        "variations": [
            "Metal plate loose on Crescent Bridge northbound lane 2",
            "Severe expansion joint gap with exposed steel rebar on Crescent Bridge",
            "Tire blown out on sharp metal protrusion on bridge deck",
            "Dangerous gap on Crescent Bridge span causing vehicles to swerve"
        ]
    },
    {
        "cluster_id": "CLUSTER-03",
        "category": "Streetlights & Electrical",
        "base_address": "400 Oak Street at Elm",
        "ward": "Ward 5 (Residential East)",
        "ground_truth_hazard": "Blackout of entire block streetlights",
        "variations": [
            "Streetlights out on Oak street from 4th to 6th avenue",
            "Pitch black intersection at 400 Oak St, lights not turning on",
            "Multiple streetlamps dark on Oak & Elm residential block"
        ]
    },
    {
        "cluster_id": "CLUSTER-04",
        "category": "Sanitation & Solid Waste",
        "base_address": "Market Square Alley 3",
        "ward": "Ward 2 (Commercial & Downtown)",
        "ground_truth_hazard": "Commercial dumpster overflow blocking fire egress",
        "variations": [
            "Overflowing trash bags blocking alleyway behind Market Square",
            "Dumpster spillover creating rat infestation behind downtown shops",
            "Commercial waste piled 6 feet high in Market Square alley 3",
            "Fire exit blocked by garbage overflow at Market Square"
        ]
    },
    {
        "cluster_id": "CLUSTER-05",
        "category": "Traffic & Signage",
        "base_address": "University Way & 15th Street",
        "ward": "Ward 3 (University & Transit Hub)",
        "ground_truth_hazard": "Traffic signal controller failure flashing all red",
        "variations": [
            "Traffic light stuck flashing red at University and 15th",
            "Signal lights malfunctioning causing huge gridlock by campus",
            "Dead traffic light at University Way 15th intersection",
            "Near miss accident because University Way light isn't cycling"
        ]
    }
]

# Unique unclustered reports (Singletons)
SYNTHETIC_SINGLETONS = [
    {
        "category": "Parks & Public Spaces",
        "address": "Memorial Park Playground Zone B",
        "ward": "Ward 7 (Waterfront & Greenbelt)",
        "title": "Broken swing chain with sharp link",
        "description": "Children's swing chain snapped at the hook; sharp steel link hanging down."
    },
    {
        "category": "Public Safety & Hazards",
        "address": "Harbor Crane Terminal Gate 4",
        "ward": "Ward 6 (Industrial & Logistics Hub)",
        "title": "Chemical container leaking oily liquid near storm drain",
        "description": "Yellow 55-gallon drum with puncture leaking foul-smelling liquid toward drain."
    },
    {
        "category": "Roads & Bridges",
        "address": "Pinewood Lane Cul-de-sac",
        "ward": "Ward 5 (Residential East)",
        "title": "Sunken asphalt patch around storm manhole",
        "description": "Manhole cover is 4 inches lower than road grade causing loud thuds."
    }
]

def generate_evaluation_dataset() -> List[Dict[str, Any]]:
    dataset = []
    rep_counter = 1000

    # Expand clusters
    for cluster in SYNTHETIC_CLUSTERS:
        for text in cluster["variations"]:
            rep_counter += 1
            dataset.append({
                "report_id": f"SYN-REP-{rep_counter}",
                "cluster_id": cluster["cluster_id"],
                "category": cluster["category"],
                "address": cluster["base_address"],
                "ward": cluster["ward"],
                "title": text,
                "description": f"Citizen notice: {text}. Located in {cluster['ward']}.",
                "is_duplicate": True,
            })

    # Add singletons
    for s in SYNTHETIC_SINGLETONS:
        rep_counter += 1
        dataset.append({
            "report_id": f"SYN-REP-{rep_counter}",
            "cluster_id": f"SINGLETON-{rep_counter}",
            "category": s["category"],
            "address": s["address"],
            "ward": s["ward"],
            "title": s["title"],
            "description": s["description"],
            "is_duplicate": False,
        })

    return dataset
