import { ethers } from "ethers";

export const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const NFT_MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
export const NFT_MINTER_ROLE_MANAGER = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE_MANAGER"));
export const VAULT_MANAGER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VAULT_MANAGER_ROLE"));
export const SALE_ISSUER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SALE_ISSUER_ROLE"));
export const LIST_MANAGER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LIST_MANAGER_ROLE"));
export const BURN_MANAGER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("BURN_MANAGER_ROLE"));
export const TRADE_CHECKER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TRADE_CHECKER_ROLE"));
export const ZERO_EX_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ZERO_EX_ROLE"));
export const VALUATION_EXPERT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VALUATION_EXPERT_ROLE"));
