<p align="center">
  <a href="https://solana.com">
    <img alt="Solana" src="https://i.imgur.com/OMnvVEz.png" width="250" />
  </a>
</p>

# Store Number on Solana

This project demonstrates how to use the [Solana Javascript
API](https://github.com/solana-labs/solana-web3.js) to build, deploy, and
interact with programs on the Solana blockchain.

The project comprises of:

* An on-chain store number program
* A client that can store a number to an account and get back the number has been stored

## Table of Contents
- [Store Number on Solana](#store-number-on-solana)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
    - [Start local Solana cluster](#start-local-solana-cluster)
    - [Build the on-chain program](#build-the-on-chain-program)
    - [Run the client](#run-the-client)
    - [Expected output](#expected-output)
      - [Not seeing the expected output?](#not-seeing-the-expected-output)
    - [Customizing the Program](#customizing-the-program)
  - [Learn about Solana](#learn-about-solana)
  - [Learn about the client](#learn-about-the-client)
    - [Entrypoint](#entrypoint)
    - [Establish a connection to the cluster](#establish-a-connection-to-the-cluster)
    - [Load the storenumber on-chain program if not already loaded](#load-the-storenumber-on-chain-program-if-not-already-loaded)
    - [Send a "Store number" transaction to the on-chain program](#send-a-store-number-transaction-to-the-on-chain-program)
    - [Query the Solana account used in the "Store number" transaction](#query-the-solana-account-used-in-the-store-number-transaction)
  - [Learn about the on-chain program](#learn-about-the-on-chain-program)
    - [Programming on Solana](#programming-on-solana)
  - [Pointing to a public Solana cluster](#pointing-to-a-public-solana-cluster)
  - [Expand your skills with advanced examples](#expand-your-skills-with-advanced-examples)

## Quick Start

[![Open in
Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/honestgoing/solana-storenumber)

If you decide to open in Gitpod then refer to
[README-gitpod.md](README-gitpod.md), otherwise continue reading.

The following dependencies are required to build and run this example, depending
on your OS, they may already be installed:

- Install node
- Install npm
- Install the latest Rust stable from https://rustup.rs/
- Install Solana v1.5.3 or later from
  https://docs.solana.com/cli/install-solana-cli-tools

If this is your first time using Rust, these [Installation
Notes](README-installation-notes.md) might be helpful.

### Start local Solana cluster

This example connects to a local Solana cluster by default.

Enable on-chain program logs:
```bash
$ export RUST_LOG=solana_runtime::system_instruction_processor=trace,solana_runtime::message_processor=debug,solana_bpf_loader=debug,solana_rbpf=debug
```

Start a local Solana cluster:
```bash
$ solana-test-validator --log
```

### Build the on-chain program

```bash
$ npm run build:program-rust
```

### Run the client

```bash
$ npm run start 42
```

### Expected output

Public key values will differ:

```
Let's store number to a Solana account...
Connection to cluster established: http://localhost:8899 { 'solana-core': '1.5.3', 'feature-set': 1441058695 }
Using account 8n2ch9ScAXoQNmZV4qun5mSsqQfK1GfSieqBRdXPhpGC containing 0.1484356 Sol to pay for fees
Loading store number program...
Program loaded to account H8VcqggncztbKTZWkfJ6eCE7a3jjC5EHXQJpJpxi6Azk
Creating account 4T7Ub5EMzYcZHCrerLGBRYjSBTSWumJi7Tx7LxRKuzvM to store number to
Store number 42 to 4T7Ub5EMzYcZHCrerLGBRYjSBTSWumJi7Tx7LxRKuzvM
4T7Ub5EMzYcZHCrerLGBRYjSBTSWumJi7Tx7LxRKuzvM has stored number: 42
Success
```

#### Not seeing the expected output?

- Ensure you've [started the local cluster](#start-local-solana-cluster) and
  [built the on-chain program](#build-the-on-chain-program).
- The cluster output log should include program log messages that indicate why
  the program failed.
  - `program log: <message>`
- Inspect the Solana cluster logs looking for any failed transactions or failed
  on-chain programs
  - Expand the log filter and restart the cluster to see more detail
    - ```bash
      $ export RUST_LOG=solana_runtime::native_loader=trace,solana_runtime::system_instruction_processor=trace,solana_runtime::bank=debug,solana_bpf_loader=debug,solana_rbpf=debug
      $ solana-test-validator --log

### Customizing the Program

To customize the example, make changes to the files under `/src`.  If you change
any files under `/src/program-rust` you will need to
[rebuild the on-chain program](#build-the-on-chain-program)

Now when you rerun `npm run start 42`, you should see the results of your changes.

## Learn about Solana

More information about how Solana works is available in the [Solana
documentation](https://docs.solana.com/) and all the source code is available on
[github](https://github.com/solana-labs/solana)

Further questions? Visit us on [Discord](https://discordapp.com/invite/pquxPsq)

## Learn about the client

The client in this example is written in JavaScript using:
- [Solana web3.js SDK](https://github.com/solana-labs/solana-web3.js)
- [Solana web3 API](https://solana-labs.github.io/solana-web3.js)

### Entrypoint

The [client's
entrypoint](./src/client/main.ts#L14)
does four things

### Establish a connection to the cluster

The client establishes a connection with the cluster by calling
[`establishConnection`](./src/client/store_number.ts#L59).

### Load the storenumber on-chain program if not already loaded

The process of loading a program on the cluster includes storing the shared
object's bytes in a Solana account's data vector and marking the account
executable.

The client loads the program by calling
[`loadProgram`](./src/client/store_number.ts#L106).
The first time `loadProgram` is called, the client:

- Reads the shared object from the file system
- Calculates the fees associated with loading the program
- Airdrops lamports to a payer account to pay for the load
- Loads the program via the Solana web3.js function
  ['BPFLoader.load'](https://github.com/solana-labs/solana-web3.js/blob/b86dcdbd1603cfa360cb79888590abebdcb393b2/src/bpf-loader.js#L36)
- Creates a new "store" account that will be used in the "Store number" transaction
- Records the [public
  key](https://github.com/solana-labs/solana-web3.js/blob/b86dcdbd1603cfa360cb79888590abebdcb393b2/src/publickey.js#L21)
  of both the loaded storenumber program and the "store" account in a config
  file.  Repeated calls to the client will refer to the same loaded program and
  "store" account.  (To force the reload of the program issue `npm
  clean:store`)

### Send a "Store number" transaction to the on-chain program

The client then constructs and sends a "Store number" transaction to the program by
calling
[`storeNumber`](./src/client/store_number.ts#L172).
The transaction contains a single very simple instruction that primarily carries
the public key of the storenumber program account to call and the "store"
account to which the client wishes to store number to and the number to store.

### Query the Solana account used in the "Store number" transaction

The client queries the
"store" account's data to discover the current number stored in the account by calling
[`reportNum`](./src/client/store_number.ts#L197)

## Learn about the on-chain program

The [on-chain storenumber program](src/program/Cargo.toml) is a Rust program
compiled to [Berkley Packet Filter
(BPF)](https://en.wikipedia.org/wiki/Berkeley_Packet_Filter) and stored as an
[Executable and Linkable Format (ELF) shared
object](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format).

The program is written using:
- [Solana Rust SDK](https://github.com/solana-labs/solana/tree/master/sdk)

### Programming on Solana

To learn more about Solana programming model refer to the [Programming Model
Overview](https://docs.solana.com/developing/programming-model/overview).

To learn more about developing programs on Solana refer to the [Deployed
Programs
Overview](https://docs.solana.com/developing/deployed-programs/overview)

## Pointing to a public Solana cluster

Solana maintains three public clusters:
- `devnet` - Development cluster with airdrops enabled
- `testnet` - Tour De Sol test cluster without airdrops enabled
- `mainnet-beta` -  Main cluster

Use npm scripts to configure which cluster.

To point to `devnet`:
```bash
$ npm run cluster:devnet
```

To point back to the local cluster:
```bash
$ npm run cluster:localnet
```

## Expand your skills with advanced examples

There is lots more to learn; The following examples demonstrate more advanced
features like custom errors, advanced account handling, suggestions for data
serialization, benchmarking, etc...

- [Programming
  Examples](https://github.com/solana-labs/solana-program-library/tree/master/examples)
- [Token
  Program](https://github.com/solana-labs/solana-program-library/tree/master/token)
- [Token Swap
  Program](https://github.com/solana-labs/solana-program-library/tree/master/token-swap)
