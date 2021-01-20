/**
 * Store number
 */

import {
  establishConnection,
  establishPayer,
  loadProgram,
  storeNumber,
  reportNum,
} from './store_number';

async function main() {
  console.log("Let's store number to a Solana account...");

  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Load the program if not already loaded
  await loadProgram();

  // Store the number
  await storeNumber(Number(process.argv[2]));

  // Load the number has been stored
  await reportNum();

  console.log('Success');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
