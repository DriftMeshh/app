import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export const Errors = {
  1: {message:"NotInitialized"},
  2: {message:"AlreadyInitialized"},
  3: {message:"AlreadyClaimed"},
  4: {message:"NothingToClaim"}
}

export interface Client {
  /**
   * Construct and simulate a claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * A device claims its payout for an epoch once. Amount is
   * `submission_count * reward_rate`, capped by whatever the pool
   * actually holds so one epoch's claims can never drain more than
   * subscribers have paid in.
   */
  claim: ({device, epoch}: {device: string, epoch: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, validator, reward_token, reward_rate}: {admin: string, validator: string, reward_token: string, reward_rate: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a has_claimed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  has_claimed: ({device, epoch}: {device: string, epoch: u32}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a pool_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pool_balance: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a set_reward_rate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_reward_rate: ({admin, rate}: {admin: string, rate: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAgAAAAAAAAAOQWxyZWFkeUNsYWltZWQAAAAAAAMAAAAAAAAADk5vdGhpbmdUb0NsYWltAAAAAAAE",
        "AAAAAAAAAM5BIGRldmljZSBjbGFpbXMgaXRzIHBheW91dCBmb3IgYW4gZXBvY2ggb25jZS4gQW1vdW50IGlzCmBzdWJtaXNzaW9uX2NvdW50ICogcmV3YXJkX3JhdGVgLCBjYXBwZWQgYnkgd2hhdGV2ZXIgdGhlIHBvb2wKYWN0dWFsbHkgaG9sZHMgc28gb25lIGVwb2NoJ3MgY2xhaW1zIGNhbiBuZXZlciBkcmFpbiBtb3JlIHRoYW4Kc3Vic2NyaWJlcnMgaGF2ZSBwYWlkIGluLgAAAAAABWNsYWltAAAAAAAAAgAAAAAAAAAGZGV2aWNlAAAAAAATAAAAAAAAAAVlcG9jaAAAAAAAAAQAAAABAAAD6QAAAAsAAAAD",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAl2YWxpZGF0b3IAAAAAAAATAAAAAAAAAAxyZXdhcmRfdG9rZW4AAAATAAAAAAAAAAtyZXdhcmRfcmF0ZQAAAAALAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAAAAAAALaGFzX2NsYWltZWQAAAAAAgAAAAAAAAAGZGV2aWNlAAAAAAATAAAAAAAAAAVlcG9jaAAAAAAAAAQAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAMcG9vbF9iYWxhbmNlAAAAAAAAAAEAAAAL",
        "AAAAAAAAAAAAAAAPc2V0X3Jld2FyZF9yYXRlAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAEcmF0ZQAAAAsAAAABAAAD6QAAAAIAAAAD" ]),
      options
    )
  }
  public readonly fromJSON = {
    claim: this.txFromJSON<Result<i128>>,
        initialize: this.txFromJSON<Result<void>>,
        has_claimed: this.txFromJSON<boolean>,
        pool_balance: this.txFromJSON<i128>,
        set_reward_rate: this.txFromJSON<Result<void>>
  }
}