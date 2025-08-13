"""Logging configuration for production deployment."""
from __future__ import annotations

import logging
import logging.config
import sys
from pathlib import Path
from typing import Dict, Any
import os


def get_logging_config(log_level: str = "INFO", log_dir: str = "logs") -> Dict[str, Any]:
    """Get logging configuration dictionary.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        
    Returns:
        Dict[str, Any]: Logging configuration
    """
    # Create logs directory if it doesn't exist
    Path(log_dir).mkdir(exist_ok=True)
    
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(lineno)d - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "json": {
                "class": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "format": "%(asctime)s %(name)s %(levelname)s %(module)s %(funcName)s %(lineno)d %(message)s",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "default",
                "stream": sys.stdout,
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": log_level,
                "formatter": "detailed",
                "filename": f"{log_dir}/app.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8",
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "filename": f"{log_dir}/error.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8",
            },
            "security_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "WARNING",
                "formatter": "detailed",
                "filename": f"{log_dir}/security.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 10,  # Keep more security logs
                "encoding": "utf8",
            },
        },
        "loggers": {
            # Root logger
            "": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False,
            },
            # App logger
            "app": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False,
            },
            # Security logger
            "security": {
                "level": "WARNING",
                "handlers": ["console", "security_file"],
                "propagate": False,
            },
            # Rate limiter logger
            "app.middleware.rate_limiter": {
                "level": "WARNING", 
                "handlers": ["console", "security_file"],
                "propagate": False,
            },
            # FastAPI/Uvicorn loggers
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console", "error_file"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["file"],
                "propagate": False,
            },
            "fastapi": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False,
            },
        },
    }


def setup_logging(log_level: str = None, log_dir: str = None) -> None:
    """Set up logging for the application.
    
    Args:
        log_level: Override log level from environment
        log_dir: Override log directory from environment
    """
    # Get configuration from environment or defaults
    log_level = log_level or os.getenv("LOG_LEVEL", "INFO").upper()
    log_dir = log_dir or os.getenv("LOG_DIR", "logs")
    
    # Validate log level
    valid_levels = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
    if log_level not in valid_levels:
        log_level = "INFO"
    
    # Get and apply logging configuration
    config = get_logging_config(log_level, log_dir)
    logging.config.dictConfig(config)
    
    # Log startup message
    logger = logging.getLogger("app")
    logger.info(f"Logging configured - Level: {log_level}, Directory: {log_dir}")


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance.
    
    Args:
        name: Logger name
        
    Returns:
        logging.Logger: Configured logger instance
    """
    return logging.getLogger(name)


# Security logger for sensitive operations
def log_security_event(event: str, details: Dict[str, Any], client_ip: str = None) -> None:
    """Log security-related events.
    
    Args:
        event: Event type (e.g., "rate_limit_exceeded", "validation_error")
        details: Event details dictionary
        client_ip: Client IP address if available
    """
    security_logger = logging.getLogger("security")
    log_data = {"event": event, "details": details}
    if client_ip:
        log_data["client_ip"] = client_ip
    
    security_logger.warning(f"Security event: {event}", extra=log_data)
