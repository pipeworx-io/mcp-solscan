# @pipeworx/solscan

Solscan Pro v2 MCP — Solana on-chain data.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `get_account_detail(address)`
- `get_token_holdings(address, page?, page_size?)`
- `list_transfers(address, page?, page_size?)`
- `get_token_meta(token_address)`
- `get_transaction(signature)`

## Auth

- **Platform key:** gateway env `PLATFORM_SOLSCAN_KEY`.
- **BYO:** `?_apiKey=<token>` after registering at https://solscan.io/apis.

## Data source

`https://pro-api.solscan.io/v2.0/` — header `token`.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "solscan": {
      "url": "https://gateway.pipeworx.io/solscan/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Solscan data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
