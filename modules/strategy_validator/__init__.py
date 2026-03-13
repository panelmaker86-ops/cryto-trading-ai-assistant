"""
Strategy rule validator: check if trade matches user-defined entry/exit rules.
"""
from .rule_engine import validate_trade_against_rules, StrategyRules

__all__ = ["validate_trade_against_rules", "StrategyRules"]
