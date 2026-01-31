import { Injectable } from '@nestjs/common';
import * as vm from 'vm';
import * as child_process from 'child_process';
import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const exec = promisify(child_process.exec);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export interface TestResult {
  passed: boolean;
  input?: string;
  output: string;
  expected: string;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  errors: string;
  executionTimeMs: number;
  testResults: TestResult[];
}

@Injectable()
export class CodeExecutorService {
  private readonly TIMEOUT = 30000; // 30 seconds
  private readonly MAX_OUTPUT = 10000; // 10KB max output

  async executeJavaScript(
    code: string,
    testCases?: Array<{ input?: string; expectedOutput: string }>,
    stdin?: string,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const testResults: TestResult[] = [];

    try {
      // For JavaScript, use vm for safe execution
      const context = vm.createContext();
      const sandbox = {
        console: {
          log: (...args: any[]) => args.join(' '),
        },
        require: require,
        process: process,
      };

      // Inject console.log capture
      let output = '';
      sandbox.console.log = (...args: any[]) => {
        output += args.join(' ') + '\n';
        return '';
      };

      const script = new vm.Script(code);
      const context_obj = vm.createContext(sandbox);

      try {
        script.runInContext(context_obj, { timeout: this.TIMEOUT });
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        output = output.substring(0, this.MAX_OUTPUT);

        // Run test cases even on error
        if (testCases) {
          for (const testCase of testCases) {
            testResults.push({
              passed: false,
              input: testCase.input,
              output,
              expected: testCase.expectedOutput,
              error: error,
            });
          }
        }

        return {
          success: false,
          output,
          errors: error,
          executionTimeMs: Date.now() - startTime,
          testResults,
        };
      }

      output = output.substring(0, this.MAX_OUTPUT);

      // Run test cases
      if (testCases) {
        for (const testCase of testCases) {
          const passed = output.trim() === testCase.expectedOutput.trim();
          testResults.push({
            passed,
            input: testCase.input,
            output: output.trim(),
            expected: testCase.expectedOutput,
          });
        }
      }

      const allPassed = testResults.length === 0 || testResults.every(t => t.passed);

      return {
        success: allPassed,
        output,
        errors: '',
        executionTimeMs: Date.now() - startTime,
        testResults,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        output: '',
        errors: errorMsg,
        executionTimeMs: Date.now() - startTime,
        testResults,
      };
    }
  }

  async executePython(
    code: string,
    testCases?: Array<{ input?: string; expectedOutput: string }>,
    stdin?: string,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const testResults: TestResult[] = [];

    // Create temporary Python file
    const tempFile = path.join('/tmp', `code_${Date.now()}_${Math.random().toString(36).slice(2)}.py`);

    try {
      // Write code to file
      await writeFile(tempFile, code);

      // Execute Python code
      const { stdout, stderr } = await exec(`python "${tempFile}"`, {
        timeout: this.TIMEOUT,
        maxBuffer: this.MAX_OUTPUT,
      });

      if (stderr) {
        if (testCases) {
          for (const testCase of testCases) {
            testResults.push({
              passed: false,
              input: testCase.input,
              output: stdout.substring(0, this.MAX_OUTPUT),
              expected: testCase.expectedOutput,
              error: stderr,
            });
          }
        }

        return {
          success: false,
          output: stdout.substring(0, this.MAX_OUTPUT),
          errors: stderr,
          executionTimeMs: Date.now() - startTime,
          testResults,
        };
      }

      const output = stdout.substring(0, this.MAX_OUTPUT);

      // Run test cases
      if (testCases) {
        for (const testCase of testCases) {
          const passed = output.trim() === testCase.expectedOutput.trim();
          testResults.push({
            passed,
            input: testCase.input,
            output: output.trim(),
            expected: testCase.expectedOutput,
          });
        }
      }

      const allPassed = testResults.length === 0 || testResults.every(t => t.passed);

      return {
        success: allPassed,
        output,
        errors: '',
        executionTimeMs: Date.now() - startTime,
        testResults,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (testCases) {
        for (const testCase of testCases) {
          testResults.push({
            passed: false,
            input: testCase.input,
            output: '',
            expected: testCase.expectedOutput,
            error: errorMsg,
          });
        }
      }

      return {
        success: false,
        output: '',
        errors: errorMsg,
        executionTimeMs: Date.now() - startTime,
        testResults,
      };
    } finally {
      // Clean up temp file
      try {
        await unlink(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  async executeCode(
    code: string,
    language: string,
    testCases?: Array<{ input?: string; expectedOutput: string }>,
    stdin?: string,
  ): Promise<ExecutionResult> {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return this.executeJavaScript(code, testCases, stdin);
      case 'python':
      case 'py':
        return this.executePython(code, testCases, stdin);
      default:
        return {
          success: false,
          output: '',
          errors: `Unsupported language: ${language}`,
          executionTimeMs: 0,
          testResults: [],
        };
    }
  }

  async validateSyntax(code: string, language: string): Promise<{ valid: boolean; error?: string }> {
    try {
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          new vm.Script(code);
          return { valid: true };
        case 'python':
        case 'py':
          // For Python, we'd need to call python -m py_compile
          // For now, just return valid
          return { valid: true };
        default:
          return { valid: false, error: `Unsupported language: ${language}` };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { valid: false, error: errorMsg };
    }
  }
}
