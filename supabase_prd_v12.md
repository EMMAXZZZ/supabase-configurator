# Product Requirements Document (PRD): Supabase Self-Hosting Configuration Tool

## 1. Document Information
- **Product Name**: Supabase Config Generator
- **Version**: 1.2
- **Date**: August 10, 2025
- **Author**: Enhanced based on research analysis
- **Status**: Updated Draft
- **Changes from v1.1**: Added character encoding strategy, enhanced security architecture, streamlined UX flow, updated technical stack for weekend development

## 2. Overview
### 2.1 Product Description
The Supabase Config Generator is a web-based tool designed to simplify the setup process for self-hosting Supabase, addressing critical character encoding issues that break Docker deployments. The tool generates secure, compatible configuration files (.env, docker-compose.yml, docker-compose.override.yml) using a three-tier character set strategy to ensure universal compatibility across PostgreSQL, Docker, and SMTP systems.

Built with FastAPI for rapid weekend development, the tool prioritizes local file download over complex SCP transfer functionality, focusing on core configuration generation with robust character encoding handling. Users can auto-generate secure passwords using alphanumeric-only sets or enhanced Base64URL-safe characters, eliminating common deployment failures caused by special characters in database connections and environment variables.

### 2.2 Goals and Objectives
- **Primary Goal**: Generate valid, deployment-ready Supabase configuration files with zero character encoding issues
- **Secondary Goals**:
  - Implement three-tier character set strategy for maximum compatibility
  - Provide secure, transient credential handling with no persistent storage
  - Enable weekend development timeline (10-15 hours total)
  - Support progressive disclosure UX for novice and expert users
  - Ensure compatibility with Hostinger VPS deployment environment

### 2.3 Scope
- **In Scope**:
  - FastAPI-based web application with Jinja2 templating
  - Three-tier character generation: Alphanumeric, Base64URL-safe, Hex-only
  - Real-time character encoding validation and warnings
  - Progressive disclosure form with 3-step workflow
  - Local ZIP download with instant browser delivery
  - SQLite-based session management for form state
  - Comprehensive input validation using Pydantic models
  - Basic HTTPS support for production deployment

- **Out of Scope** (Reserved for future versions):
  - SCP/SSH file transfer functionality
  - Persistent credential storage or user accounts
  - Advanced Docker orchestration features
  - Integration with external secrets managers
  - Mobile-optimized interface
  - Real-time collaboration features

## 3. Critical Character Encoding Requirements

### 3.1 Character Set Strategy
Based on compatibility analysis, implement three distinct character sets:

**Tier 1 - Universal Safe (Default Recommendation)**
- Character set: `A-Z`, `a-z`, `0-9` (62 characters)
- Use cases: PostgreSQL passwords, SMTP credentials, default tokens
- Benefits: Zero encoding issues, works in all environments
- Entropy: ~5.95 bits per character
- Recommended lengths: 32 chars (190+ bits entropy)

**Tier 2 - Base64URL Safe (Enhanced)**
- Character set: `A-Z`, `a-z`, `0-9`, `-`, `_` (64 characters)
- Use cases: JWT secrets, API keys, advanced users
- Benefits: URL-safe, higher entropy, broad compatibility
- Entropy: 6 bits per character
- Recommended lengths: 32 chars (192 bits entropy)

**Tier 3 - Hex Only (Legacy Compatibility)**
- Character set: `0-9`, `A-F` (16 characters)
- Use cases: Systems requiring hexadecimal tokens
- Benefits: Maximum compatibility, easy validation
- Entropy: 4 bits per character
- Recommended lengths: 48 chars (192 bits entropy)

