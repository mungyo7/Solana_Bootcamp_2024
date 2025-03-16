#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("FX6obMKSmgdg5FygYaVqsytTfswENphFiPJ9v5NsFa1B"); //program id

#[program]
pub mod ch4_crud_app {
    use super::*;

    pub fn create_journal_entry(ctx: Context<CreateEntry>, title: String, message: String) -> Result<()> {
      let journal_entry = &mut ctx.accounts.journal_entry;
      journal_entry.owner = *ctx.accounts.signer.key;
      journal_entry.title = title;
      journal_entry.message = message;
      Ok(())
    }

    pub fn update_journal_entry(ctx: Context<UpdateEntry>, _title: String, message: String) -> Result<()> {
      let journal_entry = &mut ctx.accounts.journal_entry;
      journal_entry.message = message;
      Ok(())
    }

    pub fn delete_journal_entry(_ctx: Context<DeleteEntry>, _title: String) -> Result<()> {
      Ok(())
    }
    
}

#[derive(Accounts)]
#[instruction(title: String, message: String)]
pub struct CreateEntry<'info> {

  #[account(mut)] //signer는 매번 바뀌므로 mut로 선언
  pub signer: Signer<'info>,

  #[account(
    init,
    payer=signer,
    space=8 + JournalEntryState::INIT_SPACE,
    seeds=[title.as_bytes(), signer.key().as_ref()],
    bump
  )]
  pub journal_entry: Account<'info, JournalEntryState>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdateEntry<'info> {

  #[account(mut)] //signer는 매번 바뀌므로 mut로 선언
  pub signer: Signer<'info>,

  #[account(
    mut,
    seeds=[title.as_bytes(), signer.key().as_ref()], //createEntry에서 생성한 계정 사용(같은 시드는 같은 계정)
    bump,
    realloc = 8 + JournalEntryState::INIT_SPACE,
    realloc::payer=signer, //공간 재할당 추가지불 or 환불
    realloc::zero=true, //공간 재할당 시 0으로 초기화 여부
  )]
  pub journal_entry: Account<'info, JournalEntryState>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteEntry<'info> {
  #[account(mut)]
  pub signer: Signer<'info>,
  
  #[account(
    mut,
    seeds=[title.as_bytes(), signer.key().as_ref()],
    bump,
    close=signer,
  )]
  pub journal_entry: Account<'info, JournalEntryState>,

  pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)] //공간 계산
pub struct JournalEntryState {
  pub owner: Pubkey,
  #[max_len(50)]
  pub title: String,
  #[max_len(1000)]
  pub message: String,
}


  