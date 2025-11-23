# Promptfoo AI Quality Testing

This directory contains AI quality tests for the Memo Maker application using [Promptfoo](https://www.promptfoo.dev/), a tool for evaluating and testing LLM prompts.

## Overview

Promptfoo helps us:
- **Test prompt quality** across different scenarios
- **Compare LLM models** (GPT-4o-mini vs GPT-4o)
- **Validate output structure** (JSON format, required fields)
- **Ensure consistent behavior** across edge cases
- **Prevent regressions** when updating prompts
- **Measure performance** and cost implications

## What We Test

Our test suite evaluates the memo generation prompt against 6 different scenarios:

1. **Simple standup meeting** - Tests basic extraction of action items and attendees
2. **Product planning** - Tests decision extraction and roadmap planning
3. **Brainstorming session** - Tests handling of meetings without clear action items
4. **Sprint planning** - Tests extraction of due dates and task assignments
5. **Brief meeting** - Tests edge case of very short transcripts
6. **Technical discussion** - Tests extraction of technical decisions

Each test validates:
- ✅ Valid JSON output
- ✅ Required fields present (summary, keyPoints, actionItems, decisions)
- ✅ Appropriate summary length (1-4 sentences)
- ✅ Accurate extraction of attendees, dates, owners
- ✅ Proper handling of edge cases

## Setup

### Prerequisites

1. **OpenAI API key** - Required for testing
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

2. **Promptfoo installed** - Already included in devDependencies
   ```bash
   npm install
   ```

### Configuration

The main configuration is in `/backend/promptfooconfig.yaml`. This file defines:
- **Prompts**: The system prompts used for memo generation
- **Providers**: LLM models to test (GPT-4o-mini, GPT-4o)
- **Test cases**: 6 scenarios with sample transcripts
- **Assertions**: Validation rules for outputs

## Running Tests

### Run all tests

```bash
npm run ai:test
```

This will:
1. Run all 6 test cases
2. Test against GPT-4o-mini (default model)
3. Validate all assertions
4. Generate a summary report

### View results in UI

```bash
npm run ai:test:ui
```

This opens an interactive web interface showing:
- Test results for each scenario
- Output comparison across models
- Failed assertion details
- Cost and token usage
- Response time metrics

### Compare models

```bash
npx promptfoo eval -c promptfooconfig.yaml
```

This runs tests on both GPT-4o-mini and GPT-4o, allowing you to:
- Compare quality differences
- Evaluate cost vs. quality tradeoffs
- Benchmark performance

### Run specific test

```bash
npx promptfoo eval -c promptfooconfig.yaml -f "Simple standup"
```

## Understanding Results

### Success Criteria

A test passes when:
- ✅ Output is valid JSON
- ✅ All required fields are present
- ✅ Summary is 1-4 sentences
- ✅ Relevant information is extracted (attendees, action items, decisions)
- ✅ No error messages in output

### Example Output

```json
{
  "summary": "Daily standup covering completed authentication work, ongoing API documentation, and a blocker on S3 integration requiring AWS credentials.",
  "keyPoints": [
    "Authentication module completed",
    "API documentation in progress",
    "Database migration completed",
    "S3 integration blocked pending credentials"
  ],
  "actionItems": [
    {
      "task": "Provide AWS credentials to Charlie",
      "owner": "Alice",
      "dueDate": "end of day"
    },
    {
      "task": "Review Charlie's database migration PR",
      "owner": "Bob"
    }
  ],
  "decisions": [],
  "nextSteps": [
    "Bob to review PR this afternoon",
    "Alice to work on frontend"
  ],
  "attendees": ["Alice", "Bob", "Charlie"]
}
```

## Test Results Interpretation

### Pass Rate

- **100%**: Excellent - prompt is working as expected
- **80-99%**: Good - minor issues to investigate
- **60-79%**: Needs improvement - check failed assertions
- **<60%**: Critical - prompt needs revision

### Common Failures

1. **Invalid JSON**: Model returned non-JSON text
   - **Fix**: Adjust temperature or add explicit JSON format instruction

2. **Missing fields**: Required field (e.g., keyPoints) not in output
   - **Fix**: Make field requirements more explicit in prompt

3. **Incorrect extraction**: Action items or attendees not properly extracted
   - **Fix**: Provide clearer examples in system prompt

4. **Summary too long/short**: Summary doesn't meet length requirements
   - **Fix**: Add specific length guidance to prompt

## Cost Analysis

Each test run costs approximately:
- **GPT-4o-mini**: $0.0015 per test case (6 tests ≈ $0.01)
- **GPT-4o**: $0.015 per test case (6 tests ≈ $0.09)

For regular testing, GPT-4o-mini is recommended. Use GPT-4o for:
- Quality benchmarking
- Complex scenario validation
- Production quality baseline

## Adding New Tests

To add a new test case:

1. **Edit `promptfooconfig.yaml`**
2. **Add to `tests` array**:

```yaml
- description: 'Your new test scenario'
  vars:
    title: 'Meeting Title'
    date: '2025-01-20'
    participants: 'Names'
    transcript: |
      Your sample transcript here...

  assert:
    - type: is-json

    - type: javascript
      value: |
        const output = JSON.parse(output);
        // Your custom validation logic
        return output.someField === expectedValue;
```

3. **Run tests** to verify:
```bash
npm run ai:test
```

## Best Practices

### Test Coverage

Ensure tests cover:
- ✅ Happy path scenarios
- ✅ Edge cases (very short/long transcripts)
- ✅ Missing information (no dates, no owners)
- ✅ Different meeting types (standup, planning, brainstorm)
- ✅ Technical vs. business discussions

### Assertion Design

- **Use specific assertions**: Check exact fields rather than generic "valid JSON"
- **Test semantic correctness**: Verify extracted info matches transcript
- **Check edge cases**: Test behavior when optional fields are missing
- **Validate structure**: Ensure arrays, objects match expected schema

### Continuous Testing

- **Run before prompt changes**: Establish baseline
- **Run after prompt changes**: Detect regressions
- **Track metrics over time**: Monitor quality trends
- **Version control results**: Keep promptfoo-results.json in git

## Integration with CI/CD

### GitHub Actions

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run AI quality tests
  run: npm run ai:test
  working-directory: backend
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**Note**: Be cautious about running AI tests in CI due to:
- API costs (each PR run costs ~$0.01-0.10)
- Rate limits
- Execution time

**Recommended**: Run AI tests:
- On main branch only
- On manual trigger
- Nightly/weekly schedule
- Before releases

## Troubleshooting

### "OPENAI_API_KEY is not set"

```bash
export OPENAI_API_KEY="sk-..."
# Or add to .env file
echo "OPENAI_API_KEY=sk-..." >> .env
```

### "Rate limit exceeded"

- **Increase delay** in config: `delay: 2000` (2 seconds)
- **Reduce concurrency**: `maxConcurrency: 1`
- **Wait and retry** (OpenAI limits reset after 1 minute)

### "Test fails inconsistently"

- **Lower temperature**: More deterministic (currently 0.3)
- **Add explicit examples**: Show desired output format
- **Use GPT-4o**: Higher quality, more consistent

### "Output doesn't match expected format"

- **Check Zod schema**: Ensure test assertions match actual schema
- **Review model output**: Use UI mode to see raw responses
- **Adjust prompt**: Make format requirements more explicit

## Resources

- [Promptfoo Documentation](https://www.promptfoo.dev/docs/)
- [Writing Assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/)
- [JavaScript Assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/javascript/)
- [Model Comparison](https://www.promptfoo.dev/docs/guides/model-comparison/)

## Next Steps

1. **Expand test coverage**: Add more meeting scenarios
2. **Test prompt variations**: Experiment with different phrasings
3. **Benchmark models**: Compare GPT-4o-mini vs GPT-4o quality
4. **Monitor quality over time**: Track pass rates and cost
5. **Integrate with monitoring**: Alert on quality degradation
