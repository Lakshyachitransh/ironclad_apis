import { Injectable } from '@nestjs/common';

export interface TestResult {
  testId: string;
  passed: boolean;
  error?: string;
  actualOutput?: string;
  expectedOutput?: string;
}

/**
 * Service to validate and execute code submissions
 */
@Injectable()
export class CodeValidationService {
  /**
   * Run test cases against submitted code
   * Note: This is a basic implementation. In production, use a sandboxed environment like Piston API
   */
  async runTestCases(params: {
    submittedCode: string;
    testCases: Array<{
      input?: string;
      expectedOutput: string;
      hidden?: boolean;
    }>;
    language?: string;
  }): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (let i = 0; i < params.testCases.length; i++) {
      const testCase = params.testCases[i];
      try {
        // This is a simplified version - in production, use a sandboxed JS executor
        // For now, we'll use a safe eval-like approach
        const result = await this.executeTestCase(params.submittedCode, testCase);
        results.push(result);
      } catch (error) {
        results.push({
          testId: `test-${i}`,
          passed: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * Validate code syntax
   */
  async validateCodeSyntax(code: string, language: string = 'javascript'): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    try {
      if (language === 'javascript' || language === 'typescript') {
        return this.validateJavaScriptSyntax(code);
      } else if (language === 'python') {
        return this.validatePythonSyntax(code);
      } else {
        return { valid: true, errors: [] }; // Skip validation for unsupported languages
      }
    } catch (error) {
      return {
        valid: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Check for code quality issues
   */
  analyzeCodeQuality(code: string): {
    score: number;
    issues: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      line?: number;
    }>;
  } {
    const issues = [];
    let score = 100;

    // Check for missing documentation
    if (!code.includes('//') && !code.includes('/*')) {
      issues.push({
        type: 'documentation',
        description: 'Code lacks comments or documentation',
        severity: 'low',
      });
      score -= 5;
    }

    // Check for console.log statements (should be avoided in production code)
    const consoleLogMatch = code.match(/console\.(log|error|warn)/g);
    if (consoleLogMatch) {
      issues.push({
        type: 'debug-code',
        description: `Found ${consoleLogMatch.length} console statements. Remove debug code before submission.`,
        severity: 'medium',
      });
      score -= 10;
    }

    // Check for unused variables (basic check)
    const varMatches = code.match(/\b(?:let|const|var)\s+(\w+)/g);
    if (varMatches) {
      const variables = varMatches.map(v => v.split(/\s+/)[2]);
      for (const variable of variables) {
        if (!code.includes(variable)) {
          issues.push({
            type: 'unused-variable',
            description: `Potential unused variable: ${variable}`,
            severity: 'low',
          });
          score -= 3;
        }
      }
    }

    // Check for potential infinite loops
    if (
      code.includes('while(true)') ||
      (code.includes('while') && !code.includes('break') && !code.includes('++'))
    ) {
      issues.push({
        type: 'potential-infinite-loop',
        description: 'Potential infinite loop detected',
        severity: 'high',
      });
      score -= 20;
    }

    return {
      score: Math.max(0, score),
      issues,
    };
  }

  /**
   * Generate test case suggestions based on code
   */
  suggestEdgeCases(code: string): string[] {
    const suggestions: string[] = [];

    // Check for array operations
    if (code.includes('array') || code.includes('arr') || code.includes('[]')) {
      suggestions.push('Test with empty arrays');
      suggestions.push('Test with single-element arrays');
      suggestions.push('Test with large arrays');
    }

    // Check for string operations
    if (code.includes('string') || code.includes('str') || code.includes('""')) {
      suggestions.push('Test with empty strings');
      suggestions.push('Test with special characters');
      suggestions.push('Test with very long strings');
    }

    // Check for number operations
    if (code.includes('number') || code.includes('Math')) {
      suggestions.push('Test with negative numbers');
      suggestions.push('Test with zero');
      suggestions.push('Test with large numbers');
      suggestions.push('Test with decimal numbers');
    }

    // Check for loops
    if (code.includes('for') || code.includes('while')) {
      suggestions.push('Test boundary conditions (start, end, limits)');
      suggestions.push('Test with iteration count = 0');
      suggestions.push('Test with iteration count = 1');
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  private async executeTestCase(
    code: string,
    testCase: { input?: string; expectedOutput: string; hidden?: boolean },
  ): Promise<TestResult> {
    // This is a simplified implementation
    // In production, use Piston API or similar sandboxed environment
    // https://piston.readthedocs.io/

    // For now, we'll return a placeholder
    // Real implementation would involve executing the code safely
    return {
      testId: `test-${Date.now()}`,
      passed: false,
      error: 'Code execution requires sandboxed environment (e.g., Piston API)',
      actualOutput: undefined,
      expectedOutput: testCase.expectedOutput,
    };
  }

  private validateJavaScriptSyntax(code: string): {
    valid: boolean;
    errors: string[];
  } {
    try {
      new Function(code);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [(error as SyntaxError).message],
      };
    }
  }

  private validatePythonSyntax(code: string): {
    valid: boolean;
    errors: string[];
  } {
    // Basic Python syntax validation (without actual Python interpreter)
    // In production, use a Python execution service
    const errors: string[] = [];

    // Check for basic Python syntax issues
    if (!code.trim()) {
      errors.push('Code is empty');
    }

    // Check for common indentation issues
    if (code.includes('\t')) {
      errors.push('Tabs detected - Python prefers spaces for indentation');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
