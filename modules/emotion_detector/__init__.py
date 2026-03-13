"""
Emotion detector: revenge trading, overtrading, size increase after loss.
"""
from .behavior_model import detect_emotional_patterns

__all__ = ["detect_emotional_patterns"]