### 3.2 Forbidden Characters
Never generate the following characters that cause Docker/PostgreSQL issues:
- Docker variable markers: `$` (unless double-escaped as `$$`)
- PostgreSQL URL separators: `@`, `:`, `/`, `#`, `?`
- URL encoding required: `%`, `=`, `;`, `&`, `{`, `}`
- Shell interpretation: `*`, `!`, `|`, `>`, `<`, `\`

### 3.3 Validation Requirements
- Real-time character set validation during manual entry
- Warning system for problematic characters with suggested replacements
- Automatic character set detection and recommendation
- Preview generation showing how values will appear in final configurations

## 4. Enhanced Security Architecture

### 4.1 Transient Processing Model
- **No credential persistence**: All sensitive data handled in memory only
- **Immediate memory clearing**: Use `memset` equivalent for Python to clear variables
- **Session-only storage**: Form state in SQLite with auto-expiry (1 hour max)
- **Process isolation**: Separate credential generation from file assembly

### 4.2 Secure Generation Standards
- **Entropy requirements**: Minimum 128 bits for system tokens, 80 bits for user passwords
- **Generation method**: Python `secrets` module exclusively (never `random`)
- **Key derivation**: PBKDF2 or scrypt for any derived credentials
- **Validation**: Real-time strength calculation and display

### 4.3 Input Security
- **Server-side validation**: Pydantic models for all inputs with strict type checking
- **Sanitization**: Use `bleach` library for any HTML content
- **Rate limiting**: Basic protection against automated abuse
- **HTTPS enforcement**: Redirect HTTP to HTTPS in production

## 5. Progressive Disclosure UX Design

### 5.1 Three-Step Workflow
**Step 1: Basic Configuration (Required)**
- Site URL and basic identification
- Database credentials with character set selection
- SMTP configuration with validation
- Auto-generation toggle with explanation

**Step 2: Security & Authentication (Recommended)**
- JWT secret configuration
- Dashboard credentials
- API key generation
- Character encoding preferences

**Step 3: Advanced Options (Optional)**
- Storage backend selection (file/S3)
- OpenAI integration
- Docker overrides
- Custom port mappings

### 5.2 Form Interaction Patterns
- **Linear progression** with clear back/forward navigation
- **Save progress** automatically between steps
- **Real-time validation** with recovery-focused error messages
- **Smart defaults** that work for 80% of users
- **Clear visual hierarchy** with primary/secondary actions

### 5.3 Error Handling Strategy
- **Recovery-focused messaging**: "Fix this issue by..." instead of "Error occurred"
- **Specific problem identification**: Highlight exact fields and issues
- **Example-driven solutions**: Show correct format examples
- **Progressive help**: Basic → detailed explanation on demand

## 6. Updated Technical Architecture

### 6.1 Core Technology Stack
- **Backend**: FastAPI (Python 3.11/3.13)
- **Frontend**: Jinja2 templates + Tailwind CSS
- **Database**: SQLite (development), optional PostgreSQL (production)
- **Generation**: Python `secrets` + Jinja2 templating
- **Validation**: Pydantic models + custom validators
- **Testing**: pytest with configuration file validation

### 6.2 FastAPI Application Structure
```
app/
├── main.py                 # FastAPI application entry
├── models/                 # Pydantic models
│   ├── config.py          # Configuration data models
│   └── validation.py      # Custom validators
├── generators/            # File generation logic
│   ├── env_generator.py   # .env file generation
│   ├── compose_generator.py # docker-compose.yml
│   └── secrets_generator.py # Secure token generation
├── templates/             # Jinja2 templates
│   ├── base.html         # Base template
│   ├── forms/            # Form step templates
│   └── config_files/     # Configuration file templates
├── static/               # CSS, JS, images
└── utils/               # Utility functions
    ├── character_sets.py # Character set management
    └── validation.py    # Input validation helpers
