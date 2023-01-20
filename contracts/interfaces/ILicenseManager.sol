// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ILicenseManager {
	function getDiscount(address user) external view returns (uint256);

	function isAQualifiedOracle(address oracle) external view returns (bool);
}
