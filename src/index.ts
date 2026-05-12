interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Solscan MCP — Solana block-explorer API (Pro v2)
 *
 * Fills the non-EVM gap: `etherscan` covers EVM chains, Solscan covers
 * Solana. Account info, SPL token holdings, transactions, transfers, token
 * metadata.
 *
 * API: https://pro-api.solscan.io/pro-api-docs/v2.0/
 * Auth: header `token: <api_key>`. Free tier with API key — register at
 *       https://solscan.io/apis
 *
 * Tools:
 * - get_account_detail:    account overview (balance, owner, executable)
 * - get_token_holdings:    SPL token balances held by an account
 * - list_transfers:        recent SOL/SPL transfers for an account
 * - get_token_meta:        SPL token metadata (name, symbol, supply, decimals)
 * - get_transaction:       transaction detail by signature
 */


const BASE_URL = 'https://pro-api.solscan.io/v2.0';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_account_detail',
    description:
      'Overview of a Solana account: SOL balance (lamports + UI), owner program, executable flag, rent epoch.',
    inputSchema: {
      type: 'object',
      properties: { address: { type: 'string', description: 'Solana public key (base58)' } },
      required: ['address'],
    },
  },
  {
    name: 'get_token_holdings',
    description:
      'SPL-token balances held by a Solana account. Returns mint, symbol, amount, decimals, USD value (if known).',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Solana account public key' },
        page: { type: 'number', description: '1-based page (default 1)' },
        page_size: { type: 'number', description: '1-40 (default 20)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'list_transfers',
    description:
      'Recent SOL and SPL token transfers for an account. Returns signature, timestamp, side (sent/received), token, amount, counterparty.',
    inputSchema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Solana account public key' },
        page: { type: 'number', description: '1-based page (default 1)' },
        page_size: { type: 'number', description: '1-40 (default 20)' },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_token_meta',
    description:
      'Metadata for an SPL token mint: name, symbol, decimals, supply, icon, market cap, holders, social links.',
    inputSchema: {
      type: 'object',
      properties: { token_address: { type: 'string', description: 'SPL token mint address' } },
      required: ['token_address'],
    },
  },
  {
    name: 'get_transaction',
    description: 'Transaction detail by signature: status, slot, block time, fee, balance changes, parsed instructions.',
    inputSchema: {
      type: 'object',
      properties: { signature: { type: 'string', description: 'Solana transaction signature (base58)' } },
      required: ['signature'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'Solscan requires a Pro API key. Contact the operator about platform credentials, or BYO via ?_apiKey=<token> after registering at https://solscan.io/apis.',
    );
  }
  switch (name) {
    case 'get_account_detail':
      return solscanGet(apiKey, '/account/detail', { address: reqStr(args, 'address', '"vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"') });
    case 'get_token_holdings':
      return solscanGet(apiKey, '/account/token-accounts', {
        address: reqStr(args, 'address', '"vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"'),
        type: 'token',
        page: String((args.page as number) ?? 1),
        page_size: String(Math.min(40, Math.max(1, (args.page_size as number) ?? 20))),
      });
    case 'list_transfers':
      return solscanGet(apiKey, '/account/transfer', {
        address: reqStr(args, 'address', '"vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"'),
        page: String((args.page as number) ?? 1),
        page_size: String(Math.min(40, Math.max(1, (args.page_size as number) ?? 20))),
      });
    case 'get_token_meta':
      return solscanGet(apiKey, '/token/meta', {
        address: reqStr(args, 'token_address', '"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" (USDC)'),
      });
    case 'get_transaction':
      return solscanGet(apiKey, '/transaction/detail', {
        tx: reqStr(args, 'signature', '(base58 transaction signature)'),
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing or empty. Pass a string like ${example}.`);
  }
  return v;
}

async function solscanGet(apiKey: string, path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${BASE_URL}${path}?${qs}`, {
    headers: { token: apiKey, Accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) throw new Error('Solscan: unauthorized — check the API key');
  if (res.status === 429) throw new Error('Solscan: rate-limit (HTTP 429)');
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Solscan error: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { success?: boolean; data?: unknown; errors?: unknown; message?: string };
  if (data.success === false) {
    throw new Error(`Solscan: ${data.message ?? 'unknown error'}`);
  }
  return { path, data: data.data ?? data };
}

export default { tools, callTool, meter: { credits: 2 } } satisfies McpToolExport;