```

### 6.3 Configuration File Generation
- **Template-based approach**: Jinja2 templates for all file types
- **Atomic generation**: Create all files before packaging
- **Validation step**: Syntax check generated YAML/env files
- **ZIP packaging**: In-memory ZIP creation for instant download

## 7. Functional Requirements

### 7.1 Environment Variables (Updated)
Enhanced variable handling with character encoding considerations:

| Category | Variable | Required | Character Set | Validation |
|----------|----------|----------|---------------|------------|
| Database | POSTGRES_PASSWORD | Required | Tier 1 (Alphanumeric) | No special chars, length 32+ |
| Auth | JWT_SECRET | Required | Tier 2 (Base64URL) | 64 chars, entropy check |
| Site | SITE_URL | Required | N/A | Valid URL format |
| SMTP | SMTP_PASS | Required | Tier 1 (Alphanumeric) | SMTP format validation |
| Dashboard | DASHBOARD_PASSWORD | Optional | Tier 1 (Alphanumeric) | Warn if default |
| Storage | GLOBAL_S3_BUCKET | Conditional | N/A | S3 naming rules |

### 7.2 Enhanced Generation Features
- **Character set preview**: Show generated examples before commit
- **Regeneration options**: Individual field regeneration without form reset
- **Compatibility checking**: Warn about character combinations that may cause issues
- **Export options**: Individual files or complete ZIP package

### 7.3 Validation and Feedback
- **Real-time character analysis**: Count problematic characters as user types
- **Compatibility scoring**: Green/yellow/red indicators for configuration safety
- **Preview mode**: Show how values will appear in final files
- **Test connection**: Basic validation for SMTP and database connection strings

## 8. Weekend Development Timeline

### 8.1 Development Phases (10-15 hours total)
**Phase 1: Setup and Core (3-4 hours)**
- FastAPI application bootstrap
- Basic form structure with Tailwind CSS
- Character set generation functions
- SQLite session management

**Phase 2: Generation Logic (4-5 hours)**
- Jinja2 template creation for all file types
- Pydantic models for validation
- File generation and ZIP packaging
- Basic error handling

**Phase 3: UX and Validation (3-4 hours)**
- Progressive disclosure implementation
- Real-time validation and feedback
- Character encoding warnings
- Form state management

**Phase 4: Testing and Deployment (2-3 hours)**
- Configuration file syntax validation
- Basic security testing
- Hostinger VPS deployment setup
- Documentation and cleanup

### 8.2 Implementation Priorities
1. **Critical**: Character encoding safety and file generation
2. **High**: Form validation and user feedback
3. **Medium**: Progressive disclosure and UX polish
4. **Low**: Advanced features and optimizations

## 9. Deployment Considerations

### 9.1 Hostinger VPS Requirements
- **Minimum**: KVM 1 VPS (1 vCPU, 4GB RAM, 50GB NVMe)
- **OS**: Ubuntu 22.04 LTS for Python 3.11+ support
- **Web server**: Nginx reverse proxy + Uvicorn
- **SSL**: Let's Encrypt automatic certificate management
- **Domain**: Subdomain pointing to VPS IP

### 9.2 Production Configuration
- **Environment isolation**: Use virtual environments
- **Process management**: systemd service for application
- **Logging**: Structured logging with log rotation
- **Monitoring**: Basic health checks and uptime monitoring
- **Backup**: Configuration templates and application code

## 10. Security Checklist

### 10.1 Required Security Measures
- [ ] HTTPS enforcement with proper SSL certificates
- [ ] Input validation using Pydantic models
- [ ] No credential persistence in application or logs
- [ ] Secure headers (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting on form submissions
- [ ] Memory clearing for sensitive variables
- [ ] Character encoding validation to prevent injection

### 10.2 Security Testing
- [ ] Test character encoding edge cases
- [ ] Validate all generated configuration files
- [ ] Check for information leakage in error messages
- [ ] Verify HTTPS configuration and headers
- [ ] Test form validation bypass attempts

## 11. Success Metrics

### 11.1 Technical Metrics
- **Zero deployment failures** due to character encoding issues
- **Sub-2 second** configuration generation time
- **100% character compatibility** across all supported environments
- **Form completion rate** above 85% for 3-step workflow

### 11.2 User Experience Metrics
- **Time to first successful configuration**: Target under 5 minutes
- **Error recovery rate**: 90%+ of users successfully resolve validation errors
- **Character encoding warnings**: Users heed 95%+ of safety recommendations

## 12. Risk Mitigation

### 12.1 Character Encoding Risks
- **Risk**: Special characters cause deployment failures
- **Mitigation**: Three-tier character set strategy with real-time validation
- **Fallback**: Automatic character replacement suggestions

### 12.2 Security Risks  
- **Risk**: Credential exposure through logs or persistence
- **Mitigation**: Transient processing model with memory clearing
- **Fallback**: Session timeout and automatic cleanup

### 12.3 Development Timeline Risks
- **Risk**: Weekend timeline proves insufficient
- **Mitigation**: Phased approach with core functionality first
- **Fallback**: Deploy minimal viable version, iterate incrementally

## 13. Claude Code Development Guidelines (claude.md)

### 13.1 Purpose and Framework
This section defines development guidelines for Claude Code integration, ensuring consistent, modular, and secure implementation of the Supabase Configuration Tool. These guidelines prioritize weekend development velocity while maintaining production-quality standards.

### 13.2 Modular Architecture Principles

**Module Size Guidelines**
- **Target size**: 300-400 lines per module maximum
- **Function scope**: Single responsibility principle - each module supports one feature/function
- **File organization**: Clear separation between models, generators, validators, and utilities
- **Import structure**: Minimal dependencies between modules

**DRY (Don't Repeat Yourself) Implementation**
- **Shared utilities**: Common functions in `utils/` directory
- **Template inheritance**: Base Jinja2 templates with specific overrides
- **Configuration constants**: Centralized in `config.py` module
- **Validation patterns**: Reusable Pydantic validators across modules

```python
# Example modular structure adherence
# generators/env_generator.py (target: ~350 lines)
from utils.character_sets import generate_secure_token
from utils.validation import validate_character_compatibility
from models.config import EnvironmentConfig

