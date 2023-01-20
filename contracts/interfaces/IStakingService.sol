// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IStakingService {
	function poolStakingToken(uint256 pid) external view returns (address);

	function userInfo(uint256 pid, address user) external view returns (uint256);
}
