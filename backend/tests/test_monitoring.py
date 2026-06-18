"""Tests for the AI Monitoring engine probing + aggregation."""
from app.services import engines, visibility_agg
from app.services.answer_analysis import _analyze_heuristic
from app.services.engines import EngineAnswer


# ── simulation determinism & AEO linkage ──────────────────────────────
def test_simulation_is_deterministic():
    a = engines.simulate("Perplexity", "best EV startup in India", "Ola", 60)
    b = engines.simulate("Perplexity", "best EV startup in India", "Ola", 60)
    assert a.answer_text == b.answer_text
    assert a.analysis.brand_mentioned == b.analysis.brand_mentioned
    assert a.analysis.rank == b.analysis.rank


def test_higher_aeo_score_raises_simulated_visibility():
    """Core value-loop property: better AEO → more mentions across prompts."""
    prompts = [f"best option {i}" for i in range(40)]

    def mention_rate(score: float) -> float:
        hits = sum(
            1 for p in prompts
            if engines.simulate("ChatGPT", p, "Acme", score).analysis.brand_mentioned
        )
        return hits / len(prompts)

    low = mention_rate(20)
    high = mention_rate(90)
    assert high > low


def test_simulated_mode_is_labeled():
    ans = engines.simulate("Gemini", "best tool", "Acme", 50)
    assert ans.mode == "simulated"
    assert "Simulated" in ans.answer_text


# ── heuristic answer analysis (live path) ──────────────────────────────
def test_heuristic_finds_rank_in_numbered_list():
    text = "1. Stripe\n2. Adyen\n3. Braintree\n4. Acme Pay"
    ans = EngineAnswer(engine="ChatGPT", mode="live", model="x", answer_text=text)
    res = _analyze_heuristic(ans, brand="Adyen", domain="adyen.com")
    assert res.brand_mentioned is True
    assert res.rank == 2
    assert "Stripe" in res.competitors


def test_heuristic_detects_citation_from_links():
    ans = EngineAnswer(
        engine="Perplexity", mode="live", model="sonar",
        answer_text="Acme is a leader [1].",
        citations=["https://www.acme.com/about"],
    )
    res = _analyze_heuristic(ans, brand="Acme", domain="acme.com")
    assert res.cited is True


def test_heuristic_absent_brand():
    ans = EngineAnswer(engine="Claude", mode="live", model="x",
                       answer_text="1. Stripe\n2. Adyen")
    res = _analyze_heuristic(ans, brand="Acme", domain="acme.com")
    assert res.brand_mentioned is False
    assert res.rank is None


# ── aggregation ────────────────────────────────────────────────────────
def test_aggregate_rank_breaks_ties_at_equal_mention_rate():
    # Both engines mention the brand once; ChatGPT at rank 1, Gemini at rank 8.
    checks = [
        {"engine": "ChatGPT", "brand_mentioned": True, "rank": 1, "cited": True,
         "competitors": ["A", "B"], "mode": "simulated"},
        {"engine": "Gemini", "brand_mentioned": True, "rank": 8, "cited": False,
         "competitors": ["A"], "mode": "simulated"},
    ]
    agg = visibility_agg.aggregate(checks)
    assert set(agg["measured_visibility"].keys()) == {"ChatGPT", "Gemini"}
    # equal 100% mention rate → better rank wins
    assert agg["measured_visibility"]["ChatGPT"] > agg["measured_visibility"]["Gemini"]


def test_aggregate_mention_rate_dominates_rank():
    # Reliable presence (100%) beats a single better-ranked hit (50%).
    checks = [
        {"engine": "A", "brand_mentioned": True, "rank": 1, "cited": False,
         "competitors": [], "mode": "simulated"},
        {"engine": "A", "brand_mentioned": False, "rank": None, "cited": False,
         "competitors": ["X"], "mode": "simulated"},
        {"engine": "B", "brand_mentioned": True, "rank": 5, "cited": False,
         "competitors": ["X"], "mode": "simulated"},
    ]
    agg = visibility_agg.aggregate(checks)
    assert agg["measured_visibility"]["B"] > agg["measured_visibility"]["A"]
    assert 0 <= agg["share_of_voice"] <= 100
    assert agg["mention_rate"] == round(100 * 2 / 3, 1)


def test_aggregate_empty():
    agg = visibility_agg.aggregate([])
    assert agg["overall_measured"] == 0.0
    assert agg["measured_visibility"] == {}