class EnvironmentGenerator:
    """Handles .env file generation with character encoding safety."""
    # Implementation focused solely on .env generation
```

### 13.3 Password and Token Security Standards

**NIST 2025 Compliance Requirements**
Based on current NIST SP 800-63B guidelines and 2025 updates:

- **Minimum entropy**: 80 bits for user passwords, 128+ bits for system tokens
- **Length requirements**: 
  - User passwords: 8 characters minimum, 15+ recommended
  - System tokens: 32 characters minimum for alphanumeric
  - Maximum supported: 64 characters for passphrases
- **Character set flexibility**: Support ASCII and Unicode characters
- **No composition rules**: Eliminate mandatory complexity requirements
- **No forced expiration**: Change only on compromise evidence

**Implementation in UI/UX Design**
```python
# Password strength calculator implementation
def calculate_entropy(password: str, character_set_size: int) -> float:
    """Calculate password entropy in bits."""
    return len(password) * math.log2(character_set_size)

# UI feedback implementation
def get_strength_indicator(entropy: float) -> dict:
    """Return UI indicator based on entropy."""
    if entropy >= 128: return {"level": "excellent", "color": "green"}
    elif entropy >= 80: return {"level": "good", "color": "blue"}
    elif entropy >= 60: return {"level": "fair", "color": "yellow"}
    else: return {"level": "weak", "color": "red"}
```

**Character Set Strategy Implementation**
```python
# Tier 1: Universal compatibility (62 characters)
ALPHANUMERIC = string.ascii_letters + string.digits
# Entropy: ~5.95 bits/char, 32 chars = ~190 bits

# Tier 2: Base64URL safe (64 characters) 
BASE64URL_SAFE = ALPHANUMERIC + "-_"
# Entropy: 6 bits/char, 32 chars = 192 bits

# Tier 3: Hex only (16 characters)
HEX_ONLY = string.hexdigits[:16]  # 0-9, A-F
# Entropy: 4 bits/char, 48 chars = 192 bits
```

### 13.4 Claude Code Optimization Techniques

**Research and Planning Phase**
Before implementation, Claude should:
1. **Analyze codebase patterns**: Study existing Supabase configuration examples
2. **Research character encoding**: Investigate PostgreSQL, Docker, SMTP limitations
3. **Plan module structure**: Design 300-400 line focused modules
4. **Identify reusable components**: Prevent code duplication

**Test-Driven Development (TDD) Approach**
```python
# Example TDD pattern for character encoding validation
def test_postgres_password_compatibility():
    """Test that generated passwords work in PostgreSQL connection strings."""
    password = generate_postgres_password()
    assert "@" not in password  # Breaks connection string parsing
    assert "$" not in password  # Docker variable substitution issues
    assert len(password) >= 32  # Minimum entropy requirement
    
