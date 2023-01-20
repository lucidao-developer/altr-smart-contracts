// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "../interfaces/IStakingService.sol";

contract TestFarm is ERC165, IStakingService {
	uint256 private immutable _stakedTokens;
	address private immutable _stakingToken;

	struct PoolInfo {
		address stakingToken;
		uint256 stakingTokenTotalAmount;
		uint256 accLCDPerShare;
		uint32 lastRewardTime;
		uint16 allocPoint;
	}
	PoolInfo[] public poolInfo;

	constructor(address stakingToken, uint256 stakedTokens) {
		_stakingToken = stakingToken;
		_stakedTokens = stakedTokens;

		PoolInfo memory _poolInfo = PoolInfo(_stakingToken, 1000, 1000, uint32(block.number), 10);
		poolInfo.push(_poolInfo);
	}

	function poolStakingToken(uint256 pid) external view returns (address) {
		return poolInfo[pid].stakingToken;
	}

	function userInfo(uint256 pid, address user) external view returns (uint256) {
		return _stakedTokens;
	}

	function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
		return interfaceId == type(IStakingService).interfaceId || super.supportsInterface(interfaceId);
	}
}
