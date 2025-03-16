#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("Ck1Nt6DDLVTG4Ct76bQPMQFGoZfpici7akiAU42Ec15T");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll( ctx: Context<InitializePoll>,
                            poll_id: u64,
                            description: String,
                            poll_start: u64,
                            poll_end: u64) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.description = description;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.candidate_amount = 0;
        Ok(())
    }

    pub fn initialize_candidate(ctx: Context<InitializeCandidate>,
                                candidate_name: String, //안쓸수도 있으면 앞에 _붙이기
                                _poll_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        let poll = &mut ctx.accounts.poll;
        poll.candidate_amount += 1;
        candidate.candidate_name = candidate_name;
        candidate.candidate_votes = 0;
        Ok(())
    }
     
    pub fn vote(ctx: Context<Vote>, candidate_name: String, _poll_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_votes += 1;
        msg!("Voted for {}", candidate.candidate_name);
        msg!("Current votes: {}", candidate.candidate_votes);
        Ok(())
    }

}

// #[account]: "무엇을 저장할 것인가?"
// #[derive(Accounts)]: "어떤 계정들이 필요한가?"

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {

    pub signer: Signer<'info>,

    #[account(
        seeds=[poll_id.to_le_bytes().as_ref()], 
        bump,
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut, // 실제 계정의 데이터 변하게 하려면 mut 추가해야함 => 그래야 fn vote에서 candidate 변경 가능
        seeds=[poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()], 
        bump,
    )]
    pub candidate: Account<'info, Candidate>,

}

#[derive(Accounts)] // instrunction context 정의, 특정 명령어 실행에 필요한 계정들의 집합 정의
#[instruction(candidate_name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    // 투표 계정
    #[account(
        mut, // 실제 계정의 데이터 변하게 하려면 mut 추가해야함 => 그래야 fn vote에서 candidate 변경 가능
        seeds=[poll_id.to_le_bytes().as_ref()], 
        bump,
    )]
    pub poll: Account<'info, Poll>,

    // 후보자 계정
    #[account(
        init, 
        payer=signer, 
        space=8 + Candidate::INIT_SPACE, 

        //결정론적 주소: 동일한 seeds는 항상 동일한 PDA 생성
        seeds=[poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()], 
        bump,
    )]
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}

#[account] // 실제로 블록체인에 저장되는 데이터의 형식 정의, 계정에 실제로 저장될 데이터 필드 정의
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(280)]
    pub candidate_name: String,
    pub candidate_votes: u64,
}



#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init, 
        payer=signer, 
        space=8 + Poll::INIT_SPACE, 
        seeds=[poll_id.to_le_bytes().as_ref()], 
        bump,
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(280)]
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidate_amount: u64,
}
