"""Health check and monitoring system for production deployment."""
from __future__ import annotations

import asyncio
import time
import psutil
from typing import Dict, Any, List
from enum import Enum
from dataclasses import dataclass
from pathlib import Path
import logging

logger = logging.getLogger("app.monitoring")


class HealthStatus(Enum):
    """Health check status enumeration."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


@dataclass
class HealthCheck:
    """Individual health check result."""
    name: str
    status: HealthStatus
    message: str
    duration_ms: float
    details: Dict[str, Any] = None


class SystemHealthChecker:
    """System health checker with various monitoring capabilities."""
    
    def __init__(self):
        self.checks: List[callable] = [
            self.check_memory_usage,
            self.check_disk_space,
            self.check_log_directory,
            self.check_template_directory,
            self.check_response_time,
        ]
    
    async def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks and return comprehensive status.
        
        Returns:
            Dict containing overall health status and individual check results
        """
        results = []
        start_time = time.time()
        
        # Run all checks concurrently
        tasks = [self._run_check(check) for check in self.checks]
        check_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        healthy_count = 0
        degraded_count = 0
        unhealthy_count = 0
        
        for result in check_results:
            if isinstance(result, Exception):
                results.append(HealthCheck(
                    name="unknown_check",
                    status=HealthStatus.UNHEALTHY,
                    message=f"Check failed: {str(result)}",
                    duration_ms=0
                ))
                unhealthy_count += 1
            else:
                results.append(result)
                if result.status == HealthStatus.HEALTHY:
                    healthy_count += 1
                elif result.status == HealthStatus.DEGRADED:
                    degraded_count += 1
                else:
                    unhealthy_count += 1
        
        # Determine overall status
        total_checks = len(results)
        if unhealthy_count > 0:
            overall_status = HealthStatus.UNHEALTHY
        elif degraded_count > total_checks * 0.3:  # More than 30% degraded
            overall_status = HealthStatus.DEGRADED
        else:
            overall_status = HealthStatus.HEALTHY
        
        total_duration = (time.time() - start_time) * 1000
        
        return {
            "status": overall_status.value,
            "timestamp": time.time(),
            "duration_ms": total_duration,
            "summary": {
                "total_checks": total_checks,
                "healthy": healthy_count,
                "degraded": degraded_count,
                "unhealthy": unhealthy_count,
            },
            "checks": [
                {
                    "name": check.name,
                    "status": check.status.value,
                    "message": check.message,
                    "duration_ms": check.duration_ms,
                    "details": check.details or {}
                }
                for check in results
            ]
        }
    
    async def _run_check(self, check_func) -> HealthCheck:
        """Run an individual health check with timing."""
        start_time = time.time()
        try:
            result = await check_func()
            result.duration_ms = (time.time() - start_time) * 1000
            return result
        except Exception as e:
            logger.error(f"Health check {check_func.__name__} failed: {e}")
            return HealthCheck(
                name=check_func.__name__,
                status=HealthStatus.UNHEALTHY,
                message=f"Check failed: {str(e)}",
                duration_ms=(time.time() - start_time) * 1000
            )
    
    async def check_memory_usage(self) -> HealthCheck:
        """Check system memory usage."""
        try:
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            if memory_percent > 90:
                status = HealthStatus.UNHEALTHY
                message = f"Memory usage critical: {memory_percent:.1f}%"
            elif memory_percent > 80:
                status = HealthStatus.DEGRADED
                message = f"Memory usage high: {memory_percent:.1f}%"
            else:
                status = HealthStatus.HEALTHY
                message = f"Memory usage normal: {memory_percent:.1f}%"
            
            return HealthCheck(
                name="memory_usage",
                status=status,
                message=message,
                duration_ms=0,
                details={
                    "used_percent": memory_percent,
                    "available_gb": memory.available / (1024**3),
                    "total_gb": memory.total / (1024**3)
                }
            )
        except Exception as e:
            return HealthCheck(
                name="memory_usage",
                status=HealthStatus.UNHEALTHY,
                message=f"Failed to check memory: {str(e)}",
                duration_ms=0
            )
    
    async def check_disk_space(self) -> HealthCheck:
        """Check available disk space."""
        try:
            # Check current directory disk usage
            disk_usage = psutil.disk_usage('.')
            free_percent = (disk_usage.free / disk_usage.total) * 100
            
            if free_percent < 5:
                status = HealthStatus.UNHEALTHY
                message = f"Disk space critical: {free_percent:.1f}% free"
            elif free_percent < 15:
                status = HealthStatus.DEGRADED
                message = f"Disk space low: {free_percent:.1f}% free"
            else:
                status = HealthStatus.HEALTHY
                message = f"Disk space adequate: {free_percent:.1f}% free"
            
            return HealthCheck(
                name="disk_space",
                status=status,
                message=message,
                duration_ms=0,
                details={
                    "free_percent": free_percent,
                    "free_gb": disk_usage.free / (1024**3),
                    "total_gb": disk_usage.total / (1024**3)
                }
            )
        except Exception as e:
            return HealthCheck(
                name="disk_space",
                status=HealthStatus.UNHEALTHY,
                message=f"Failed to check disk space: {str(e)}",
                duration_ms=0
            )
    
    async def check_log_directory(self) -> HealthCheck:
        """Check if log directory exists and is writable."""
        try:
            log_dir = Path("logs")
            
            if not log_dir.exists():
                return HealthCheck(
                    name="log_directory",
                    status=HealthStatus.DEGRADED,
                    message="Log directory does not exist",
                    duration_ms=0
                )
            
            if not log_dir.is_dir():
                return HealthCheck(
                    name="log_directory",
                    status=HealthStatus.UNHEALTHY,
                    message="Log path exists but is not a directory",
                    duration_ms=0
                )
            
            # Test write access
            test_file = log_dir / "health_check_test.tmp"
            try:
                test_file.write_text("test")
                test_file.unlink()
                
                return HealthCheck(
                    name="log_directory",
                    status=HealthStatus.HEALTHY,
                    message="Log directory accessible",
                    duration_ms=0,
                    details={"path": str(log_dir.absolute())}
                )
            except Exception:
                return HealthCheck(
                    name="log_directory",
                    status=HealthStatus.DEGRADED,
                    message="Log directory not writable",
                    duration_ms=0
                )
                
        except Exception as e:
            return HealthCheck(
                name="log_directory",
                status=HealthStatus.UNHEALTHY,
                message=f"Failed to check log directory: {str(e)}",
                duration_ms=0
            )
    
    async def check_template_directory(self) -> HealthCheck:
        """Check if template directory exists and contains expected files."""
        try:
            template_dir = Path("app/templates")
            
            if not template_dir.exists():
                return HealthCheck(
                    name="template_directory",
                    status=HealthStatus.UNHEALTHY,
                    message="Template directory does not exist",
                    duration_ms=0
                )
            
            # Check for essential templates
            essential_templates = ["base.html", "index.html", "forms/step1.html", "forms/step2.html"]
            missing_templates = []
            
            for template in essential_templates:
                if not (template_dir / template).exists():
                    missing_templates.append(template)
            
            if missing_templates:
                return HealthCheck(
                    name="template_directory",
                    status=HealthStatus.DEGRADED,
                    message=f"Missing templates: {', '.join(missing_templates)}",
                    duration_ms=0,
                    details={"missing": missing_templates}
                )
            
            return HealthCheck(
                name="template_directory",
                status=HealthStatus.HEALTHY,
                message="All essential templates present",
                duration_ms=0,
                details={"template_count": len(list(template_dir.glob("**/*.html")))}
            )
            
        except Exception as e:
            return HealthCheck(
                name="template_directory",
                status=HealthStatus.UNHEALTHY,
                message=f"Failed to check template directory: {str(e)}",
                duration_ms=0
            )
    
    async def check_response_time(self) -> HealthCheck:
        """Check application response time by timing a simple operation."""
        try:
            start_time = time.time()
            
            # Simulate a simple operation (token generation)
            from app.utils.character_sets import generate_tier1_token
            _ = generate_tier1_token(32)
            
            response_time_ms = (time.time() - start_time) * 1000
            
            if response_time_ms > 1000:  # 1 second
                status = HealthStatus.DEGRADED
                message = f"Response time slow: {response_time_ms:.1f}ms"
            elif response_time_ms > 5000:  # 5 seconds
                status = HealthStatus.UNHEALTHY
                message = f"Response time critical: {response_time_ms:.1f}ms"
            else:
                status = HealthStatus.HEALTHY
                message = f"Response time good: {response_time_ms:.1f}ms"
            
            return HealthCheck(
                name="response_time",
                status=status,
                message=message,
                duration_ms=0,
                details={"response_time_ms": response_time_ms}
            )
            
        except Exception as e:
            return HealthCheck(
                name="response_time",
                status=HealthStatus.UNHEALTHY,
                message=f"Failed to check response time: {str(e)}",
                duration_ms=0
            )


# Global health checker instance
health_checker = SystemHealthChecker()
