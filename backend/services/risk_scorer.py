from typing import List

from models.schemas import Clause, RiskCategory, RiskScore


def compute_fallback_risk_score(clauses: List[Clause]) -> RiskScore:
    if not clauses:
        return RiskScore(
            overall=0,
            categories=[
                RiskCategory(label="Payment Risk", score=0, summary="No payment terms were detected."),
                RiskCategory(label="Privacy Risk", score=0, summary="No privacy terms were detected."),
                RiskCategory(label="Exit Risk", score=0, summary="No exit constraints were detected."),
                RiskCategory(label="Liability Risk", score=0, summary="No liability transfer clauses were detected.")
            ]
        )

    severity_weight = sum((c.red_flag.severity if c.red_flag else 0) * 12 for c in clauses)
    base = min(100, severity_weight // max(1, len(clauses)) + 20)

    payment = min(100, base + _category_bonus(clauses, {"payment", "renewal"}))
    privacy = min(100, base + _category_bonus(clauses, {"privacy"}))
    exit_risk = min(100, base + _category_bonus(clauses, {"termination", "dispute_resolution", "renewal"}))
    liability = min(100, base + _category_bonus(clauses, {"liability", "non_compete", "intellectual_property"}))

    overall = int(round((payment + privacy + exit_risk + liability) / 4))
    return RiskScore(
        overall=overall,
        categories=[
            RiskCategory(label="Payment Risk", score=payment, summary="Covers fees, penalties, and renewal payment obligations."),
            RiskCategory(label="Privacy Risk", score=privacy, summary="Covers data collection, sharing, and usage controls."),
            RiskCategory(label="Exit Risk", score=exit_risk, summary="Covers cancellation rights, lock-ins, and dispute terms."),
            RiskCategory(label="Liability Risk", score=liability, summary="Covers indemnity, limits of liability, and one-sided obligations.")
        ]
    )


def _category_bonus(clauses: List[Clause], clause_types: set[str]) -> int:
    score = 0
    for clause in clauses:
        if clause.clause_type.value in clause_types and clause.red_flag:
            score += clause.red_flag.severity * 10
    return min(score, 45)
