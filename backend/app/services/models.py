"""
Model Manager - Clean optimized version with GPU support and memory management
Imports the optimized model manager for better performance
"""

# Import the optimized model manager
from .model_manager_optimized import model_manager

# For backward compatibility, expose the model_manager instance
__all__ = ['model_manager']
