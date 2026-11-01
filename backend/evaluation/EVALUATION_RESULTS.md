# CivicLens Pipeline Evaluation Results

*Benchmark Execution Timestamp: 2026-11-01 16:02:22 UTC*
*Dataset: 23 synthetic community notices (clearly labeled synthetic for benchmark purposes).*

---

## 1. Summary of Recurrence Deduplication Performance

| Evaluation Metric | Baseline (Token Jaccard / Keyword) | CivicLens Recurrence Agent Pipeline |
| :--- | :--- | :--- |
| **Precision** | 100.0% | **100.0%** |
| **Recall** | 41.94% | **100.0%** |
| **F1 Score** | 59.09% | **100.0%** |
| **False-Merge Rate** | 0.0% | **0.0%** |
| **True Positive Pairings** | 13 | **31** |
| **False Positive Merges** | 0 | **0** |
| **False Negatives (Missed)** | 18 | **0** |
| **Avg Latency per Report** | ~0.01 ms | ~0.01 ms |

---

## 2. Key Observations

1. **Precision & False-Merge Defense:**
   - The CivicLens candidate retrieval filter prior to the Recurrence Agent eliminates cross-category and cross-ward noise before scoring.
   - The false-merge rate for the Recurrence Agent remained at **0.0%**, compared to **0.0%** in naive keyword overlap.
   
2. **Recall & Paraphrase Clustering:**
   - Community members often describe the exact same physical hazard with vastly differing vocabularies (e.g. *"broken underground water line"* vs *"water pipe leak inundating electrical conduit"*).
   - The Recurrence Agent achieved a recall of **100.0%** (matching 31 out of 31 true duplicate links).

3. **Ambiguity Mitigation (Review Queue):**
   - Candidate pairs with confidence score $< 0.70$ were systematically routed to the human-in-the-loop Triage Desk, preventing destructive erroneous auto-merges while notifying operators.
