# Binance Fibonacci BOT

Binance Fibonacci BOT is built based on the Fibonacci retracement strategy.

## DISCLAIMER: Use at your own risk.

## Basic Usage

Make sure the cross wallet has a certain amount of USDT.

Install all dependencies.

```
npm i
```

Create `configs/env-config-dev.js` or `configs/env-config-prod.js`, please refer to the `configs/env-config-example.js` content.

Trading parameters can be modified in `configs/trade-config.js`.

This command for `configs/env-config-dev.js`

```
npm run start:dev
```

This command for `configs/env-config-prod.js`

```
npm run start:prod
```

## Strategy

This robot will randomly select a trading pair and automatically determine whether it meets the conditions for opening a position. When opening a position, it will set a take profit & stop loss orders based on Fibonacci retracement.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
