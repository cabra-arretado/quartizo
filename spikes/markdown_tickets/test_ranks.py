from __future__ import annotations

import random
import unittest

from .ranks import MAX_RANK, RankExhausted, between, rank_value, rebalance_plan


class RankTests(unittest.TestCase):
    def test_append_prepend_and_insert_preserve_lexical_order(self):
        rng = random.Random(8423)
        ranks = []
        for _ in range(1000):
            at = rng.randrange(len(ranks) + 1)
            rank = between(ranks[at - 1] if at else None, ranks[at] if at < len(ranks) else None)
            ranks.insert(at, rank)
        self.assertEqual(ranks, sorted(ranks))
        self.assertEqual(len(set(ranks)), 1000)
        self.assertTrue(all(len(rank) == 32 for rank in ranks))

    def test_exhaustion_is_explicit_and_keys_never_grow(self):
        upper = between()
        count = 0
        with self.assertRaises(RankExhausted):
            while True:
                upper = between(None, upper)
                self.assertEqual(len(upper), 32)
                count += 1
        self.assertEqual(count, 126)

    def test_invalid_and_reversed_bounds(self):
        for rank in (None, 123, "m", "f" * 31, "F" * 32, "0" * 32, f"{MAX_RANK:032x}"):
            with self.subTest(rank=rank), self.assertRaises(ValueError):
                rank_value(rank)
        for bounds in ((between(), between()), (between(), "0" * 31 + "1")):
            with self.subTest(bounds=bounds), self.assertRaises(ValueError):
                between(*bounds)

    def test_rebalance_is_deterministic_and_preserves_id_order(self):
        ids = ["legacy-uid", "new-uuid", "another-id"]
        plan = rebalance_plan(ids)
        self.assertEqual(list(plan), ids)
        self.assertEqual(list(plan.values()), sorted(plan.values()))
        self.assertEqual(plan, rebalance_plan(ids))
        self.assertEqual(rebalance_plan([]), {})
        with self.assertRaises(ValueError):
            rebalance_plan(["duplicate", "duplicate"])

if __name__ == "__main__":
    unittest.main()