def test_jwt_secret_base64url_safety():
    """Test JWT secrets are Base64URL compatible."""
    secret = generate_jwt_secret()
    assert all(c in BASE64URL_SAFE for c in secret)
    assert calculate_entropy(secret, 64) >= 128  # bits
```

**Memory Management and Security**
```python
# Secure memory handling for sensitive data
import ctypes
import os

def secure_zero_memory(data: str) -> None:
    """Securely clear sensitive data from memory."""
    if isinstance(data, str):
        # Convert to bytes and zero memory
        data_bytes = data.encode('utf-8')
        ctypes.memset(id(data_bytes), 0, len(data_bytes))

# Use context managers for credential handling
@contextmanager
def secure_credential_context(credential: str):
    try:
        yield credential
    finally:
        secure_zero_memory(credential)
```

**Progressive Enhancement Development**
1. **Core functionality first**: Character generation and file creation
2. **Validation layer**: Real-time character compatibility checking  
3. **UI polish**: Progressive disclosure and user feedback
4. **Security hardening**: Memory clearing and input sanitization

### 13.5 Code Quality and Standards

**Validation Patterns**
```python
# Centralized validation using Pydantic
class PostgreSQLPassword(BaseModel):
    value: str
    
    @validator('value')
    def validate_postgres_compatibility(cls, v):
        forbidden_chars = ['@', ', '%', '=', ';', '&']
        if any(char in v for char in forbidden_chars):
            raise ValueError(f"Password contains forbidden characters: {forbidden_chars}")
        return v

class JWTSecret(BaseModel):
    value: str
    
    @validator('value')
    def validate_base64url_safety(cls, v):
        if not all(c in BASE64URL_SAFE for c in v):
            raise ValueError("JWT secret must be Base64URL safe")
        if calculate_entropy(v, 64) < 128:
            raise ValueError("JWT secret must have at least 128 bits entropy")
        return v
```

**Error Handling Strategy**
```python
# Recovery-focused error messages
class CharacterEncodingError(Exception):
    """Raised when character encoding issues are detected."""
    
    def __init__(self, problematic_chars: list, suggested_fix: str):
        self.problematic_chars = problematic_chars
        self.suggested_fix = suggested_fix
        super().__init__(self.get_user_message())
    
    def get_user_message(self) -> str:
        return (f"Found problematic characters: {self.problematic_chars}. "
                f"To fix this: {self.suggested_fix}")
```

**Testing Strategy**
```python
# Comprehensive character encoding tests
def test_all_character_sets_compatibility():
    """Test all three character sets against real deployment scenarios."""
    configs = [
        ("postgres_password", ALPHANUMERIC),
        ("jwt_secret", BASE64URL_SAFE), 
        ("smtp_password", ALPHANUMERIC),
        ("hex_token", HEX_ONLY)
    ]
    
    for config_type, char_set in configs:
        test_value = generate_secure_string(32, char_set)
        assert validate_deployment_compatibility(config_type, test_value)
```

### 13.6 Implementation Timeline Optimization

**Phase 1: Core Security (4 hours)**
- Implement three-tier character generation
- Create validation functions for each character set
- Build secure memory handling utilities
- Test character compatibility across all target systems

**Phase 2: Modular Architecture (4 hours)**
- Create focused generator modules (env, compose, override)
- Implement Pydantic validation models
- Build reusable utility functions
- Establish clear module boundaries (300-400 lines each)

**Phase 3: User Experience (4 hours)**
- Progressive disclosure form implementation
- Real-time character encoding feedback
- Recovery-focused error messaging
- Password strength visualization

**Phase 4: Integration and Testing (3 hours)**
- End-to-end configuration generation testing
- Character encoding compatibility validation
- Security audit of credential handling
- Performance optimization for weekend deployment

### 13.7 Automated Testing and Validation Framework

**1. Automated Testing Execution Protocol**
Claude Code must implement comprehensive testing after every code change:

```python
# Testing automation sequence for Supabase Config Generator
def run_validation_suite():
    """Complete validation pipeline for configuration generator."""
    steps = [
        ("Character Encoding Tests", run_encoding_tests),
        ("Configuration Generation", test_config_generation), 
        ("Docker Compatibility", validate_docker_configs),
        ("PostgreSQL Connection", test_postgres_compatibility),
        ("Security Validation", run_security_checks),
        ("Type Checking", run_mypy_validation),
        ("Linting", run_ruff_checks),
        ("Format Check", verify_code_formatting)
    ]
    
    for step_name, test_func in steps:
        print(f"Running {step_name}...")
        result = test_func()
        if not result.success:
            raise ValidationError(f"{step_name} failed: {result.message}")
```

**Test Execution Commands by Component:**
```bash
# FastAPI application testing
pytest tests/ -v --cov=app --cov-report=html
ruff check app/ tests/
mypy app/
black --check app/

# Character encoding validation  
pytest tests/test_character_encoding.py -v
pytest tests/test_postgres_compatibility.py -v
pytest tests/test_docker_env_parsing.py -v

# Security-focused testing
bandit -r app/
safety check requirements.txt
pytest tests/test_security.py -v
```

**2. Test Coverage Management Standards**

**Minimum Coverage Requirements:**
- **Overall coverage**: 85% minimum
- **Critical modules**: 95% minimum (character generation, validation)
- **Security functions**: 100% coverage (credential handling, memory clearing)
- **Configuration generators**: 90% minimum

```python
# Coverage tracking implementation
class CoverageTracker:
    CRITICAL_MODULES = [
        "app.generators.secrets_generator",
        "app.utils.character_sets", 
        "app.validators.encoding_validator",
        "app.security.memory_manager"
    ]
    
    MINIMUM_COVERAGE = {
        "overall": 85,
        "critical": 95,
        "security": 100
    }
    
    def validate_coverage(self, coverage_data: dict) -> bool:
        """Validate that coverage meets minimum requirements."""
        for module in self.CRITICAL_MODULES:
            if coverage_data.get(module, 0) < self.MINIMUM_COVERAGE["critical"]:
                raise CoverageError(f"{module} below critical threshold")
        return True
```

**Test Writing Standards for Configuration Generator:**
```python
# Example comprehensive test structure
class TestCharacterEncoding:
    """Test character encoding compatibility across all systems."""
    
    def test_postgres_password_happy_path(self):
        """Test that generated passwords work in PostgreSQL connections."""
        # Arrange
        password = generate_postgres_password(length=32)
        
        # Act
        connection_string = f"postgresql://user:{password}@localhost/db"
        
        # Assert
        assert "@" not in password
        assert "$" not in password
        assert len(password) == 32
        assert all(c in ALPHANUMERIC for c in password)
    
    def test_postgres_password_edge_cases(self):
        """Test edge cases for PostgreSQL password generation."""
        # Test minimum length
        short_pass = generate_postgres_password(length=8)
        assert len(short_pass) == 8
        
        # Test maximum length
        long_pass = generate_postgres_password(length=64)
        assert len(long_pass) == 64
        
    def test_postgres_password_error_conditions(self):
        """Test error conditions for PostgreSQL password generation."""
        with pytest.raises(ValueError):
            generate_postgres_password(length=7)  # Below minimum
            
        with pytest.raises(ValueError):
            generate_postgres_password(length=65)  # Above maximum
    
    def test_postgres_password_boundary_conditions(self):
        """Test boundary conditions for PostgreSQL passwords."""
        # Test exact minimum entropy
        password = generate_postgres_password(length=14)  # ~83 bits
        assert calculate_entropy(password, 62) >= 80
        
        # Test character set boundaries
        for _ in range(100):  # Statistical validation
            pwd = generate_postgres_password(length=32)
            assert all(c in ALPHANUMERIC for c in pwd)
```

**3. Iterative Fix Process Protocol**

**Failure Analysis Workflow:**
```python
class TestFailureHandler:
    """Handle test failures with systematic debugging."""
    
    def analyze_failure(self, test_result: TestResult) -> FixStrategy:
        """Analyze test failure and determine fix strategy."""
        if "character encoding" in test_result.error_message:
            return self._handle_encoding_failure(test_result)
        elif "docker" in test_result.error_message.lower():
            return self._handle_docker_failure(test_result)
        elif "postgres" in test_result.error_message.lower():
            return self._handle_postgres_failure(test_result)
        else:
            return self._handle_generic_failure(test_result)
    
    def _handle_encoding_failure(self, result: TestResult) -> FixStrategy:
        """Handle character encoding related failures."""
        return FixStrategy(
            steps=[
                "Check character set being used",
                "Validate against forbidden character list", 
                "Test with different character tiers",
                "Verify Docker environment variable parsing"
            ],
            priority="HIGH"
        )
```

**4. Validation Gates Checklist**

**Pre-Commit Validation Gates:**
```yaml
# .pre-commit-config.yaml for Supabase Config Generator
repos:
  - repo: local
    hooks:
      - id: character-encoding-tests
        name: Character Encoding Validation
        entry: pytest tests/test_character_encoding.py -v
        language: python
        pass_filenames: false
        
      - id: security-tests  
        name: Security Validation
        entry: pytest tests/test_security.py -v
        language: python
        pass_filenames: false
        
      - id: postgres-compatibility
        name: PostgreSQL Compatibility
        entry: pytest tests/test_postgres_compatibility.py -v
        language: python
        pass_filenames: false
        
      - id: docker-validation
        name: Docker Environment Validation
        entry: pytest tests/test_docker_env.py -v
        language: python
        pass_filenames: false
        
      - id: type-checking
        name: MyPy Type Checking
        entry: mypy app/ --strict
        language: python
        pass_filenames: false
        
      - id: security-scan
        name: Security Vulnerability Scan
        entry: bandit -r app/ -f json
        language: python
        pass_filenames: false
```

**Completion Checklist for Each Feature:**
```markdown
## Feature Completion Checklist

### Character Generation Module
- [ ] All unit tests pass (100% coverage required)
- [ ] Integration tests with PostgreSQL connection strings pass
- [ ] Docker environment variable parsing tests pass
- [ ] SMTP credential format validation passes
- [ ] Security vulnerability scan clean
- [ ] Type checking passes with --strict mode
- [ ] Code formatting with black applied
- [ ] Linting with ruff produces zero warnings
- [ ] Performance benchmarks meet targets (<100ms generation)
- [ ] Memory leak tests pass (credential clearing verified)

### Configuration File Generation
- [ ] .env file generation tests pass
- [ ] docker-compose.yml syntax validation passes
- [ ] Character encoding compatibility verified
- [ ] Template rendering tests pass
- [ ] File integrity validation passes
- [ ] ZIP packaging tests pass
- [ ] Error handling tests cover all edge cases

### UI/UX Components  
- [ ] Form validation tests pass
- [ ] Progressive disclosure navigation tests pass
- [ ] Real-time feedback tests pass
- [ ] Accessibility tests pass (ARIA compliance)
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness validated
- [ ] Error message clarity verified
```

**5. Validation Process Workflow**

**Project-Specific Commands:**
```bash
# Supabase Config Generator validation sequence
#!/bin/bash
set -e  # Exit on any error

echo "🔍 Starting Supabase Config Generator validation..."

# 1. Character encoding validation
echo "Testing character encoding compatibility..."
pytest tests/test_character_encoding.py -v --tb=short

# 2. Configuration generation testing  
echo "Testing configuration file generation..."
pytest tests/test_generators/ -v --tb=short

# 3. Security validation
echo "Running security checks..."
bandit -r app/ -ll
safety check requirements.txt

# 4. Type checking
echo "Running type validation..."
mypy app/ --strict --show-error-codes

# 5. Linting and formatting
echo "Checking code quality..."
ruff check app/ tests/
black --check app/ tests/

# 6. Integration testing
echo "Running integration tests..."
pytest tests/integration/ -v --tb=short

# 7. Performance testing
echo "Running performance benchmarks..."
pytest tests/test_performance.py -v

# 8. Build validation
echo "Testing application build..."
python -m app.main --help  # Verify app loads

echo "✅ All validation checks passed!"
```

**6. Quality Metrics Tracking**

**Key Performance Indicators:**
```python
class QualityMetrics:
    """Track quality metrics for Supabase Config Generator."""
    
    TARGET_METRICS = {
        "test_success_rate": 100,  # Must be 100%
        "code_coverage": 85,       # Minimum 85%
        "critical_coverage": 95,   # Critical modules 95%
        "security_coverage": 100,  # Security functions 100%
        "build_time": 30,          # Maximum 30 seconds
        "test_execution": 60,      # Maximum 60 seconds
        "character_gen_speed": 100, # Maximum 100ms per generation
        "linting_errors": 0,       # Zero tolerance
        "security_violations": 0,   # Zero tolerance
        "type_errors": 0           # Zero tolerance
    }
    
    def validate_metrics(self, current_metrics: dict) -> bool:
        """Validate that current metrics meet targets."""
        failures = []
        for metric, target in self.TARGET_METRICS.items():
            current = current_metrics.get(metric)
            if metric in ["test_success_rate", "code_coverage", "critical_coverage"]:
                if current < target:
                    failures.append(f"{metric}: {current}% < {target}%")
            else:
                if current > target:
                    failures.append(f"{metric}: {current} > {target}")
        
        if failures:
            raise QualityGateError(f"Quality gates failed: {failures}")
        return True
```

**7. Claude Code Best Practices Integration**

**Development Workflow Commands**
```bash
# Custom slash commands for this project
/qplan    # Quick plan - analyze consistency with codebase
/qcode    # Quick code - implement with tests and formatting  
/qcheck   # Quality check - validate against CLAUDE.md guidelines
/qtest    # Quality test - run full validation suite
/qfix     # Quality fix - iterative fix process for failures
/security # Run security-focused code review
/deploy   # Prepare for Hostinger VPS deployment
/validate # Execute complete validation workflow
```

**Enhanced CLAUDE.md File Structure**
```markdown
# Supabase Config Generator - Claude Code Guidelines

## Character Encoding Requirements
- NEVER use forbidden characters: @, $, %, =, ;, &, {, }
- Implement three-tier character strategy
- Test all generated values against PostgreSQL, Docker, SMTP
- Validate character compatibility in real deployment scenarios

## Module Size Limits
- Maximum 400 lines per module
- Single responsibility per file
- Clear separation of concerns
- Comprehensive test coverage for each module

## Security Standards
- Minimum 128 bits entropy for tokens
- Use secrets module for generation
- Implement memory clearing for credentials
- Follow NIST 2025 guidelines
- 100% test coverage for security-critical functions

## Testing Requirements
- Run complete validation suite after every change
- Minimum 85% overall coverage, 95% for critical modules
- All tests must pass before any commit
- Character encoding tests mandatory for all generators
- Performance benchmarks must be maintained

## Validation Gates
Before marking any task complete:
1. All unit tests pass
2. Integration tests pass
3. Security scans clean
4. Type checking passes
5. Linting produces zero errors
6. Code formatting correct
7. Performance benchmarks met
8. Character encoding validated

## Iterative Fix Process
When tests fail:
1. Analyze failure carefully (especially encoding issues)
2. Identify root cause (character compatibility, Docker parsing)
3. Implement targeted fix
4. Re-run specific failing tests
5. Run full validation suite
6. Document fix for future reference
```

## 14. Future Enhancement Roadmap

### 14.1 Version 1.3 Considerations
- SCP/SSH transfer functionality with proper key management
- Advanced Docker orchestration options
- Configuration templates for common deployment scenarios
- Integration with CI/CD pipelines

### 14.2 Advanced Features
- Real-time collaboration for team configurations
- Configuration versioning and rollback
- Integration with external secrets managers
- Custom validation rule definitions

---

**This PRD v1.2 addresses critical character encoding issues while maintaining feasible weekend development scope. The three-tier character strategy, FastAPI architecture, and Claude Code integration guidelines provide a solid foundation for reliable Supabase self-hosting configuration generation with modern AI-assisted development practices.**