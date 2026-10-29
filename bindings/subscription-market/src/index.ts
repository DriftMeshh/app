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
  3: {message:"InvalidPeriods"}
}

export interface Client {
  /**
   * Construct and simulate a is_active transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_active: ({subscriber}: {subscriber: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a set_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_price: ({admin, price}: {admin: string, price: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a subscribe transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pay for `periods` of access. Extends any existing, still-active
   * subscription rather than overwriting it. Returns the new expiry
   * (ledger timestamp, seconds).
   */
  subscribe: ({subscriber, periods}: {subscriber: string, periods: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_expiry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_expiry: ({subscriber}: {subscriber: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, payment_token, reward_pool, price_per_period, period_seconds}: {admin: string, payment_token: string, reward_pool: string, price_per_period: i128, period_seconds: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

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
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAgAAAAAAAAAOSW52YWxpZFBlcmlvZHMAAAAAAAM=",
        "AAAAAAAAAAAAAAAJaXNfYWN0aXZlAAAAAAAAAQAAAAAAAAAKc3Vic2NyaWJlcgAAAAAAEwAAAAEAAAAB",
        "AAAAAAAAAAAAAAAJc2V0X3ByaWNlAAAAAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAVwcmljZQAAAAAAAAsAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAJxQYXkgZm9yIGBwZXJpb2RzYCBvZiBhY2Nlc3MuIEV4dGVuZHMgYW55IGV4aXN0aW5nLCBzdGlsbC1hY3RpdmUKc3Vic2NyaXB0aW9uIHJhdGhlciB0aGFuIG92ZXJ3cml0aW5nIGl0LiBSZXR1cm5zIHRoZSBuZXcgZXhwaXJ5CihsZWRnZXIgdGltZXN0YW1wLCBzZWNvbmRzKS4AAAAJc3Vic2NyaWJlAAAAAAAAAgAAAAAAAAAKc3Vic2NyaWJlcgAAAAAAEwAAAAAAAAAHcGVyaW9kcwAAAAAEAAAAAQAAA+kAAAAGAAAAAw==",
        "AAAAAAAAAAAAAAAKZ2V0X2V4cGlyeQAAAAAAAQAAAAAAAAAKc3Vic2NyaWJlcgAAAAAAEwAAAAEAAAAG",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAA1wYXltZW50X3Rva2VuAAAAAAAAEwAAAAAAAAALcmV3YXJkX3Bvb2wAAAAAEwAAAAAAAAAQcHJpY2VfcGVyX3BlcmlvZAAAAAsAAAAAAAAADnBlcmlvZF9zZWNvbmRzAAAAAAAGAAAAAQAAA+kAAAACAAAAAw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    is_active: this.txFromJSON<boolean>,
        set_price: this.txFromJSON<Result<void>>,
        subscribe: this.txFromJSON<Result<u64>>,
        get_expiry: this.txFromJSON<u64>,
        initialize: this.txFromJSON<Result<void>>
  }
}