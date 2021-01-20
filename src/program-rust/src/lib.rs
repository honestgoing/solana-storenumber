use byteorder::{ByteOrder, LittleEndian};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    info,
    program_error::ProgramError,
    pubkey::Pubkey,
};
use std::mem;
use std::convert::TryInto;

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
fn process_instruction(
    program_id: &Pubkey, // Public key of the account the store number program was loaded into
    accounts: &[AccountInfo], // account to store the number
    instruction_data: &[u8],
) -> ProgramResult {
    info!("Number upload Rust program entrypoint");

    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to store number to
    let account = next_account_info(accounts_iter)?;

    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        info!("Store account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    // The data must be large enough to hold a u64 count
    if account.try_data_len()? < mem::size_of::<u32>() {
        info!("Store account data length too small for u32");
        return Err(ProgramError::InvalidAccountData);
    }

    // Store the number to the account
    let mut data = account.try_borrow_mut_data()?;
    let num = instruction_data.try_into().ok().map(u32::from_le_bytes).ok_or(ProgramError::InvalidInstructionData)?;
    LittleEndian::write_u32(&mut data[0..], num);

    info!("Number saved!");

    Ok(())
}

// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;

    #[test]
    fn test_sanity() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; mem::size_of::<u64>()];
        LittleEndian::write_u64(&mut data, 0);
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        let mut instruction_data = vec![0; mem::size_of::<u32>()];
        
        let accounts = vec![account];
        
        assert_eq!(LittleEndian::read_u32(&accounts[0].data.borrow()), 0);
        let forty_two= 42_u32;
        LittleEndian::write_u32(&mut instruction_data[0..], forty_two);
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(LittleEndian::read_u32(&accounts[0].data.borrow()), forty_two);
        let triple_six= 666_u32;
        LittleEndian::write_u32(&mut instruction_data[0..], triple_six);
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(LittleEndian::read_u32(&accounts[0].data.borrow()), triple_six);
    }
}
