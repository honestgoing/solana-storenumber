/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  Account,
  Connection,
  BpfLoader,
  BPF_LOADER_PROGRAM_ID,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import fs from 'mz/fs';

// @ts-ignore
import BufferLayout from 'buffer-layout';

import {url, urlTls} from './util/url';
import {Store} from './util/store';
import {newAccountWithLamports} from './util/new-account-with-lamports';

/**
 * Connection to the network
 */
let connection: Connection;

/**
 * Connection to the network
 */
let payerAccount: Account;

/**
 * Store number's program id
 */
let programId: PublicKey;

/**
 * The public key of the account we are storing to
 */
let storePubkey: PublicKey;

const pathToProgram = 'dist/program/storenumber.so';

/**
 * Layout of the greeted account data
 */
const storeAccountDataLayout = BufferLayout.struct([
  BufferLayout.u32('num'),
]);

/**
 * Establish a connection to the cluster
 */
export async function establishConnection(): Promise<void> {
  connection = new Connection(url, 'singleGossip');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', url, version);
}

/**
 * Establish an account to pay for everything
 */
export async function establishPayer(): Promise<void> {
  if (!payerAccount) {
    let fees = 0;
    const {feeCalculator} = await connection.getRecentBlockhash();

    // Calculate the cost to load the program
    const data = await fs.readFile(pathToProgram);
    const NUM_RETRIES = 500; // allow some number of retries
    fees +=
      feeCalculator.lamportsPerSignature *
        (BpfLoader.getMinNumSignatures(data.length) + NUM_RETRIES) +
      (await connection.getMinimumBalanceForRentExemption(data.length));

    // Calculate the cost to fund the greeter account
    fees += await connection.getMinimumBalanceForRentExemption(
      storeAccountDataLayout.span,
    );

    // Calculate the cost of sending the transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag

    // Fund a new payer via airdrop
    payerAccount = await newAccountWithLamports(connection, fees);
  }

  const lamports = await connection.getBalance(payerAccount.publicKey);
  console.log(
    'Using account',
    payerAccount.publicKey.toBase58(),
    'containing',
    lamports / LAMPORTS_PER_SOL,
    'Sol to pay for fees',
  );
}

/**
 * Load the store number BPF program if not already loaded
 */
export async function loadProgram(): Promise<void> {
  const store = new Store();

  // Check if the program has already been loaded
  try {
    const config = await store.load('config.json');
    programId = new PublicKey(config.programId);
    storePubkey = new PublicKey(config.storePubkey);
    await connection.getAccountInfo(programId);
    console.log('Program already loaded to account', programId.toBase58());
    return;
  } catch (err) {
    // try to load the program
  }

  // Load the program
  console.log('Loading store number program...');
  const data = await fs.readFile(pathToProgram);
  const programAccount = new Account();
  await BpfLoader.load(
    connection,
    payerAccount,
    programAccount,
    data,
    BPF_LOADER_PROGRAM_ID,
  );
  programId = programAccount.publicKey;
  console.log('Program loaded to account', programId.toBase58());

  // Create the store account
  const storeAccount = new Account();
  storePubkey = storeAccount.publicKey;
  console.log('Creating account', storePubkey.toBase58(), 'to store number to');
  const space = storeAccountDataLayout.span;
  const lamports = await connection.getMinimumBalanceForRentExemption(
    storeAccountDataLayout.span,
  );
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerAccount.publicKey,
      newAccountPubkey: storePubkey,
      lamports,
      space,
      programId,
    }),
  );
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [payerAccount, storeAccount],
    {
      commitment: 'singleGossip',
      preflightCommitment: 'singleGossip',
    },
  );

  // Save this info for next time
  await store.save('config.json', {
    programId: programId.toBase58(),
    storePubkey: storePubkey.toBase58(),
  });
}

/**
 * Store number
 */
export async function storeNumber(num: number): Promise<void> {
  console.log(`Store number ${num} to`, storePubkey.toBase58());
  let data = Buffer.alloc(4);
  storeAccountDataLayout.encode({
    num,
  }, data)
  const instruction = new TransactionInstruction({
    keys: [{pubkey: storePubkey, isSigner: false, isWritable: true}],
    programId,
    data,
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerAccount],
    {
      commitment: 'singleGossip',
      preflightCommitment: 'singleGossip',
    },
  );
}

/**
 * Report the number of the account has been stored
 */
export async function reportNum(): Promise<void> {
  const accountInfo = await connection.getAccountInfo(storePubkey);
  if (accountInfo === null) {
    throw 'Error: cannot find the store account';
  }
  const info = storeAccountDataLayout.decode(Buffer.from(accountInfo.data));
  console.log(
    storePubkey.toBase58(),
    'has stored number:',
    info.num.toString(),
  );
}
