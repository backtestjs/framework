# Frequently Asked Questions (FAQ)

## General Questions

### What is Backtest JS?

A TypeScript/JavaScript framework for backtesting trading strategies with support for multiple data sources and strategy types.

### What are the minimum requirements?

- Node.js 22.0.0+
- NPM
- Basic TypeScript knowledge

### How do I get started?

1. Install via NPM
2. Set up environment
3. Create your first strategy
4. Run backtests

## Technical Questions

### How does error handling work?

The framework provides built-in error handling through the `BacktestError` class with specific error codes.

### Can I use custom indicators?

Yes, you can create custom indicators or use the built-in technical indicators library.

### How do I optimize performance?

1. Use appropriate timeframes
2. Implement efficient calculations
3. Utilize caching mechanisms
4. Batch process where possible

### What data formats are supported?

- CSV files
- Direct exchange downloads
- Custom data sources

## Common Issues

### Database Connection

Ensure DATABASE_URL is correctly set in your .env file.

### Memory Usage

Monitor and optimize memory usage in your strategies.

### Strategy Execution

Use proper error handling and logging in your strategies.

For more details, see other documentation files.
