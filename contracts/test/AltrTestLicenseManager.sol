// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../AltrLicenseManager.sol";

contract AltrTestLicenseManager is AltrLicenseManager {
	constructor(
		address _stakingService,
		uint256 _stakingServicePid,
		uint256 _stakedTokensForOracleEligibility
	) AltrLicenseManager(_stakingService, _stakingServicePid, _stakedTokensForOracleEligibility) {}

	function isAQualifiedOracle(address oracle) external view override returns (bool possibility) {
		return false;
	}
}
