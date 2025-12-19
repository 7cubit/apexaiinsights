import os
import re

def scan_file(filepath):
    """Scans a single file for simple vulnerability patterns."""
    issues = []
    
    # Simple regex patterns for SAST
    patterns = {
        "Hardcoded Secret": r"(?i)(api_key|secret|password|token)\s*=\s*['\"][a-zA-Z0-9_\-]{10,}['\"]",
        "Eval Usage": r"eval\(",
        "Debug Mode": r"DEBUG\s*=\s*(True|true)",
        "Exposed Git": r"\.git/"
    }

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            for name, pattern in patterns.items():
                if re.search(pattern, content):
                    issues.append(f"[{name}] found in {filepath}")
    except Exception as e:
        pass
        
    return issues

def scan_directory(root_dir):
    print(f"Starting SAST Scan on {root_dir}...")
    all_issues = []
    
    # Exclude these directories
    exclude_dirs = {'.git', 'vendor', 'node_modules', '.idea', '.vscode', 'wc-logs'}
    
    for root, dirs, files in os.walk(root_dir):
        # Modify dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file.endswith(('.php', '.go', '.js', '.ts', '.py', '.env')):
                filepath = os.path.join(root, file)
                issues = scan_file(filepath)
                all_issues.extend(issues)

    if all_issues:
        print("\n[FAIL] vulnerabilities found:")
        for issue in all_issues:
            print(f" - {issue}")
        print(f"\nTotal Issues: {len(all_issues)}")
        # In a real CI, we might exit(1) here
    else:
        print("\n[PASS] No high-confidence vulnerabilities found.")

if __name__ == "__main__":
    # Scan the current working directory
    scan_directory(".")
